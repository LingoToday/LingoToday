import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Play, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Checkpoint, CheckpointQuestion } from "@shared/schema";

interface CheckpointPageProps {
  params: { id: string };
}

export function CheckpointPage({ params }: CheckpointPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  const checkpointId = parseInt(params.id);

  // Fetch checkpoint data
  const { data: checkpoint, isLoading } = useQuery({
    queryKey: ['/api/checkpoint', checkpointId],
    enabled: !isNaN(checkpointId),
  });

  // Save checkpoint progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      const response = await fetch('/api/checkpoint-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData),
      });
      if (!response.ok) throw new Error('Failed to save progress');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checkpoint-progress'] });
      toast({
        title: "Progress Saved",
        description: "Your checkpoint progress has been saved successfully.",
      });
    },
  });

  const questions: CheckpointQuestion[] = (checkpoint?.questions as CheckpointQuestion[]) || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCompleteCheckpoint();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteCheckpoint = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = calculateScore();
    
    setIsCompleted(true);
    setShowResults(true);

    // Save progress to backend
    saveProgressMutation.mutate({
      checkpointId,
      completed: true,
      score,
      answers: selectedAnswers,
      timeSpent,
      completedAt: new Date().toISOString(),
    });
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const getScorePercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading checkpoint...</p>
        </div>
      </div>
    );
  }

  if (!checkpoint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Checkpoint Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The checkpoint you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = getScorePercentage();
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                {passed ? (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {passed ? "Checkpoint Completed!" : "Keep Practicing"}
              </CardTitle>
              <CardDescription>
                {checkpoint.title} - {checkpoint.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {score}/{questions.length}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-300">
                  {percentage}% Score
                </div>
                <Badge variant={passed ? "default" : "destructive"} className="mt-2">
                  {passed ? "Passed" : "Try Again"}
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Review Your Answers:</h3>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {question.question}
                      </p>
                      <div className="text-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                          Your answer: <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                            {userAnswer || "Not answered"}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-green-600">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-blue-600 mt-1">
                            💡 {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                {!passed && (
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            size="sm" 
            className="mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-checkpoint-title">{checkpoint.title}</CardTitle>
              <CardDescription data-testid="text-checkpoint-description">
                {checkpoint.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <Badge variant="outline" data-testid="text-question-progress">
                  {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                </Badge>
              </div>
              <Progress 
                value={((currentQuestionIndex + 1) / questions.length) * 100} 
                className="mb-4" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" data-testid="text-current-question">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                {currentQuestion.audioUrl && (
                  <Button 
                    onClick={() => playAudio(currentQuestion.audioUrl!)}
                    variant="outline"
                    size="sm"
                    data-testid="button-play-audio"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Audio
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg mb-4" data-testid="text-question-content">
                {currentQuestion.question}
              </p>

              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    variant={selectedAnswers[currentQuestionIndex] === option ? "default" : "outline"}
                    className="w-full text-left justify-start h-auto p-4"
                    data-testid={`button-option-${index}`}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  data-testid="button-previous"
                >
                  Previous
                </Button>
                
                <Button 
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswers[currentQuestionIndex]}
                  data-testid="button-next"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}