import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, User, GraduationCap, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import Footer from "@/components/ui/footer";

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
          // Clear any stored onboarding data since it's now saved to user profile
          localStorage.removeItem('lingoToday_onboarding');
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
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            data-testid="button-back-home"
          >
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">LingoToday</h1>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Start Your Learning Journey
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Quick setup - takes less than 2 minutes
          </p>
        </div>

        {/* Testimonials */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm border" data-testid="testimonial-sarah">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                "The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday..."
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-700">SM</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Paul Martinez</div>
                  <div className="text-xs text-gray-500">Product Manager, London</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border" data-testid="testimonial-anna">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                "I tried Duolingo, Babbel, everything. But LingoToday's spaced repetition actually works. My German colleagues are impressed!"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-700">AL</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Anna Liu</div>
                  <div className="text-xs text-gray-500">Software Engineer, London</div>
                </div>
              </div>
            </div>
          </div>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`p-4 text-left border-2 rounded-lg transition-colors ${
                      selectedLanguage === language.code
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                    data-testid={`button-language-${language.code}`}
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
                    data-testid={`button-level-${level.value}`}
                  >
                    <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{level.title}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{level.description}</div>
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



                  {/* Email Registration Form */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Sign up with Email</h4>
                    </div>

                    {registerErrors.general && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 text-sm">
                          {registerErrors.general}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={registerData.firstName}
                        onChange={(e) => handleRegisterInputChange('firstName', e.target.value)}
                        className={`text-sm sm:text-base ${registerErrors.firstName ? 'border-red-500' : ''}`}
                        data-testid="input-firstName"
                      />
                      {registerErrors.firstName && <p className="text-red-500 text-xs sm:text-sm mt-1">{registerErrors.firstName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="register-email" className="text-sm sm:text-base">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email address"
                          className={`pl-10 text-sm sm:text-base ${registerErrors.email ? 'border-red-500' : ''}`}
                          value={registerData.email}
                          onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                          data-testid="input-register-email"
                        />
                      </div>
                      {registerErrors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{registerErrors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Choose a secure password"
                          className={`pl-10 text-sm sm:text-base ${registerErrors.password ? 'border-red-500' : ''}`}
                          value={registerData.password}
                          onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                          data-testid="input-password"
                        />
                      </div>
                      {registerErrors.password && <p className="text-red-500 text-xs sm:text-sm mt-1">{registerErrors.password}</p>}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className={`pl-10 text-sm sm:text-base ${registerErrors.confirmPassword ? 'border-red-500' : ''}`}
                          value={registerData.confirmPassword}
                          onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                          data-testid="input-confirmPassword"
                        />
                      </div>
                      {registerErrors.confirmPassword && <p className="text-red-500 text-xs sm:text-sm mt-1">{registerErrors.confirmPassword}</p>}
                    </div>

                    <Button 
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 text-sm sm:text-base"
                      data-testid="button-register"
                    >
                      {isRegistering ? 'Creating Account...' : 'Create Account & Start Learning'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-primary underline">Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
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
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Get Notified When Ready
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    We'll email you as soon as the {selectedLevelData?.title.toLowerCase()} {selectedLanguageData?.name} course launches.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="waitlist-email" className="text-sm sm:text-base">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="waitlist-email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10 text-sm sm:text-base"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(''); // Clear error on input
                        }}
                        data-testid="input-waitlist-email"
                      />
                    </div>
                    {emailError && <p className="text-red-500 text-xs sm:text-sm mt-1">{emailError}</p>}
                  </div>

                  <Button
                    onClick={handleEmailSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-sm sm:text-base"
                    data-testid="button-waitlist"
                  >
                    {isSubmitting ? 'Adding to Waitlist...' : 'Notify Me When Ready'}
                  </Button>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600 text-center">
                      Or start with a different level:
                    </p>
                    <Button
                      onClick={() => handleLevelSelect('beginner')}
                      variant="outline"
                      className="w-full text-sm sm:text-base"
                      data-testid="button-beginner-alternative"
                    >
                      Try Beginner Level Instead
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                      className="w-full text-sm sm:text-base"
                      data-testid="button-back-homepage"
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
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      You're on the list!
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 break-words">
                      We'll email you at <strong className="break-all">{email}</strong> as soon as the {selectedLevelData?.title.toLowerCase()} {selectedLanguageData?.name} course is ready.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Want to start learning now?
                    </p>
                    <Button
                      onClick={() => handleLevelSelect('beginner')}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-sm sm:text-base"
                      data-testid="button-try-beginner"
                    >
                      Try Beginner Level
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                      className="w-full text-sm sm:text-base"
                      data-testid="button-back-home-success"
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
      <Footer />
    </div>
  );
}