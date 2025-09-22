import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, User, GraduationCap, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Star, Smartphone, Monitor, RotateCcw, Bell, BellOff, Calendar, Video, Zap, Target, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import Footer from "@/components/ui/footer";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  
  // Function to clear onboarding state (for testing/reset)
  const clearOnboardingState = () => {
    localStorage.removeItem('lingoToday_onboarding_temp');
    localStorage.removeItem('lingoToday_onboarding');
    setCurrentScreen(0);
    setSelectedLanguage('');
    setSelectedLevel('');
    setSelectedLearningStyle('');
    setNotificationsEnabled(false);
    console.log('🧹 Onboarding state cleared');
  };
  
  // Dev helper: Clear onboarding on Ctrl+Shift+R
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        clearOnboardingState();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);
  
  // Load from localStorage on mount
  useEffect(() => {
    // Clear onboarding state immediately (for testing)
    clearOnboardingState();
    
    // Normally would load from localStorage, but we're clearing for fresh start
    /*
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
    */
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
          // Auto-advance to next screen immediately
          nextScreen();
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
          onStartTrial={nextScreen}
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

        {/* Continue button - hide on registration, payment, and learning plan screens */}
        {currentScreen < 6 && !(currentScreen === 3 && !registrationComplete) && currentScreen !== 5 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={nextScreen}
              disabled={!canContinueFromScreen(currentScreen) || isTransitioning}
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg disabled:opacity-50"
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
  onRegister
}: {
  registerData: { firstName: string; email: string; password: string; };
  registerErrors: Record<string, string>;
  isRegistering: boolean;
  onInputChange: (field: keyof typeof registerData, value: string) => void;
  onRegister: () => void;
}) => (
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
  selectedStyle,
  onStartTrial
}: {
  selectedLanguage?: { name: string; flag: string; };
  selectedLevel?: { title: string; };
  selectedStyle?: { title: string; icon: string; };
  onStartTrial: () => void;
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
          "• Micro-lessons that fit your lifestyle",
          "• Smart reminders to stay consistent without pressure", 
          "• Desktop + mobile sync so you can learn anywhere",
          "• Real-world videos: Practice in video scenes like cafés, shops, and travel moments",
          "• Backed by proven methods (spaced repetition & retrieval practice)"
        ].map((feature, index) => (
          <div key={index} className="text-gray-900 font-semibold text-lg leading-relaxed">{feature}</div>
        ))}
      </div>
    </div>
    
    {/* Start Free Trial Section */}
    <div className="mt-8 space-y-4">
      {/* No Payment Due Now text */}
      <div className="text-center">
        <span className="text-gray-700 font-medium">✓ No Payment Due Now. Cancel Anytime</span>
      </div>
      
      {/* Start Free Trial Button */}
      <div>
        <Button 
          onClick={onStartTrial}
          className="w-full py-4 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg"
          data-testid="button-start-trial"
        >
          Start Free Trial
        </Button>
        
        {/* Small text underneath */}
        <div className="text-center mt-3">
          <span className="text-gray-500 text-sm">5 days free trial then £2.49/month</span>
        </div>
      </div>
    </div>
  </div>
);

// Load Stripe (moved from module level to avoid crash)
let stripePromise: Promise<any> | null = null;
const getStripePromise = () => {
  if (!stripePromise) {
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      console.error('Missing Stripe public key');
      return null;
    }
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Stripe Payment Form Component
const StripePaymentForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'payment' | 'activating'>('idle');

  // Poll subscription status until webhook upgrades account
  const pollSubscriptionStatus = async (): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/subscription-status", {
          method: "GET",
          cache: "no-store" // Prevent 304 responses that cause JSON parsing issues
        });
        
        if (response.status === 200) {
          const data = await response.json();
          if (data.isProUser) {
            return true; // Webhook processed successfully
          }
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error checking subscription status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    return false; // Timeout - webhook didn't arrive in time
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setProcessingStage('payment');

    try {
      // Submit payment element validation first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast({
          title: "Payment Failed",
          description: submitError.message,
          variant: "destructive",
        });
        setProcessingStage('idle');
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required' // Stay in SPA, don't redirect
      });

      if (error) {
        // Only show immediate failure for definitive client-side errors
        const isDefinitiveFailure = error.type === 'card_error' || 
                                   error.type === 'validation_error' ||
                                   error.type === 'invalid_request_error';
        
        if (isDefinitiveFailure) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
          setProcessingStage('idle');
        } else {
          // For ambiguous errors, wait for webhook confirmation
          setProcessingStage('activating');
          toast({
            title: "Finalizing Payment",
            description: "Please wait while we confirm your payment...",
          });

          const webhookSuccess = await pollSubscriptionStatus();
          
          if (webhookSuccess) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] }),
              queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
              queryClient.invalidateQueries({ queryKey: ['/api/courses'] }),
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] }),
              queryClient.invalidateQueries({ queryKey: ['/api/progress'] }),
            ]);
            toast({
              title: "Welcome to Pro Learner!",
              description: "Your subscription is now active. You have access to all premium content.",
            });
            onSuccess();
          } else {
            toast({
              title: "Payment Status Unclear",
              description: "We're unable to confirm your payment status right now. Please check your account or contact support if needed.",
              variant: "destructive",
            });
            setProcessingStage('idle');
          }
        }
      } else {
        // Payment succeeded immediately
        setProcessingStage('activating');
        toast({
          title: "Payment Successful!",
          description: "Activating your Pro Learner subscription...",
        });

        const webhookSuccess = await pollSubscriptionStatus();
        
        if (webhookSuccess) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/courses'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/progress'] }),
          ]);
          toast({
            title: "Welcome to Pro Learner!",
            description: "Your subscription is now active. You have access to all premium content.",
          });
          onSuccess();
        } else {
          toast({
            title: "Payment Successful, Activation Pending",
            description: "Your payment was processed successfully. Account activation may take a few minutes.",
          });
          setProcessingStage('idle');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setProcessingStage('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (processingStage === 'payment') return 'Processing Payment...';
    if (processingStage === 'activating') return 'Activating Account...';
    return 'Complete Payment';
  };

  const getButtonIcon = () => {
    if (isProcessing) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <PaymentElement
          options={{
            layout: "accordion",
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
          }}
        />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full py-4 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50"
        data-testid="button-complete-payment"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
};

// Payment Screen Component with full Stripe integration
const PaymentScreen = () => {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // First check if user is authenticated
        const authResponse = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!authResponse.ok) {
          throw new Error('User not authenticated. Please complete registration first.');
        }
        
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            priceId: 'price_1QEgdmAjBOdJlg0mMNGqgHkh' // Pro Learner price ID
          }),
        });
        
        if (response.status === 401) {
          throw new Error('Please complete your account registration first.');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create subscription');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.';
        setError(errorMessage);
        toast({
          title: "Payment Setup Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [toast]);
  
  const handleSuccess = () => {
    toast({
      title: "🎉 Welcome to LingoToday Pro!",
      description: "Your subscription is active. You now have access to all premium features.",
    });
    // Redirect to dashboard after successful payment
    setTimeout(() => {
      setLocation('/dashboard');
    }, 2000);
  };
  
  const stripePromiseInstance = getStripePromise();
  
  if (!stripePromiseInstance) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Unavailable</h1>
        <p className="text-gray-600">Payment system is currently unavailable. Please try again later.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setting up Payment</h1>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-gray-600">Loading payment form...</span>
        </div>
      </div>
    );
  }
  
  if (error || !clientSecret) {
    const isAuthError = error?.includes('authenticated') || error?.includes('registration');
    
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAuthError ? 'Registration Required' : 'Payment Setup Failed'}
        </h1>
        <p className="text-gray-600 mb-4">{error || 'Unable to setup payment'}</p>
        <div className="space-y-3">
          {isAuthError && (
            <Button 
              onClick={() => setLocation('/onboarding')} 
              className="w-full px-6 py-2 bg-primary hover:bg-primary/90"
            >
              Complete Registration
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant={isAuthError ? "outline" : "default"}
            className="w-full px-6 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Complete Your Subscription
      </h1>
      <p className="text-gray-600 mb-6 text-lg">
        Start your 5-day free trial now
      </p>
      
      <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
        <div className="text-xl font-bold text-primary mb-2">💎 Pro Learner</div>
        <div className="text-gray-700 mb-2">5-Day Free Trial</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">£2.49/month</div>
        <div className="text-sm text-gray-600 mb-3">Cancel anytime</div>
        <div className="space-y-1 text-sm text-gray-700">
          <div>• Full access to all languages</div>
          <div>• Unlimited lessons and practice</div>
          <div>• Progress tracking and analytics</div>
          <div>• Premium video content</div>
          <div>• Mobile and desktop sync</div>
        </div>
      </div>
      
      <Elements 
        stripe={stripePromiseInstance} 
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0F172A',
              borderRadius: '8px',
            },
          },
        }}
      >
        <StripePaymentForm onSuccess={handleSuccess} />
      </Elements>
    </div>
  );
};