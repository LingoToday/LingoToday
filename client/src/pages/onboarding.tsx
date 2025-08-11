import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, User, GraduationCap, Mail, Lock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const languages = [
  { code: 'italian', name: 'Italian', flag: '🇮🇹' },
  { code: 'spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'french', name: 'French', flag: '🇫🇷' },
  { code: 'german', name: 'German', flag: '🇩🇪' },
];

const levels = [
  { 
    value: 'beginner', 
    title: 'Beginner', 
    description: 'New to the language or know just a few words' 
  },
  { 
    value: 'intermediate', 
    title: 'Intermediate', 
    description: 'Can have basic conversations and understand simple texts' 
  },
  { 
    value: 'advanced', 
    title: 'Advanced', 
    description: 'Comfortable with complex conversations and grammar' 
  },
];

export default function Onboarding() {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    // Reset level and unavailable state when language changes
    setSelectedLevel('');
    setShowUnavailable(false);
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    if (level === 'intermediate' || level === 'advanced') {
      setShowUnavailable(true);
    } else {
      setShowUnavailable(false);
    }
  };

  const handleStart = () => {
    // Store onboarding data in localStorage to use after authentication
    const onboardingData = {
      language: selectedLanguage,
      level: selectedLevel,
      completedOnboarding: true
    };
    
    localStorage.setItem('deskLingo_onboarding', JSON.stringify(onboardingData));
    
    // Redirect to Replit auth
    window.location.href = '/api/login';
  };

  const selectedLanguageData = languages.find(l => l.code === selectedLanguage);
  const selectedLevelData = levels.find(l => l.value === selectedLevel);

  const canProceed = selectedLanguage && selectedLevel && !showUnavailable;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">DeskLingo</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Start Your Learning Journey
          </h2>
          <p className="text-gray-600">
            Quick setup - takes less than 2 minutes
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Language Selection */}
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Which language would you like to learn?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose your target language to get started
                  </p>
                </div>
                {selectedLanguage && (
                  <CheckCircle className="w-6 h-6 text-green-600 ml-auto" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`p-4 text-left border-2 rounded-lg transition-colors ${
                      selectedLanguage === language.code
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <span className="font-medium text-gray-900">{language.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Level Selection */}
          <Card className={`bg-white shadow-lg border-0 ${!selectedLanguage ? 'opacity-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  selectedLanguage ? 'bg-primary' : 'bg-gray-400'
                }`}>
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    What's your current level?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedLanguageData ? `For ${selectedLanguageData.name}` : 'Select a language first'}
                  </p>
                </div>
                {selectedLevel && (
                  <CheckCircle className="w-6 h-6 text-green-600 ml-auto" />
                )}
              </div>
              
              <div className="space-y-3">
                {levels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => selectedLanguage && handleLevelSelect(level.value)}
                    disabled={!selectedLanguage}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                      selectedLevel === level.value
                        ? 'border-primary bg-primary/5'
                        : selectedLanguage
                        ? 'border-gray-200 hover:border-primary hover:bg-primary/5'
                        : 'border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{level.title}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Unavailable Level Warning (if needed) */}
          {showUnavailable && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <strong>Coming Soon for {selectedLevelData?.title} Learners:</strong><br />
                Our {selectedLanguageData?.name} course for {selectedLevelData?.title.toLowerCase()} learners 
                isn't available yet, but an interactive course will be coming soon!
              </AlertDescription>
            </Alert>
          )}

          {/* Step 3: Ready to Start */}
          {selectedLanguage && selectedLevel && !showUnavailable && (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ready to Start Learning?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sign in with Replit to start your 5-day free trial
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Your Preferences:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>Language:</span>
                        <span className="font-medium">{selectedLanguageData?.name} {selectedLanguageData?.flag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Level:</span>
                        <span className="font-medium">{selectedLevelData?.title}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleStart}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
                  >
                    Continue with Replit Authentication
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    You'll be redirected to Replit to sign in securely. Your preferences will be saved.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alternative Options for Unavailable Levels */}
          {showUnavailable && (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                    <GraduationCap className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleLevelSelect('beginner')}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Try Beginner Level Instead
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                      className="w-full"
                    >
                      Back to Homepage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}