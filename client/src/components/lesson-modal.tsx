import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Volume2, Check, X, ArrowLeft, ArrowRight } from "lucide-react";

interface LessonModalProps {
  lesson: any;
  language: string;
  onClose: () => void;
}

type Phase = 1 | 2 | 3;

export default function LessonModal({ lesson, language, onClose }: LessonModalProps) {
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState<Phase>(1);
  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());
  
  // Phase 1 state
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showPhase1Result, setShowPhase1Result] = useState(false);
  const [phase1Correct, setPhase1Correct] = useState(false);
  
  // Phase 2 state
  const [fillInAnswer, setFillInAnswer] = useState<string>("");
  const [showPhase2Result, setShowPhase2Result] = useState(false);
  const [phase2Correct, setPhase2Correct] = useState(false);
  
  // Phase 3 state
  const [phase3Answer, setPhase3Answer] = useState<string>("");
  const [showPhase3Result, setShowPhase3Result] = useState(false);
  const [phase3Correct, setPhase3Correct] = useState(false);

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

  // Phase handlers
  const handlePhase1Submit = () => {
    if (!selectedAnswer || !lesson?.quiz) return;
    
    const answerIndex = parseInt(selectedAnswer);
    const correct = answerIndex === lesson.quiz.correct;
    setPhase1Correct(correct);
    setShowPhase1Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 1 as Phase]));
    }
  };

  const handlePhase2Submit = () => {
    if (!fillInAnswer.trim()) return;
    
    // Check if the answer matches only the missing letters (case insensitive)
    const expectedLetters = getMissingLetters(lesson.content.word);
    const correct = fillInAnswer.toLowerCase().trim() === expectedLetters.toLowerCase();
    setPhase2Correct(correct);
    setShowPhase2Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 2 as Phase]));
    }
  };

  const handlePhase3Submit = () => {
    if (!phase3Answer) return;
    
    const answerIndex = parseInt(phase3Answer);
    // The first option is always correct for Phase 3 listening comprehension
    const correct = answerIndex === 0;
    setPhase3Correct(correct);
    setShowPhase3Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 3 as Phase]));
    }
  };

  const handleCompleteLesson = () => {
    const completedCount = completedPhases.size;
    const score = Math.round((completedCount / 3) * 100);
    completeLessonMutation.mutate(score);
  };

  const canNavigateToPhase = (phase: Phase) => {
    if (phase === 1) return true;
    if (phase === 2) return completedPhases.has(1);
    if (phase === 3) return completedPhases.has(1) && completedPhases.has(2);
    return false;
  };

  // Generate fill-in text for Phase 2 and get missing letters
  const generateFillInText = (word: string) => {
    // For phrases with spaces, show the first word and blank out the rest
    if (word.includes(' ')) {
      const parts = word.split(' ');
      return parts[0] + "_".repeat(word.length - parts[0].length);
    }
    // For single words
    if (word.length <= 3) return word.charAt(0) + "_".repeat(word.length - 1);
    return word.substring(0, 2) + "_".repeat(word.length - 2);
  };

  const getMissingLetters = (word: string) => {
    // For phrases with spaces, return everything after the first word (including the space)
    if (word.includes(' ')) {
      const firstSpaceIndex = word.indexOf(' ');
      return word.substring(firstSpaceIndex);
    }
    // For single words
    if (word.length <= 3) return word.substring(1);
    return word.substring(2);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {lesson.title}
              </DialogTitle>
              <p className="text-gray-600">{lesson.category}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Phase Navigation */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((phase) => (
            <button
              key={phase}
              onClick={() => canNavigateToPhase(phase as Phase) && setCurrentPhase(phase as Phase)}
              disabled={!canNavigateToPhase(phase as Phase)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPhase === phase
                  ? 'bg-blue-500 text-white'
                  : completedPhases.has(phase as Phase)
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : canNavigateToPhase(phase as Phase)
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {completedPhases.has(phase as Phase) ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{phase}</span>
              )}
              <span>
                {phase === 1 && 'Introduction & Recognition'}
                {phase === 2 && 'Retrieval & Practice'}
                {phase === 3 && 'Listening & Context'}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* Phase 1: Introduction & Recognition */}
          {currentPhase === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Phase 1 — Introduction & Recognition</h3>
              </div>

              {/* Word Introduction */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-3xl mb-4">{lesson.emoji}</div>
                  <h3 className="text-3xl font-bold text-blue-700 mb-2">{lesson.content.word}</h3>
                  <p className="text-blue-600 text-xl mb-4">{lesson.content.translation}</p>
                  <Button 
                    onClick={() => speakText(lesson.content.word)}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Audio: "{lesson.content.word}"
                  </Button>
                </div>
              </div>

              {/* Note */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Note:</strong> {lesson.content.note || 'Polite but still friendly. Good for strangers or when you want to be respectful without being too formal.'}
                </p>
              </div>

              {/* Multiple Choice */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Multiple Choice Question: {lesson.quiz?.question || `Which phrase means "${lesson.content.translation}"?`}</h4>
                
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  disabled={showPhase1Result}
                  className="space-y-3 mb-4"
                >
                  {(lesson.quiz?.options || [lesson.content.word, 'Ciao', 'Buongiorno', 'Buonanotte']).map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`phase1-option-${index}`}
                        className={showPhase1Result ? (
                          index === (lesson.quiz?.correct || 0) ? 'border-green-500 text-green-500' :
                          index.toString() === selectedAnswer ? 'border-red-500 text-red-500' :
                          'border-gray-300'
                        ) : ''}
                      />
                      <Label 
                        htmlFor={`phase1-option-${index}`}
                        className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                          showPhase1Result ? (
                            index === (lesson.quiz?.correct || 0) ? 'bg-green-50 text-green-700' :
                            index.toString() === selectedAnswer ? 'bg-red-50 text-red-700' :
                            'bg-gray-50'
                          ) : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {String.fromCharCode(97 + index)}) {option} {index === (lesson.quiz?.correct || 0) && showPhase1Result && '✅'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showPhase1Result && (
                  <div className={`p-4 rounded-lg mb-4 ${phase1Correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      {phase1Correct ? 'Correct! Well done!' : `Incorrect. The correct answer is: ${(lesson.quiz?.options || [lesson.content.word])[lesson.quiz?.correct || 0]}`}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {!showPhase1Result ? (
                    <Button 
                      onClick={handlePhase1Submit}
                      disabled={!selectedAnswer}
                      className="flex-1"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (phase1Correct) {
                          setCurrentPhase(2);
                        }
                      }}
                      disabled={!phase1Correct}
                      className="flex-1"
                    >
                      Continue to Phase 2 <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Phase 2: Retrieval & Controlled Practice */}
          {currentPhase === 2 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Phase 2 — Retrieval & Controlled Practice</h3>
              </div>

              {/* Fill in Exercise */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-purple-700 mb-4">Fill in the missing letters:</h4>
                  <div className="text-2xl font-mono mb-4">
                    "{generateFillInText(lesson.content.word)}" = {lesson.content.translation}
                  </div>
                  <div className="text-sm text-purple-600 mb-3">
                    Type only the missing letters
                  </div>
                  <Input
                    value={fillInAnswer}
                    onChange={(e) => setFillInAnswer(e.target.value)}
                    placeholder="Type the missing letters only"
                    className="text-center text-lg max-w-xs mx-auto"
                    disabled={showPhase2Result}
                  />
                </div>
              </div>

              {showPhase2Result && (
                <div className={`p-4 rounded-lg mb-4 ${phase2Correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {phase2Correct ? 'Excellent! You got it right!' : `Not quite. The missing letters are: ${getMissingLetters(lesson.content.word)}`}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentPhase(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 1
                </Button>
                {!showPhase2Result ? (
                  <Button 
                    onClick={handlePhase2Submit}
                    disabled={!fillInAnswer.trim()}
                    className="flex-1"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      if (phase2Correct) {
                        setCurrentPhase(3);
                      }
                    }}
                    disabled={!phase2Correct}
                    className="flex-1"
                  >
                    Continue to Phase 3 <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Phase 3: Listening & Contextual Application */}
          {currentPhase === 3 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Phase 3 — Listening & Contextual Application</h3>
              </div>

              {/* Audio Context */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-green-700 mb-4">Listen and Choose:</h4>
                  <Button 
                    onClick={() => speakText(`${lesson.content.word}, ciao!`)}
                    className="bg-green-500 text-white hover:bg-green-600 mb-4"
                    size="lg"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play: "{lesson.content.word}, ciao!"
                  </Button>
                  <p className="text-green-600">What did you hear?</p>
                </div>
              </div>

              {/* Multiple Choice for Context */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Choose the correct translation:</h4>
                
                <RadioGroup 
                  value={phase3Answer} 
                  onValueChange={setPhase3Answer}
                  disabled={showPhase3Result}
                  className="space-y-3 mb-4"
                >
                  {[
                    `${lesson.content.translation}, hi!`,
                    `${lesson.content.translation}, good evening!`,
                    `Goodbye, ${lesson.content.translation.toLowerCase()}!`,
                    `Good morning, hi!`
                  ].map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`phase3-option-${index}`}
                        className={showPhase3Result ? (
                          index === 0 ? 'border-green-500 text-green-500' :
                          index.toString() === phase3Answer ? 'border-red-500 text-red-500' :
                          'border-gray-300'
                        ) : ''}
                      />
                      <Label 
                        htmlFor={`phase3-option-${index}`}
                        className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                          showPhase3Result ? (
                            index === 0 ? 'bg-green-50 text-green-700' :
                            index.toString() === phase3Answer ? 'bg-red-50 text-red-700' :
                            'bg-gray-50'
                          ) : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {String.fromCharCode(97 + index)}) {option} {index === 0 && showPhase3Result && '✅'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showPhase3Result && (
                  <div className={`p-4 rounded-lg mb-4 ${phase3Correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      {phase3Correct ? 'Perfect! You completed all phases!' : `Not quite. The correct answer is: ${lesson.content.translation}, hi!`}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPhase(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phase 2
                  </Button>
                  {!showPhase3Result ? (
                    <Button 
                      onClick={handlePhase3Submit}
                      disabled={!phase3Answer}
                      className="flex-1"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCompleteLesson}
                      disabled={completeLessonMutation.isPending}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      {completeLessonMutation.isPending ? 'Saving...' : 'Complete Lesson'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
