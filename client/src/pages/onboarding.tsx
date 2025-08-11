import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, User, GraduationCap, Mail, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = 'language' | 'level' | 'register' | 'unavailable';

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
  const [step, setStep] = useState<Step>('language');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    // Since we're using Replit auth, we don't need to validate much here
    // Just store the preferences for after authentication
    return true;
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setTimeout(() => setStep('level'), 300);
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    if (level === 'intermediate' || level === 'advanced') {
      setTimeout(() => setStep('unavailable'), 300);
    } else {
      setTimeout(() => setStep('register'), 300);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Store onboarding data in localStorage to use after authentication
    const onboardingData = {
      language: selectedLanguage,
      level: selectedLevel,
      name: formData.name,
      email: formData.email,
      completedOnboarding: true
    };
    
    localStorage.setItem('deskLingo_onboarding', JSON.stringify(onboardingData));
    
    // Redirect to Replit auth
    window.location.href = '/api/login';
  };

  const selectedLanguageData = languages.find(l => l.code === selectedLanguage);
  const selectedLevelData = levels.find(l => l.value === selectedLevel);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-6">
            {/* Language Selection */}
            {step === 'language' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Which language would you like to learn?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose your target language to get started
                  </p>
                </div>
                
                <div className="space-y-3">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language.code)}
                      className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{language.flag}</span>
                        <span className="font-medium text-gray-900">{language.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Level Selection */}
            {step === 'level' && (
              <div>
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">{selectedLanguageData?.flag}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedLanguageData?.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    What's your current level?
                  </p>
                </div>
                
                <div className="space-y-3">
                  {levels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleLevelSelect(level.value)}
                      className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{level.title}</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Form */}
            {step === 'register' && (
              <div>
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">{selectedLanguageData?.flag}</span>
                    <span className="text-sm text-gray-600">
                      {selectedLanguageData?.name} • {selectedLevelData?.title}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Start Learning?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sign in with Replit to start your 5-day free trial
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Your Preferences:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Language: {selectedLanguageData?.name} {selectedLanguageData?.flag}</div>
                      <div>Level: {selectedLevelData?.title}</div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleRegister}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
                  >
                    Continue with Replit Authentication
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    You'll be redirected to Replit to sign in securely. Your preferences will be saved.
                  </p>
                </div>
              </div>
            )}

            {/* Unavailable Level */}
            {step === 'unavailable' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Coming Soon for {selectedLevelData?.title} Learners
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Our {selectedLanguageData?.name} course for {selectedLevelData?.title.toLowerCase()} learners 
                    isn't available yet, but an interactive course will be coming soon!
                  </p>
                </div>

                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Want to get notified when it's ready? We'll email you as soon as the 
                    {selectedLevelData?.title.toLowerCase()} {selectedLanguageData?.name} course launches.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setSelectedLevel('beginner');
                      setStep('register');
                    }}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}