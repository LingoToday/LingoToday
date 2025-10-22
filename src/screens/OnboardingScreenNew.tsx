import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Alert as RNAlert,
  KeyboardAvoidingView, // ADD THIS
  Platform, // ADD THIS
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/OnboardingStyles';

// Import UI components exactly like web version
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Constants from 'expo-constants';
import { Alert, AlertDescription } from '../components/ui/Alert';

// Import Stripe for React Native (platform-specific)
import { StripeProvider, CardField, useStripe, useConfirmPayment } from '../lib/stripe';

// Import API client
import { apiClient } from '../lib/apiClient';

const { width } = Dimensions.get('window');

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

// Stripe publishable key - should be in environment variables
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey;

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedLearningStyle, setSelectedLearningStyle] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Registration data - matching web exactly
  const [registerData, setRegisterData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  const totalScreens = 8;

  // Function to clear onboarding state (for testing/reset) - matching web exactly
  const clearOnboardingState = async () => {
    try {
      await AsyncStorage.removeItem('lingoToday_onboarding_temp');
      await AsyncStorage.removeItem('lingoToday_onboarding');
      setCurrentScreen(0);
      setSelectedLanguage('');
      setSelectedLevel('');
      setSelectedLearningStyle('');
      setNotificationsEnabled(false);
      console.log('🧹 Onboarding state cleared');
    } catch (error) {
      console.error('Error clearing onboarding state:', error);
    }
  };
  
  // Load from AsyncStorage on mount - matching web behavior exactly
  useEffect(() => {
    const loadOnboardingData = async () => {
      // Clear onboarding state immediately (for testing) - matching web behavior
      await clearOnboardingState();
    };
    
    loadOnboardingData();
  }, []);
  
  // Save to AsyncStorage whenever data changes - matching web localStorage functionality
  const saveToLocalStorage = async () => {
    try {
      const data = {
        language: selectedLanguage,
        level: selectedLevel,
        learningStyle: selectedLearningStyle,
        notifications: notificationsEnabled,
        currentScreen
      };
      await AsyncStorage.setItem('lingoToday_onboarding_temp', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };
  
  useEffect(() => {
    if (selectedLanguage || selectedLevel || selectedLearningStyle) {
      saveToLocalStorage();
    }
  }, [selectedLanguage, selectedLevel, selectedLearningStyle, notificationsEnabled, currentScreen]);

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
      case 3: return false; // Registration screen should never allow continue - user must create account first
      case 4: return true; // Notifications screen always allows continue
      case 5: return true; // Testimonials screen (has its own continue)
      case 6: return true; // Learning plan screen
      case 7: return true; // Payment screen
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
    // Mobile notification permission logic - matching web behavior
    setNotificationsEnabled(true);
    // Update AsyncStorage immediately after permission is resolved
    const data = {
      language: selectedLanguage,
      level: selectedLevel,
      learningStyle: selectedLearningStyle,
      notifications: true,
      currentScreen
    };
    await AsyncStorage.setItem('lingoToday_onboarding_temp', JSON.stringify(data));
    return true;
  };

  const handleRegister = async () => {
    // Clear previous errors
    setRegisterErrors({});
    
    // Validation - matching web exactly
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
      // Use apiClient for registration - matching web exactly
      const response = await apiClient.register({
        firstName: registerData.firstName.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        selectedLanguage: selectedLanguage,
        selectedLevel: selectedLevel,
        learningStyle: selectedLearningStyle,
        notificationsEnabled: notificationsEnabled,
      });

      // Store onboarding preferences  
      const onboardingData = {
        language: selectedLanguage,
        level: selectedLevel,
        learningStyle: selectedLearningStyle,
        notifications: notificationsEnabled,
        completedOnboarding: true
      };
      await AsyncStorage.setItem('lingoToday_onboarding', JSON.stringify(onboardingData));
      
      // Auto-login after successful registration using apiClient
      try {
        await apiClient.login(registerData.email, registerData.password);
        
        // ADDED: Now save notification settings to database after user is created and logged in
        try {
          console.log('💾 Saving notification settings after user creation...');
          
          const settingsResponse = await apiClient.updateUserSettings({
            notificationsEnabled: notificationsEnabled,
            notificationFrequency: 15,
            notificationStartTime: '09:00',
            notificationEndTime: '18:00',
            language: selectedLanguage,
            theme: 'light',
            soundEnabled: true,
            difficultyLevel: selectedLevel,
          });
          
          console.log('✅ Notification settings saved successfully:', settingsResponse);
          
        } catch (settingsError) {
          console.error('❌ Error saving notification settings (non-critical):', settingsError);
          // Don't fail registration if settings save fails
        }
        
        // Clear temporary AsyncStorage and save final preferences
        const finalData = {
          language: selectedLanguage,
          level: selectedLevel,
          learningStyle: selectedLearningStyle,
          notifications: notificationsEnabled,
          completedOnboarding: true
        };
        await AsyncStorage.setItem('lingoToday_onboarding', JSON.stringify(finalData));
        await AsyncStorage.removeItem('lingoToday_onboarding_temp');
        
        // Auto-advance to next screen immediately
        nextScreen();
      } catch (loginError) {
        setRegisterErrors({ general: 'Registration successful but login failed. Please try signing in.' });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message && error.message.includes('API Error')) {
        // Parse API errors from backend
        try {
          const errorBody = JSON.parse(error.message.split(' - ')[1]);
          if (errorBody.errors) {
            const fieldErrors: Record<string, string> = {};
            errorBody.errors.forEach((err: any) => {
              fieldErrors[err.path?.[0] || 'general'] = err.message;
            });
            setRegisterErrors(fieldErrors);
          } else {
            setRegisterErrors({ general: errorBody.message || 'Registration failed' });
          }
        } catch {
          setRegisterErrors({ general: error.message || 'Registration failed' });
        }
      } else {
        setRegisterErrors({ general: 'Network error. Please check your connection and try again.' });
      }
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
          navigation={navigation}
        />;
      case 4:
        return <NotificationScreen 
          notificationsEnabled={notificationsEnabled}
          onRequestPermission={requestNotificationPermission}
        />;
      case 5:
        return <TestimonialsScreen onContinue={nextScreen} />;
      case 6:
        return <LearningPlanScreen 
          selectedLanguage={selectedLanguageData}
          selectedLevel={selectedLevelData}
          selectedStyle={selectedLearningStyleData}
          onStartTrial={nextScreen}
        />;
      case 7:
        return (
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <PaymentScreen onSuccess={handlePaymentSuccess} />
          </StripeProvider>
        );
      default:
        return null;
    }
  };

  // Add this function in the OnboardingScreen component, after the other handler functions:
const handlePaymentSuccess = async () => {
  try {
    // Mark onboarding as completed and save final preferences
    const finalData = {
      language: selectedLanguage,
      level: selectedLevel,
      learningStyle: selectedLearningStyle,
      notifications: notificationsEnabled,
      completedOnboarding: true
    };
    
    await AsyncStorage.setItem('lingoToday_onboarding', JSON.stringify(finalData));
    await AsyncStorage.removeItem('lingoToday_onboarding_temp');
    
    // Update auth context to refresh the app state
    if (authContext?.refreshAuth) {
      await authContext.refreshAuth();
    }
    
    // The navigation will be handled automatically by AppNavigator 
    // when auth state updates and user has completedOnboarding
    console.log('✅ Onboarding completed, payment successful');
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    // Fallback: try to navigate directly if auth context refresh fails
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' as never }],
      });
    }, 1000);
  }
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF4FF" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Progress bar - matching web exactly */}
          <View style={styles.progressSection}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${((currentScreen + 1) / totalScreens) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentScreen + 1} of {totalScreens}
            </Text>
          </View>

          {/* FIXED: Handle payment screen separately */}
          {currentScreen === 7 ? (
            // Payment screen - no wrapper ScrollView, handles its own keyboard/scroll
            <View style={[styles.screenContainer, isTransitioning && styles.screenTransitioning]}>
              {renderScreen()}
            </View>
          ) : (
            // All other screens - use original ScrollView wrapper
            <View style={[styles.screenContainer, isTransitioning && styles.screenTransitioning]}>
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderScreen()}
              </ScrollView>
            </View>
          )}

          {/* Continue button - hide on registration, payment, and learning plan screens - matching web logic */}
          {currentScreen < 7 && currentScreen !== 3 && currentScreen !== 5 && currentScreen !== 6 && (
            <View style={styles.continueSection}>
              <Button
                onPress={nextScreen}
                disabled={!canContinueFromScreen(currentScreen) || isTransitioning}
                style={[
                  styles.continueButton,
                  (!canContinueFromScreen(currentScreen) || isTransitioning) && styles.continueButtonDisabled
                ]}
              >
                <View style={styles.continueButtonContent}>
                  <Text style={[
                    styles.continueButtonText,
                    (!canContinueFromScreen(currentScreen) || isTransitioning) && styles.continueButtonTextDisabled
                  ]}>
                    Continue
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={(!canContinueFromScreen(currentScreen) || isTransitioning) ? "#9CA3AF" : "#FFFFFF"} 
                    style={styles.continueButtonIcon}
                  />
                </View>
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// Screen Components - matching web exactly

const LanguageSelectionScreen = ({ selectedLanguage, onLanguageSelect, languages }: {
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  languages: { code: string; name: string; flag: string; }[];
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Pick your language to master
    </Text>
    <Text style={styles.screenSubtitle}>
      Learn with science backed micro lessons, designed for your day.
    </Text>
    
    <View style={styles.languageGrid}>
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          onPress={() => onLanguageSelect(language.code)}
          style={[
            styles.languageCard,
            selectedLanguage === language.code && styles.languageCardSelected,
          ]}
          testID={`button-language-${language.code}`}
        >
          <Text style={styles.languageFlag}>{language.flag}</Text>
          <Text style={[
            styles.languageTitle,
            selectedLanguage === language.code && styles.languageTitleSelected,
          ]}>
            {language.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const LevelSelectionScreen = ({ selectedLevel, onLevelSelect, levels }: {
  selectedLevel: string;
  onLevelSelect: (level: string) => void;
  levels: { value: string; title: string; description: string; }[];
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What's your starting point?
    </Text>
    <Text style={styles.screenSubtitle}>
      Your plan will adapt to your current skill level.
    </Text>
    
    <View style={styles.levelsList}>
      {levels.map((level) => (
        <TouchableOpacity
          key={level.value}
          onPress={() => onLevelSelect(level.value)}
          style={[
            styles.levelCard,
            selectedLevel === level.value && styles.levelCardSelected,
          ]}
          testID={`button-level-${level.value}`}
        >
          <Text style={[
            styles.levelTitle,
            selectedLevel === level.value && styles.levelTitleSelected,
          ]}>
            {level.title}
          </Text>
          <Text style={[
            styles.levelDescription,
            selectedLevel === level.value && styles.levelDescriptionSelected,
          ]}>
            "{level.description}"
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const LearningStyleScreen = ({ selectedStyle, onStyleSelect, styles: learningStyles }: {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
  styles: { value: string; title: string; icon: string; description: string; }[];
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Where will you learn?
    </Text>
    <Text style={styles.screenSubtitle}>
      LingoToday works everywhere—your progress follows you.
    </Text>
    
    <View style={styles.levelsList}>
      {learningStyles.map((style) => (
        <TouchableOpacity
          key={style.value}
          onPress={() => onStyleSelect(style.value)}
          style={[
            styles.styleCard,
            selectedStyle === style.value && styles.styleCardSelected,
          ]}
          testID={`button-style-${style.value}`}
        >
          <Text style={styles.styleIcon}>{style.icon}</Text>
          <View style={styles.styleContent}>
            <Text style={[
              styles.styleTitle,
              selectedStyle === style.value && styles.styleTitleSelected,
            ]}>
              {style.title}
            </Text>
            <Text style={[
              styles.styleDescription,
              selectedStyle === style.value && styles.styleDescriptionSelected,
            ]}>
              "{style.description}"
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const RegistrationScreen = ({
  registerData,
  registerErrors,
  isRegistering,
  onInputChange,
  onRegister,
  navigation
}: {
  registerData: { firstName: string; email: string; password: string; confirmPassword?: string; };
  registerErrors: Record<string, string>;
  isRegistering: boolean;
  onInputChange: (field: keyof typeof registerData, value: string) => void;
  onRegister: () => void;
  navigation: any;
}) => (
    <KeyboardAvoidingView>
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>
          Create your free account
        </Text>
        <Text style={styles.screenSubtitle}>
          Let's set up your account and get you learning!
        </Text>
        
        {registerErrors.general && (
          <Alert style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <AlertDescription>
              <Text style={styles.errorAlertText}>{registerErrors.general}</Text>
            </AlertDescription>
          </Alert>
        )}
        
        <View style={styles.formSpace}>
          <View style={styles.formField}>
            <Label htmlFor="firstName" style={styles.formLabel}>Name</Label>
            <Input
              id="firstName"
              placeholder="Enter your name"
              value={registerData.firstName}
              onChangeText={(text: string) => onInputChange('firstName', text)}
              style={[
                styles.formInput,
                registerErrors.firstName && styles.formInputError
              ]}
              testID="input-firstName"
            />
            {registerErrors.firstName && <Text style={styles.fieldErrorText}>{registerErrors.firstName}</Text>}
          </View>

          <View style={styles.formField}>
            <Label htmlFor="email" style={styles.formLabel}>Email</Label>
            <Input
              id="email"
              placeholder="Enter your email address"
              value={registerData.email}
              onChangeText={(text: string) => onInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.formInput,
                registerErrors.email && styles.formInputError
              ]}
              testID="input-email"
            />
            {registerErrors.email && <Text style={styles.fieldErrorText}>{registerErrors.email}</Text>}
          </View>

            <View style={styles.formField}>
            <Label htmlFor="password" style={styles.formLabel}>Password</Label>
            <Input
              id="password"
              placeholder="Choose a secure password"
              value={registerData.password}
              onChangeText={(text: string) => onInputChange('password', text)}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
              styles.formInput,
              registerErrors.password && styles.formInputError
              ]}
              testID="input-password"
            />
            {registerErrors.password && <Text style={styles.fieldErrorText}>{registerErrors.password}</Text>}
            </View>

            <View style={styles.formField}>
            <Label htmlFor="confirmPassword" style={styles.formLabel}>Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="Confirm your password"
              value={registerData.confirmPassword}
              onChangeText={(text: string) => onInputChange('confirmPassword', text)}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
              styles.formInput,
              registerErrors.confirmPassword && styles.formInputError
              ]}
              testID="input-confirmPassword"
            />
            {registerErrors.confirmPassword && <Text style={styles.fieldErrorText}>{registerErrors.confirmPassword}</Text>}
            </View>

          <Button 
            onPress={onRegister}
            disabled={isRegistering}
            style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}
          >
            <Text style={[styles.registerButtonText, isRegistering && styles.registerButtonTextDisabled]}>
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Button>
          
          {/* Privacy Policy and Terms text - matching web */}
          <View>
            <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              By creating an account, you indicate that you have read and agreed to the{' '}
              <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
              {' '}and{' '}
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={styles.termsLink}>Terms of Use</Text>
              </TouchableOpacity>
            </Text>
          </View>
          </View>
          
          {/* Features - matching web exactly */}
          {/* <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Take advantage of:</Text>
            <View style={styles.featuresSpace}>
              {[
                "• Micro-lessons that fit your lifestyle",
                "• Smart reminders to stay consistent without pressure", 
                "• Desktop + mobile sync so you can learn anywhere",
                "• Real-world videos: Practice in video scenes like cafés, shops, and travel moments",
                "• Backed by proven methods (spaced repetition & retrieval practice)"
              ].map((feature, index) => (
                <Text key={index} style={styles.featureItem}>{feature}</Text>
              ))}
            </View>
          </View> */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );

const NotificationScreen = ({ 
  notificationsEnabled, 
  onRequestPermission 
}: {
  notificationsEnabled: boolean;
  onRequestPermission: () => Promise<boolean>;
}) => {
  const [hasRequested, setHasRequested] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  
  const handleEnableNotifications = async () => {
    try {
      setHasRequested(true);
      setIsUpdatingSettings(true);
      
      // First request device permission
      const permissionGranted = await onRequestPermission();
      
      // DON'T update database settings here - user doesn't exist yet
      // Settings will be saved during registration step
      console.log('✅ Notification permission granted:', permissionGranted);
      
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleSkipNotifications = async () => {
    try {
      setHasRequested(true);
      setIsUpdatingSettings(true);
      
      // DON'T update database settings here - user doesn't exist yet
      // Settings will be saved during registration step
      console.log('✅ Notifications skipped');
      
    } catch (error) {
      console.error('❌ Error skipping notifications:', error);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  if (hasRequested) {
    return (
      <View style={styles.screenContent}>
        <View style={[
          styles.notificationIconContainer,
          notificationsEnabled ? styles.notificationEnabled : styles.notificationDisabled
        ]}>
          <Ionicons 
            name={notificationsEnabled ? "notifications" : "notifications-off"} 
            size={32} 
            color={notificationsEnabled ? "#059669" : "#D97706"} 
          />
        </View>
        <Text style={styles.screenTitle}>
          {notificationsEnabled ? 'Notifications Enabled!' : 'No Problem!'}
        </Text>
        <Text style={styles.screenSubtitle}>
          {notificationsEnabled 
            ? "We'll send gentle reminders to keep you on track." 
            : "You can always enable notifications later in settings."}
        </Text>
        
        {isUpdatingSettings && (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={20} color="#6366f1" />
            <Text style={styles.loadingText}>Saving preferences...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screenContent}>
      <View style={styles.notificationIconContainer}>
        <Ionicons name="notifications" size={32} color="#6366f1" />
      </View>
      <Text style={styles.screenTitle}>
        Stay on track with gentle nudges
      </Text>
      <Text style={styles.screenSubtitle}>
        We'll remind you at the perfect moments so you never miss a lesson.
      </Text>
      
      <View style={styles.notificationButtonContainer}>
        <Button
          onPress={handleEnableNotifications}
          disabled={isUpdatingSettings}
          style={[styles.notificationButton, isUpdatingSettings && styles.notificationButtonDisabled]}
        >
          <Text style={[styles.notificationButtonText, isUpdatingSettings && styles.notificationButtonTextDisabled]}>
            {isUpdatingSettings ? 'Setting up...' : 'Enable Notifications'}
          </Text>
        </Button>
        
        <Button
          onPress={handleSkipNotifications}
          disabled={isUpdatingSettings}
          style={[styles.notificationSkipButton, isUpdatingSettings && styles.notificationButtonDisabled]}
        >
          <Text style={[styles.notificationSkipButtonText, isUpdatingSettings && styles.notificationButtonTextDisabled]}>
            {isUpdatingSettings ? 'Please wait...' : 'Skip for now'}
          </Text>
        </Button>
      </View>
    </View>
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
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Your Learning Plan is Ready
    </Text>
    
    {/* Timeline - matching web exactly */}
    <View style={styles.timelineCard}>
      <View style={styles.timelineSpace}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.timelineEmoji}>💬</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineText}>In 1 month → You'll hold everyday conversations</Text>
          </View>
        </View>
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: '#10B981' }]}>
            <Text style={styles.timelineEmoji}>✈️</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineText}>In 2 months → You'll navigate confidently abroad</Text>
          </View>
        </View>
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: '#8B5CF6' }]}>
            <Text style={styles.timelineEmoji}>🗣️</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineText}>In 3 months → You'll have real back-and-forth conversation</Text>
          </View>
        </View>
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.timelineEmoji}>🌟</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineText}>In 4 months + → You'll speak naturally and confidently in most situation</Text>
          </View>
        </View>
      </View>
    </View>
    
    {/* Start Free Trial Section - matching web exactly */}
    <View style={styles.trialSection}>
      {/* No Payment Due Now text */}
      <View style={styles.noPaymentContainer}>
        <Text style={styles.noPaymentText}>✓ No Payment Due Now. Cancel Anytime</Text>
      </View>
      
      {/* Start Free Trial Button */}
      <View>
        <Button 
          onPress={onStartTrial}
          style={styles.startTrialButton}
        >
          <Text style={styles.startTrialButtonText}>Start Free Trial</Text>
        </Button>
        
        {/* Small text underneath */}
        <View style={styles.trialPriceContainer}>
          <Text style={styles.trialPriceText}>5 days free trial then £2.49/month</Text>
        </View>
      </View>
    </View>
  </View>
);

// Stripe Payment Form Component - matching web exactly with apiClient
const StripePaymentForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { confirmPayment } = useConfirmPayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'payment' | 'activating'>('idle');
  const [cardComplete, setCardComplete] = useState(false);

  // Poll subscription status until webhook upgrades account - matching web exactly
  const pollSubscriptionStatus = async (): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    
    while (attempts < maxAttempts) {
      try {
        const data = await apiClient.getSubscriptionStatus();
        if ((data as any).isProUser) {
          return true; // Webhook processed successfully
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

  const handleSubmit = async () => {
    if (!cardComplete) {
      RNAlert.alert("Error", "Please enter your card details");
      return;
    }

    setIsProcessing(true);
    setProcessingStage('payment');

    try {
      // First check if user is authenticated using apiClient
      await apiClient.getCurrentUser();

      // Create subscription with payment intent using apiClient
      const { clientSecret } = await apiClient.createSubscription() as { clientSecret: string };

      // Confirm payment using Stripe React Native
      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        // Only show immediate failure for definitive client-side errors
        const isDefinitiveFailure = error.code === 'Failed' ||
                                   error.code === 'Canceled';

        if (isDefinitiveFailure) {
          RNAlert.alert("Payment Failed", error.message);
          setProcessingStage('idle');
        } else {
          // For ambiguous errors, wait for webhook confirmation
          setProcessingStage('activating');
          RNAlert.alert("Finalizing Payment", "Please wait while we confirm your payment...");

          const webhookSuccess = await pollSubscriptionStatus();

          if (webhookSuccess) {
            RNAlert.alert("Welcome to Pro Learner!", "Your subscription is now active. You have access to all premium content.");
            onSuccess();
          } else {
            RNAlert.alert("Payment Status Unclear", "We're unable to confirm your payment status right now. Please check your account or contact support if needed.");
            setProcessingStage('idle');
          }
        }
      } else {
        // Payment succeeded immediately
        setProcessingStage('activating');
        RNAlert.alert("Payment Successful!", "Activating your Pro Learner subscription...");

        const webhookSuccess = await pollSubscriptionStatus();

        if (webhookSuccess) {
          RNAlert.alert("Welcome to Pro Learner!", "Your subscription is now active. You have access to all premium content.");
          onSuccess();
        } else {
          RNAlert.alert("Payment Successful, Activation Pending", "Your payment was processed successfully. Account activation may take a few minutes.");
          setProcessingStage('idle');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error?.message || "An unexpected error occurred. Please try again.";
      RNAlert.alert("Payment Error", errorMessage);
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

  return (
    <View style={styles.stripeFormContainer}>
      {/* FIXED: Better card field container with improved spacing */}
      <View style={styles.cardFieldContainer}>
        <Text style={styles.cardFieldLabel}>Card Details</Text>
        <View>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.cardFieldStyle}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
              console.log('Card details:', cardDetails);
            }}
          />
        </View>
      </View>
      
      {/* FIXED: Button with more spacing */}
      <View style={styles.stripeButtonContainer}>
        <Button
          onPress={handleSubmit}
          disabled={!cardComplete || isProcessing}
          style={[
            styles.stripeSubmitButton,
            (!cardComplete || isProcessing) && styles.stripeSubmitButtonDisabled
          ]}
        >
          <View style={styles.stripeButtonContent}>
            {isProcessing && <Ionicons name="hourglass" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
            <Text style={[
              styles.stripeSubmitButtonText,
              (!cardComplete || isProcessing) && styles.stripeSubmitButtonTextDisabled
            ]}>
              {getButtonText()}
            </Text>
          </View>
        </Button>
      </View>
      
      <Text style={styles.stripeTermsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
};

// Payment Screen Component with full apiClient integration - matching web exactly
const PaymentScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is authenticated on mount using apiClient
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        await apiClient.getCurrentUser();
      } catch (err: any) {
        console.error('Error checking authentication:', err);
        const errorMessage = err?.message || 'Failed to verify authentication. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleSuccess = () => {
    RNAlert.alert("🎉 Welcome to LingoToday Pro!", "Your subscription is active. You now have access to all premium features.");
    // Navigate to dashboard after successful payment
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };
  
  if (loading) {
    return (
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>Setting up Payment</Text>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color="#6366f1" />
          <Text style={styles.loadingText}>Loading payment form...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    const isAuthError = error?.includes('authenticated') || error?.includes('registration');
    
    return (
      <View style={styles.screenContent}>
        <Text style={styles.screenTitle}>
          {isAuthError ? 'Registration Required' : 'Payment Setup Failed'}
        </Text>
        <Text style={styles.screenSubtitle}>{error}</Text>
        <View style={styles.errorButtonsContainer}>
          {isAuthError && (
            <Button 
              onPress={() => {/* Navigate back to registration */}} 
              style={styles.errorButton}
            >
              <Text style={styles.errorButtonText}>Complete Registration</Text>
            </Button>
          )}
          <Button 
            onPress={() => setError(null)} 
            style={[styles.errorButton, isAuthError && styles.errorButtonSecondary]}
          >
            <Text style={[styles.errorButtonText, isAuthError && styles.errorButtonSecondaryText]}>Try Again</Text>
          </Button>
        </View>
      </View>
    );
  }
  
  // FIXED: Wrap payment content in KeyboardAvoidingView with proper scrolling
  return (
    <KeyboardAvoidingView 
      style={styles.paymentKeyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.paymentScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        bounces={false}
      >
        <View style={styles.paymentScreenContent}>
          <Text style={styles.screenTitle}>
            Complete Your Subscription
          </Text>
          <Text style={styles.screenSubtitle}>
            Start your 5-day free trial now
          </Text>
          
          <View style={styles.paymentPlanCard}>
            <View style={styles.paymentPlanHeader}>
              <Text style={styles.paymentPlanTitle}>💎 Pro Learner</Text>
              <Text style={styles.paymentPlanTrial}>5-Day Free Trial</Text>
              <Text style={styles.paymentPlanPrice}>£2.49/month</Text>
              <Text style={styles.paymentPlanCancel}>Cancel anytime</Text>
            </View>
            
            <View style={styles.paymentPlanFeatures}>
              {[
                '• Full access to all languages',
                '• Unlimited lessons and practice',
                '• Progress tracking and analytics',
                '• Premium video content',
                '• Mobile and desktop sync'
              ].map((feature, index) => (
                <Text key={index} style={styles.paymentPlanFeature}>{feature}</Text>
              ))}
            </View>
          </View>
          
          <StripePaymentForm onSuccess={handleSuccess} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const TestimonialsScreen = ({ onContinue }: { onContinue: () => void }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState<number>(width);

  const testimonials = [
    {
      id: 1,
      text: "The real-life video lessons are brilliant, you feel like you're actually in a café or checking into a hotel. It's so much easier to remember phrases when you see them used in real situations.",
      name: "Anna Müller",
      title: "Property Manager, Berlin",
      initials: "AM",
      avatarBg: '#D1FAE5', // green-100
      avatarText: '#059669', // green-600
    },
    {
      id: 2,
      text: "The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday...",
      name: "Paul Martinez",
      title: "Product Manager, London",
      initials: "SM",
      avatarBg: '#DBEAFE', // blue-100
      avatarText: '#2563EB', // blue-600
    },
    {
      id: 3,
      text: "I tried Duolingo, Babbel, everything. But LingoToday's spaced repetition actually works. My German colleagues are impressed!",
      name: "Sophie Liu",
      title: "Software Engineer, London",
      initials: "AL",
      avatarBg: '#EDE9FE', // purple-100
      avatarText: '#7C3AED', // purple-600
    }
  ];

  const onLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== containerWidth) setContainerWidth(w);
  };

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(testimonials.length - 1, index));
    setSelectedIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * containerWidth, animated: true });
  };

  const handleMomentumEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / containerWidth);
    setSelectedIndex(idx);
  };

  const scrollPrev = () => scrollToIndex(selectedIndex - 1);
  const scrollNext = () => scrollToIndex(selectedIndex + 1);

  return (
    <View style={styles.screenContent} onLayout={onLayout}>
      <Text style={styles.screenTitle}>
        They Started Where You Are - Now They’re Speaking With Confidence
      </Text>

      <View style={styles.testimonialCarousel}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {testimonials.map((t) => (
            <View key={t.id} style={[styles.testimonialSlide, { width: containerWidth }]}>
              <View style={styles.testimonialCard}>
                <View style={styles.testimonialStarsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name="star" size={20} color="#FBBF24" />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <View style={styles.testimonialUserRow}>
                  <View style={[styles.testimonialAvatar, { backgroundColor: t.avatarBg }]}>
                    <Text style={[styles.testimonialAvatarText, { color: t.avatarText }]}>
                      {t.initials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.testimonialUserName}>{t.name}</Text>
                    <Text style={styles.testimonialUserTitle}>{t.title}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.testimonialNavContainer}>
          <Button onPress={scrollPrev} style={styles.testimonialArrowButton}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </Button>
          <View style={styles.testimonialDotsRow}>
            {testimonials.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => scrollToIndex(i)}>
                <View style={[styles.testimonialDot, i === selectedIndex && styles.testimonialDotActive]} />
              </TouchableOpacity>
            ))}
          </View>
          <Button onPress={scrollNext} style={styles.testimonialArrowButton}>
            <Ionicons name="chevron-forward" size={20} color="#111827" />
          </Button>
        </View>
      </View>

      <Button onPress={onContinue} style={styles.testimonialContinueButton}>
        <Text style={styles.testimonialContinueButtonText}>Continue</Text>
      </Button>
    </View>
  );
};
