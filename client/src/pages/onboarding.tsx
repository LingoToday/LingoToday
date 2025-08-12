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
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Email registration states
  const [registerData, setRegisterData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

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
      setEmailSubmitted(false); // Reset email submission state
    } else {
      setShowUnavailable(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setEmailError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          language: selectedLanguage,
          level: selectedLevel,
        }),
      });

      if (response.ok) {
        setEmailSubmitted(true);
      } else {
        const error = await response.json();
        setEmailError(error.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setEmailError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Store onboarding data in localStorage to use after authentication
      const onboardingData = {
        language: selectedLanguage,
        level: selectedLevel,
        completedOnboarding: true
      };
      
      localStorage.setItem('deskLingo_onboarding', JSON.stringify(onboardingData));
      
      // Check if Google OAuth is available
      const response = await fetch('/api/auth/google');
      if (response.status === 503) {
        alert('Google authentication is not currently available. Please use email registration instead.');
        return;
      }
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      alert('Unable to connect to Google authentication. Please try email registration.');
    }
  };

  const handleGitHubAuth = async () => {
    try {
      // Store onboarding data in localStorage to use after authentication
      const onboardingData = {
        language: selectedLanguage,
        level: selectedLevel,
        completedOnboarding: true
      };
      
      localStorage.setItem('deskLingo_onboarding', JSON.stringify(onboardingData));
      
      // Check if GitHub OAuth is available
      const response = await fetch('/api/auth/github');
      if (response.status === 503) {
        alert('GitHub authentication is not currently available. Please use email registration instead.');
        return;
      }
      
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/github';
    } catch (error) {
      alert('Unable to connect to GitHub authentication. Please try email registration.');
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    setRegisterErrors({});
    
    // Validation
    const errors: Record<string, string> = {};
    if (!registerData.firstName.trim()) errors.firstName = 'First name is required';
    if (!registerData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) errors.email = 'Please enter a valid email';
    if (registerData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (registerData.password !== registerData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
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
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store onboarding preferences  
        const onboardingData = {
          language: selectedLanguage,
          level: selectedLevel,
          completedOnboarding: true
        };
        localStorage.setItem('deskLingo_onboarding', JSON.stringify(onboardingData));
        
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
          // Clear any stored onboarding data since it's now saved to user profile
          localStorage.removeItem('deskLingo_onboarding');
          window.location.href = '/';
        } else {
          // Registration successful but login failed, redirect to login page
          window.location.href = '/?registered=true';
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

                  {/* OAuth Authentication Options */}
                  <div className="space-y-3">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-3">Quick Sign In</h4>
                    </div>
                    
                    <Button 
                      onClick={handleGoogleAuth}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                    
                    <Button 
                      onClick={handleGitHubAuth}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Continue with GitHub
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Sign in with your existing account from these providers
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <hr className="flex-1 border-gray-200" />
                    <span className="text-sm text-gray-500 font-medium">OR</span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {/* Email Registration Form */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-3">Create New Account</h4>
                    </div>

                    {registerErrors.general && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          {registerErrors.general}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={registerData.firstName}
                        onChange={(e) => handleRegisterInputChange('firstName', e.target.value)}
                        className={registerErrors.firstName ? 'border-red-500' : ''}
                      />
                      {registerErrors.firstName && <p className="text-red-500 text-sm mt-1">{registerErrors.firstName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="register-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email address"
                          className={`pl-10 ${registerErrors.email ? 'border-red-500' : ''}`}
                          value={registerData.email}
                          onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                        />
                      </div>
                      {registerErrors.email && <p className="text-red-500 text-sm mt-1">{registerErrors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Choose a secure password"
                          className={`pl-10 ${registerErrors.password ? 'border-red-500' : ''}`}
                          value={registerData.password}
                          onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                        />
                      </div>
                      {registerErrors.password && <p className="text-red-500 text-sm mt-1">{registerErrors.password}</p>}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className={`pl-10 ${registerErrors.confirmPassword ? 'border-red-500' : ''}`}
                          value={registerData.confirmPassword}
                          onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                        />
                      </div>
                      {registerErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{registerErrors.confirmPassword}</p>}
                    </div>

                    <Button 
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-3"
                    >
                      {isRegistering ? 'Creating Account...' : 'Create Account & Start Learning'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Form for Unavailable Levels */}
          {showUnavailable && !emailSubmitted && (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Get Notified When Ready
                  </h3>
                  <p className="text-gray-600">
                    We'll email you as soon as the {selectedLevelData?.title.toLowerCase()} {selectedLanguageData?.name} course launches.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="waitlist-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="waitlist-email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(''); // Clear error on input
                        }}
                      />
                    </div>
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>

                  <Button
                    onClick={handleEmailSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmitting ? 'Adding to Waitlist...' : 'Notify Me When Ready'}
                  </Button>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm text-gray-600 text-center">
                      Or start with a different level:
                    </p>
                    <Button
                      onClick={() => handleLevelSelect('beginner')}
                      variant="outline"
                      className="w-full"
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

          {/* Success Message for Email Submission */}
          {showUnavailable && emailSubmitted && (
            <Card className="bg-white shadow-lg border-0 border-green-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      You're on the list!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We'll email you at <strong>{email}</strong> as soon as the {selectedLevelData?.title.toLowerCase()} {selectedLanguageData?.name} course is ready.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Want to start learning now?
                    </p>
                    <Button
                      onClick={() => handleLevelSelect('beginner')}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Try Beginner Level
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