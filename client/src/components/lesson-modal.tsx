import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Volume2, Check, X } from "lucide-react";

interface LessonModalProps {
  lesson: any;
  language: string;
  onClose: () => void;
}

export default function LessonModal({ lesson, language, onClose }: LessonModalProps) {
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiRequest("POST", "/api/progress", {
        language,
        courseId: "course1", // Default course ID
        lessonId: lesson.id,
        completed: true,
        score,
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", language] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", language] });
      
      toast({
        title: "Lesson completed!",
        description: "Great job! Keep up the learning streak.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        const redirectToLogin = () => {
          window.location.href = "/api/login";
        };
        setTimeout(redirectToLogin, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save lesson progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuizSubmit = () => {
    if (!selectedAnswer || !lesson?.quiz) return;
    
    const answerIndex = parseInt(selectedAnswer);
    const correct = answerIndex === lesson.quiz.correct;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleCompleteLesson = () => {
    const score = isCorrect ? 100 : 0;
    completeLessonMutation.mutate(score);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'spanish' ? 'es-ES' : 
                     language === 'french' ? 'fr-FR' :
                     language === 'italian' ? 'it-IT' :
                     language === 'german' ? 'de-DE' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {lesson.title}
              </DialogTitle>
              <p className="text-gray-600">Week 2, Day 3</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Lesson Content */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-4">{lesson.emoji}</div>
              <h3 className="text-2xl font-bold text-primary-700 mb-2">{lesson.content.word}</h3>
              <p className="text-primary-600 text-lg mb-4">{lesson.content.translation}</p>
              <Button 
                onClick={() => speakText(lesson.content.word)}
                className="bg-primary-500 text-white hover:bg-primary-600"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Listen
              </Button>
            </div>
          </div>
          
          {/* Example Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Example Usage</h4>
            <div className="space-y-2 text-gray-700">
              <p><strong>{language.charAt(0).toUpperCase() + language.slice(1)}:</strong> {lesson.content.example}</p>
              <p><strong>English:</strong> {lesson.content.exampleTranslation}</p>
            </div>
          </div>
          
          {/* Quick Quiz */}
          {lesson.quiz && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Check</h4>
              <p className="text-gray-700 mb-4">{lesson.quiz.question}</p>
              
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showResult}
                className="space-y-2 mb-4"
              >
                {lesson.quiz.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`modal-option-${index}`}
                      className={showResult ? (
                        index === lesson.quiz.correct ? 'border-success-500 text-success-500' :
                        index.toString() === selectedAnswer ? 'border-red-500 text-red-500' :
                        'border-gray-300'
                      ) : ''}
                    />
                    <Label 
                      htmlFor={`modal-option-${index}`}
                      className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                        showResult ? (
                          index === lesson.quiz.correct ? 'bg-success-50 text-success-700' :
                          index.toString() === selectedAnswer ? 'bg-red-50 text-red-700' :
                          'bg-gray-50'
                        ) : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {showResult && (
                <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-success-50 text-success-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {isCorrect ? 'Correct! Well done!' : `Incorrect. The correct answer is: ${lesson.quiz.options[lesson.quiz.correct]}`}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                {!showResult ? (
                  <Button 
                    onClick={handleQuizSubmit}
                    disabled={!selectedAnswer}
                    className="flex-1"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCompleteLesson}
                    disabled={completeLessonMutation.isPending}
                    className="flex-1 bg-success-500 hover:bg-success-600 text-white"
                  >
                    {completeLessonMutation.isPending ? 'Saving...' : 'Complete Lesson'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
