import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, User, GraduationCap, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Star, Smartphone, Monitor, RotateCcw, Bell, BellOff, Calendar, Video, Zap, Target, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import Footer from "@/components/ui/footer";
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: 'italian', name: 'Italian', flag: '🇮🇹' },
  { code: 'spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'german', name: 'German', flag: '🇩🇪' },
  { code: 'french', name: 'French', flag: '🇫🇷' },
];

const levels = [
  { 
    value: 'beginner', 
    title: 'Beginner', 
    description: "I'm starting fresh" 
  },
  { 
    value: 'intermediate', 
    title: 'Intermediate', 
    description: 'I can hold conversations, but want to level up' 
  },
  { 
    value: 'expert', 
    title: 'Expert', 
    description: 'I want fluency and polish' 
  },
];

const learningStyles = [
  {
    value: 'mobile',
    title: 'Mobile App',
    icon: '📱',
    description: 'Learn on the go, anytime'
  },
  {
    value: 'desktop',
    title: 'Desktop',
    icon: '💻',
    description: 'Learn at your desk in quick daily bursts'
  },
  {
    value: 'both',
    title: 'Both',
    icon: '🔄',
    description: 'Seamless sync across devices'
  }
];

export default function Onboarding() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLearningStyle, setSelectedLearningStyle] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lingoToday_onboarding_temp');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.language) setSelectedLanguage(data.language);
        if (data.level) setSelectedLevel(data.level);
        if (data.learningStyle) setSelectedLearningStyle(data.learningStyle);
        if (data.notifications !== undefined) setNotificationsEnabled(data.notifications);
        if (data.currentScreen !== undefined) setCurrentScreen(data.currentScreen);
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      }
    }
  }, []);
  
  // Save to localStorage whenever data changes
  const saveToLocalStorage = () => {
    const data = {
      language: selectedLanguage,
      level: selectedLevel,
      learningStyle: selectedLearningStyle,
      notifications: notificationsEnabled,
      currentScreen
    };
    localStorage.setItem('lingoToday_onboarding_temp', JSON.stringify(data));
  };
  
  useEffect(() => {
    if (selectedLanguage || selectedLevel || selectedLearningStyle) {
      saveToLocalStorage();
    }
  }, [selectedLanguage, selectedLevel, selectedLearningStyle, notificationsEnabled, currentScreen]);
  
  // Registration data
  const [registerData, setRegisterData] = useState({
    firstName: '',
    email: '',
    password: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const totalScreens = 7;

  const nextScreen = () => {
    if (currentScreen < totalScreens - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentScreen(currentScreen + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const canContinueFromScreen = (screen: number) => {
    switch (screen) {
      case 0: return selectedLanguage !== '';
      case 1: return selectedLevel !== '';
      case 2: return selectedLearningStyle !== '';
      case 3: return registerData.firstName.trim() && registerData.email.trim() && registerData.password.length >= 6;
      case 4: return true; // Notifications screen always allows continue
      case 5: return true; // Learning plan screen
      case 6: return true; // Payment screen
      default: return false;
    }
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
  };

  const handleLearningStyleSelect = (style: string) => {
    setSelectedLearningStyle(style);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        setNotificationsEnabled(granted);
        // Update localStorage immediately after permission is resolved
        const data = {
          language: selectedLanguage,
          level: selectedLevel,
          learningStyle: selectedLearningStyle,
          notifications: granted,
          currentScreen
        };
        localStorage.setItem('lingoToday_onboarding_temp', JSON.stringify(data));
        return granted;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        setNotificationsEnabled(false);
        return false;
      }
    }
    return false;
  };

  const handleRegister = async () => {
    // Clear previous errors
    setRegisterErrors({});
    
    // Validation
    const errors: Record<string, string> = {};
    if (!registerData.firstName.trim()) errors.firstName = 'Name is required';
    if (!registerData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) errors.email = 'Please enter a valid email';
    if (registerData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setIsRegistering(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerData.firstName.trim(),
          email: registerData.email.trim(),
          password: registerData.password,
          selectedLanguage: selectedLanguage,
          selectedLevel: selectedLevel,
          learningStyle: selectedLearningStyle,
          notificationsEnabled: notificationsEnabled,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store onboarding preferences  
        const onboardingData = {
          language: selectedLanguage,
          level: selectedLevel,
          learningStyle: selectedLearningStyle,
          notifications: notificationsEnabled,
          completedOnboarding: true
        };
        localStorage.setItem('lingoToday_onboarding', JSON.stringify(onboardingData));
        
        // Auto-login after successful registration
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registerData.email,
            password: registerData.password,
          }),
        });

        if (loginResponse.ok) {
          setRegistrationComplete(true);
          toast({ title: 'Account created successfully!' });
          // Clear temporary localStorage and save final preferences
          const finalData = {
            language: selectedLanguage,
            level: selectedLevel,
            learningStyle: selectedLearningStyle,
            notifications: notificationsEnabled,
            completedOnboarding: true
          };
          localStorage.setItem('lingoToday_onboarding', JSON.stringify(finalData));
          localStorage.removeItem('lingoToday_onboarding_temp');
          // Auto-advance to next screen after a brief delay
          setTimeout(() => {
            nextScreen();
          }, 1500);
        } else {
          setRegisterErrors({ general: 'Registration successful but login failed. Please try signing in.' });
        }
      } else {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((error: any) => {
            fieldErrors[error.path?.[0] || 'general'] = error.message;
          });
          setRegisterErrors(fieldErrors);
        } else {
          setRegisterErrors({ general: data.message || 'Registration failed' });
        }
      }
    } catch (error) {
      setRegisterErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterInputChange = (field: keyof typeof registerData, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (registerErrors[field]) {
      setRegisterErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedLanguageData = languages.find(l => l.code === selectedLanguage);
  const selectedLevelData = levels.find(l => l.value === selectedLevel);
  const selectedLearningStyleData = learningStyles.find(l => l.value === selectedLearningStyle);

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <LanguageSelectionScreen 
          selectedLanguage={selectedLanguage} 
          onLanguageSelect={handleLanguageSelect}
          languages={languages}
        />;
      case 1:
        return <LevelSelectionScreen 
          selectedLevel={selectedLevel} 
          onLevelSelect={handleLevelSelect}
          levels={levels}
        />;
      case 2:
        return <LearningStyleScreen 
          selectedStyle={selectedLearningStyle} 
          onStyleSelect={handleLearningStyleSelect}
          styles={learningStyles}
        />;
      case 3:
        return <RegistrationScreen 
          registerData={registerData}
          registerErrors={registerErrors}
          isRegistering={isRegistering}
          onInputChange={handleRegisterInputChange}
          onRegister={handleRegister}
          registrationComplete={registrationComplete}
        />;
      case 4:
        return <NotificationScreen 
          notificationsEnabled={notificationsEnabled}
          onRequestPermission={requestNotificationPermission}
        />;
      case 5:
        return <LearningPlanScreen 
          selectedLanguage={selectedLanguageData}
          selectedLevel={selectedLevelData}
          selectedStyle={selectedLearningStyleData}
        />;
      case 6:
        return <PaymentScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentScreen + 1) / totalScreens) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Step {currentScreen + 1} of {totalScreens}
          </p>
        </div>

        {/* Screen container with slide animation */}
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          {renderScreen()}
        </div>

        {/* Continue button - hide on registration screen unless registration is complete */}
        {currentScreen < 6 && !(currentScreen === 3 && !registrationComplete) && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={nextScreen}
              disabled={!canContinueFromScreen(currentScreen) || isTransitioning}
              className="px-8 py-3 text-lg font-medium"
              data-testid={`button-continue-${currentScreen}`}
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Screen Components
const LanguageSelectionScreen = ({ selectedLanguage, onLanguageSelect, languages }: {
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  languages: { code: string; name: string; flag: string; }[];
}) => (
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      Pick your language to master
    </h1>
    <p className="text-gray-600 mb-8 text-lg">
      Learn with science backed micro lessons, designed for your day.
    </p>
    
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => onLanguageSelect(language.code)}
          className={`p-6 text-center border-2 rounded-xl transition-all transform hover:scale-105 ${
            selectedLanguage === language.code
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          }`}
          data-testid={`button-language-${language.code}`}
        >
          <div className="text-4xl mb-2">{language.flag}</div>
          <div className="font-semibold text-gray-900">{language.name}</div>
        </button>
      ))}
    </div>
  </div>
);

const LevelSelectionScreen = ({ selectedLevel, onLevelSelect, levels }: {
  selectedLevel: string;
  onLevelSelect: (level: string) => void;
  levels: { value: string; title: string; description: string; }[];
}) => (
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      What's your starting point?
    </h1>
    <p className="text-gray-600 mb-8 text-lg">
      Your plan will adapt to your current skill level.
    </p>
    
    <div className="space-y-4 max-w-lg mx-auto">
      {levels.map((level) => (
        <button
          key={level.value}
          onClick={() => onLevelSelect(level.value)}
          className={`w-full p-6 text-left border-2 rounded-xl transition-all ${
            selectedLevel === level.value
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          }`}
          data-testid={`button-level-${level.value}`}
        >
          <div className="font-bold text-xl text-gray-900 mb-2">{level.title}</div>
          <div className="text-gray-600 text-base">"{level.description}"</div>
        </button>
      ))}
    </div>
  </div>
);

const LearningStyleScreen = ({ selectedStyle, onStyleSelect, styles }: {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
  styles: { value: string; title: string; icon: string; description: string; }[];
}) => (
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      Where will you learn?
    </h1>
    <p className="text-gray-600 mb-8 text-lg">
      LingoToday works everywhere—your progress follows you.
    </p>
    
    <div className="space-y-4 max-w-lg mx-auto">
      {styles.map((style) => (
        <button
          key={style.value}
          onClick={() => onStyleSelect(style.value)}
          className={`w-full p-6 text-left border-2 rounded-xl transition-all flex items-center space-x-4 ${
            selectedStyle === style.value
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          }`}
          data-testid={`button-style-${style.value}`}
        >
          <div className="text-3xl">{style.icon}</div>
          <div>
            <div className="font-bold text-xl text-gray-900 mb-1">{style.title}</div>
            <div className="text-gray-600">"{style.description}"</div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const RegistrationScreen = ({ 
  registerData, 
  registerErrors, 
  isRegistering, 
  onInputChange, 
  onRegister,
  registrationComplete
}: {
  registerData: { firstName: string; email: string; password: string; };
  registerErrors: Record<string, string>;
  isRegistering: boolean;
  onInputChange: (field: keyof typeof registerData, value: string) => void;
  onRegister: () => void;
  registrationComplete: boolean;
}) => {
  if (registrationComplete) {
    return (
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Account Created! 
        </h1>
        <p className="text-gray-600 text-lg">
          You're all set to begin your learning journey.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Create your free account
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        Start in under 30 seconds. No card required now.
      </p>
      
      {registerErrors.general && (
        <Alert className="border-red-200 bg-red-50 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {registerErrors.general}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4 max-w-md mx-auto text-left">
        <div>
          <Label htmlFor="firstName">Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your name"
            value={registerData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            className={registerErrors.firstName ? 'border-red-500' : ''}
            data-testid="input-firstName"
          />
          {registerErrors.firstName && <p className="text-red-500 text-sm mt-1">{registerErrors.firstName}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={registerData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className={registerErrors.email ? 'border-red-500' : ''}
            data-testid="input-email"
          />
          {registerErrors.email && <p className="text-red-500 text-sm mt-1">{registerErrors.email}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Choose a secure password"
            value={registerData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            className={registerErrors.password ? 'border-red-500' : ''}
            data-testid="input-password"
          />
          {registerErrors.password && <p className="text-red-500 text-sm mt-1">{registerErrors.password}</p>}
        </div>

        <Button 
          onClick={onRegister}
          disabled={isRegistering}
          className="w-full mt-6"
          data-testid="button-register"
        >
          {isRegistering ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </div>
  );
};

const NotificationScreen = ({ 
  notificationsEnabled, 
  onRequestPermission 
}: {
  notificationsEnabled: boolean;
  onRequestPermission: () => Promise<boolean>;
}) => {
  const [hasRequested, setHasRequested] = useState(false);
  
  const handleEnableNotifications = async () => {
    setHasRequested(true);
    await onRequestPermission();
  };

  if (hasRequested) {
    return (
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          notificationsEnabled ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {notificationsEnabled ? (
            <Bell className="w-8 h-8 text-green-600" />
          ) : (
            <BellOff className="w-8 h-8 text-yellow-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {notificationsEnabled ? 'Notifications Enabled!' : 'No Problem!'}
        </h1>
        <p className="text-gray-600 text-lg">
          {notificationsEnabled 
            ? "We'll send gentle reminders to keep you on track." 
            : "You can always enable notifications later in settings."}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Bell className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Stay on track with gentle nudges
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        We'll remind you at the perfect moments so you never miss a lesson.
      </p>
      
      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          onClick={handleEnableNotifications}
          className="w-full py-3 text-lg"
          data-testid="button-enable-notifications"
        >
          Enable Notifications
        </Button>
      </div>
    </div>
  );
};

const LearningPlanScreen = ({ 
  selectedLanguage, 
  selectedLevel, 
  selectedStyle 
}: {
  selectedLanguage?: { name: string; flag: string; };
  selectedLevel?: { title: string; };
  selectedStyle?: { title: string; icon: string; };
}) => (
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      Your Learning Plan is Ready 🎉
    </h1>
    <p className="text-gray-600 mb-8 text-lg">
      Your personalised plan is here
    </p>
    
    {/* Timeline */}
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6 text-left">
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">💬</span>
          </div>
          <div className="flex-1 pt-1">
            <span className="text-gray-900 font-semibold text-lg leading-relaxed">In 1 month → You'll hold everyday conversations</span>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">✈️</span>
          </div>
          <div className="flex-1 pt-1">
            <span className="text-gray-900 font-semibold text-lg leading-relaxed">In 2 months → You'll navigate confidently abroad</span>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">🗣️</span>
          </div>
          <div className="flex-1 pt-1">
            <span className="text-gray-900 font-semibold text-lg leading-relaxed">In 3 months → You'll have real back-and-forth conversation</span>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">🌟</span>
          </div>
          <div className="flex-1 pt-1">
            <span className="text-gray-900 font-semibold text-lg leading-relaxed">In 4 months + → You'll speak naturally and confidently in most situation</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Features */}
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8 text-left">
      <h3 className="font-bold text-lg mb-4 text-gray-900">Take advantage of:</h3>
      <div className="space-y-3">
        {[
          "✅ Micro-lessons that fit your lifestyle",
          "✅ Smart reminders to stay consistent without pressure", 
          "✅ Desktop + mobile sync so you can learn anywhere",
          "✅ Real-world videos: Practice in video scenes like cafés, shops, and travel moments",
          "✅ Backed by proven methods (spaced repetition & retrieval practice)"
        ].map((feature, index) => (
          <div key={index} className="text-gray-700">{feature}</div>
        ))}
      </div>
    </div>
    
    {/* Remove confusing button - user should use Continue */}
  </div>
);

// Payment Screen Component - simplified redirect to existing payment flow
const PaymentScreen = () => {
  const [, setLocation] = useLocation();
  
  const handleStartTrial = () => {
    // Redirect to existing subscribe page which has full Stripe integration
    setLocation('/subscribe');
  };
  
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Start Your Free Trial
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        Complete payment setup to begin your 5-day free trial
      </p>
      
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="text-2xl font-bold text-primary mb-2">5-Day Free Trial</div>
        <div className="text-gray-600 mb-4">Then $19.99/month, cancel anytime</div>
        <div className="text-sm text-gray-500">
          • Full access to all languages<br/>
          • Unlimited lessons and practice<br/>
          • Progress tracking and analytics<br/>
          • Mobile and desktop sync
        </div>
      </div>
      
      <Button 
        onClick={handleStartTrial}
        className="w-full py-4 text-lg font-semibold bg-primary hover:bg-primary/90"
        data-testid="button-complete-payment"
      >
        Complete Payment Setup
      </Button>
      
      <p className="text-xs text-gray-500 mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};