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
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../contexts/AuthContext';

// Import UI components exactly like web version
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Constants from 'expo-constants';
import { Alert, AlertDescription } from '../components/ui/Alert';

// Import Stripe for React Native
import { StripeProvider, CardField, useStripe, useConfirmPayment } from '@stripe/stripe-react-native';

// Import API client
import { apiClient } from '../lib/apiClient';

// Import Legal Document Modal
import { LegalDocumentModal } from '../components/LegalDocumentModal';

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
  
  // Legal document modal state
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalDocumentType, setLegalDocumentType] = useState<'terms' | 'privacy' | null>(null);

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
      case 5: return true; // Testimonials screen
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
    if (!registerData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (registerData.password !== registerData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
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
            notificationFrequency: 60,
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

  // Legal modal handlers
  const handleOpenLegalModal = (type: 'terms' | 'privacy') => {
    setLegalDocumentType(type);
    setLegalModalVisible(true);
  };

  const handleCloseLegalModal = () => {
    setLegalModalVisible(false);
    setLegalDocumentType(null);
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
          onOpenLegalModal={handleOpenLegalModal}
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

          {/* Continue button - hide on registration, payment, learning plan, and testimonials screens - matching web logic */}
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
      
      {/* Legal Document Modal */}
      <LegalDocumentModal
        visible={legalModalVisible}
        documentType={legalDocumentType}
        onClose={handleCloseLegalModal}
      />
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
  onOpenLegalModal
}: {
  registerData: { firstName: string; email: string; password: string; confirmPassword: string; };
  registerErrors: Record<string, string>;
  isRegistering: boolean;
  onInputChange: (field: keyof typeof registerData, value: string) => void;
  onRegister: () => void;
  onOpenLegalModal: (type: 'terms' | 'privacy') => void;
}) => (
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
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By creating an account, you indicate that you have read and agreed to the{' '}
            <Text 
              style={styles.termsLink} 
              onPress={() => onOpenLegalModal('privacy')}
              testID="link-privacy-policy"
            >
              Privacy Policy
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.termsLink} 
              onPress={() => onOpenLegalModal('terms')}
              testID="link-terms"
            >
              Terms of Use
            </Text>
          </Text>
        </View>
      </View>
    </View>
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

const TestimonialsScreen = ({ onContinue }: { onContinue: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      id: 1,
      text: "The real-life video lessons are brilliant, you feel like you're actually in a café or checking into a hotel. It's so much easier to remember phrases when you see them used in real situations.",
      name: "Anna Müller",
      title: "Property Manager, Berlin",
      initials: "AM",
      bgColor: "#D1FAE5",
      textColor: "#059669"
    },
    {
      id: 2,
      text: "The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday...",
      name: "Paul Martinez",
      title: "Product Manager, London",
      initials: "SM",
      bgColor: "#DBEAFE",
      textColor: "#2563EB"
    },
    {
      id: 3,
      text: "I tried Duolingo, Babbel, everything. But LingoToday's spaced repetition actually works. My German colleagues are impressed!",
      name: "Sophie Liu",
      title: "Software Engineer, London",
      initials: "AL",
      bgColor: "#EDE9FE",
      textColor: "#7C3AED"
    }
  ];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <View style={styles.screenContent}>
      <Text style={styles.screenTitle}>
        They Started Where You Are - Now They're Speaking With Confidence
      </Text>
      
      {/* Testimonial Card */}
      <View style={styles.testimonialCard}>
        {/* Stars */}
        <View style={styles.testimonialStars}>
          {[...Array(5)].map((_, i) => (
            <Ionicons key={i} name="star" size={20} color="#FBBF24" />
          ))}
        </View>
        
        {/* Quote */}
        <Text style={styles.testimonialText}>
          "{currentTestimonial.text}"
        </Text>
        
        {/* Author */}
        <View style={styles.testimonialAuthor}>
          <View style={[styles.testimonialInitials, { backgroundColor: currentTestimonial.bgColor }]}>
            <Text style={[styles.testimonialInitialsText, { color: currentTestimonial.textColor }]}>
              {currentTestimonial.initials}
            </Text>
          </View>
          <View>
            <Text style={styles.testimonialName}>{currentTestimonial.name}</Text>
            <Text style={styles.testimonialTitle}>{currentTestimonial.title}</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.testimonialNavigation}>
        <TouchableOpacity 
          onPress={handlePrevious} 
          style={styles.testimonialNavButton}
          testID="button-testimonial-prev"
        >
          <Ionicons name="chevron-back" size={24} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.testimonialDots}>
          {testimonials.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentIndex(index)}
              style={[
                styles.testimonialDot,
                index === currentIndex && styles.testimonialDotActive
              ]}
              testID={`dot-testimonial-${index}`}
            />
          ))}
        </View>

        <TouchableOpacity 
          onPress={handleNext} 
          style={styles.testimonialNavButton}
          testID="button-testimonial-next"
        >
          <Ionicons name="chevron-forward" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <Button
        onPress={onContinue}
        style={styles.testimonialContinueButton}
      >
        <View style={styles.continueButtonContent}>
          <Text style={styles.testimonialContinueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.continueButtonIcon} />
        </View>
      </Button>
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
        <View style={styles.cardFieldWrapper}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4FF', // bg-gradient-to-br from-blue-50 to-indigo-100
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 512, // max-w-2xl
    alignSelf: 'center',
    paddingHorizontal: 16, // px-4
    paddingVertical: 24, // py-6
    width: '100%',
  },

  // Progress bar - matching web exactly
  progressSection: {
    marginBottom: 32, // mb-8
  },
  progressBackground: {
    width: '100%',
    backgroundColor: '#E5E7EB', // bg-gray-200
    borderRadius: 9999, // rounded-full
    height: 8, // h-2
  },
  progressBar: {
    height: 8, // h-2
    backgroundColor: '#6366f1', // bg-primary
    borderRadius: 9999, // rounded-full
  },
  progressText: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-600
    marginTop: 8, // mt-2
    textAlign: 'center',
  },

  // Screen container with slide animation - matching web
  screenContainer: {
    flex: 1,
    opacity: 1,
    transform: [{ translateX: 0 }],
  },
  screenTransitioning: {
    opacity: 0,
    transform: [{ translateX: 16 }], // transform translate-x-4
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Continue button - matching web exactly
  continueSection: {
    marginTop: 32,
    alignItems: 'center',
    minHeight: 80, // Ensure consistent height regardless of hint text
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14, // Slightly larger padding
    borderRadius: 9999,
    minWidth: 140, // Slightly wider
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#F3F4F6', // bg-gray-100 - lighter disabled state
    borderWidth: 2, // Thicker border
    borderColor: '#E5E7EB', // border-gray-200
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14, // Reduced by 2pts from 16
    fontWeight: '600', // font-semibold - slightly bolder
  },
  continueButtonTextDisabled: {
    color: '#6B7280', // text-gray-500 - better contrast than gray-400
  },
  continueButtonIcon: {
    marginLeft: 8,
  },
  continueHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12, // mt-3 - more space from button
    textAlign: 'center',
    backgroundColor: '#F9FAFB', // bg-gray-50
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // rounded-full
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    overflow: 'hidden',
  },

  // Screen Content - matching web
  screenContent: {
    alignItems: 'center', // text-center
    flex: 1,
  },
  screenTitle: {
    fontSize: 28, // Reduced by 2pts from 30
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    textAlign: 'center',
    marginBottom: 8, // mb-2
  },
  screenSubtitle: {
    fontSize: 16, // Reduced by 2pts from 18
    color: '#6B7280', // text-gray-600
    textAlign: 'center',
    marginBottom: 20, // Reduced from 32 to 20
    lineHeight: 28,
  },

  // Language Selection - matching web grid grid-cols-2 gap-4 max-w-md mx-auto
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // gap-4
    maxWidth: 384, // max-w-md
    width: '100%',
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    alignItems: 'center', // text-center
    width: '47%', // 2 columns
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
  },
  languageCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  languageFlag: {
    fontSize: 48, // text-4xl
    marginBottom: 8, // mb-2
  },
  languageTitle: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: '#111827', // text-gray-900
  },
  languageTitleSelected: {
    color: '#111827',
  },

  // Level Selection - matching web space-y-4 max-w-lg mx-auto
  levelsList: {
    gap: 16, // space-y-4
    maxWidth: 512, // max-w-lg
    width: '100%',
  },
  levelCard: {
    width: '100%',
    padding: 24, // p-6
    borderRadius: 12, // rounded-xl
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF',
  },
  levelCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  levelTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 8, // mb-2
  },
  levelTitleSelected: {
    color: '#111827',
  },
  levelDescription: {
    fontSize: 16, // text-base
    color: '#6B7280', // text-gray-600
  },
  levelDescriptionSelected: {
    color: '#6B7280',
  },

  // Style Selection - matching web design
  styleCard: {
    width: '100%',
    padding: 24, // p-6
    borderRadius: 12, // rounded-xl
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center', // flex items-center space-x-4
  },
  styleCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  styleIcon: {
    fontSize: 28, // text-3xl
    marginRight: 16, // space-x-4
  },
  styleContent: {
    flex: 1,
  },
  styleTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  styleTitleSelected: {
    color: '#111827',
  },
  styleDescription: {
    fontSize: 16, // text-base
    color: '#6B7280', // text-gray-600
  },
  styleDescriptionSelected: {
    color: '#6B7280',
  },

  // Registration Screen - matching web exactly
  errorAlert: {
    borderColor: '#FECACA', // border-red-200
    backgroundColor: '#FEF2F2', // bg-red-50
    marginBottom: 24, // mb-6
  },
  errorAlertText: {
    color: '#B91C1C', // text-red-700
  },
  formSpace: {
    gap: 6, // Reduced from 12 to 6
    maxWidth: 384, // max-w-md
    width: '100%',
  },
  formField: {
    marginBottom: 4, // Reduced from 8 to 4
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2, // Reduced from 4 to 2
  },
  formInput: {
    // Input component handles its own styling
    marginBottom: 0, // Ensure no extra bottom margin
  },
  formInputError: {
    borderColor: '#EF4444', // border-red-500
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444', // text-red-500
    marginTop: 2, // Reduced from 4 to 2
  },
  registerButton: {
    backgroundColor: '#6366f1', // bg-primary hover:bg-primary/90
    paddingHorizontal: 32, // px-8
    paddingVertical: 12, // py-3
    borderRadius: 9999, // rounded-full
    marginTop: 16, // Reduced from 24 to 16
    width: '100%',
  },
  registerButtonDisabled: {
    opacity: 0.5, // disabled:opacity-50
  },
  registerButtonText: {
    color: '#FFFFFF', // text-white
    fontSize: 14, // Reduced by 2pts from 16
    fontWeight: '500',
    textAlign: 'center',
  },
  registerButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Terms section - reduced spacing
  termsSection: {
    marginTop: 16, // Reduced from 24 to 16
    paddingTop: 12, // Reduced from 16 to 12
  },
  termsText: {
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-600
    textAlign: 'center',
    lineHeight: 16, // Reduced from 18 to 16
  },
  termsLink: {
    color: '#374151', // text-gray-700
    textDecorationLine: 'underline',
  },

  // Notification Screen
  notificationIconContainer: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32, // rounded-full
    marginBottom: 16, // mb-4
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  notificationEnabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // bg-green-100
  },
  notificationDisabled: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)', // bg-yellow-100
  },
  notificationButtonContainer: {
    gap: 12,
    marginBottom: 32,
    width: '100%',
    maxWidth: 384,
  },
  notificationButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    width: '100%',
  },
  notificationButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // Reduced by 2pts from 18
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationButtonDisabled: {
    opacity: 0.5,
  },
  notificationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  notificationSkipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 9999,
    width: '100%',
  },
  notificationSkipButtonText: {
    color: '#6366f1',
    fontSize: 16, // Reduced by 2pts from 18
    fontWeight: '500',
    textAlign: 'center',
  },

  // Learning Plan Screen
  timelineCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    marginBottom: 24, // mb-6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2, // shadow-sm
    width: '100%',
    maxWidth: 512,
  },
  timelineSpace: {
    gap: 24, // space-y-6
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // flex items-start space-x-4
    gap: 16,
  },
  timelineIcon: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // shadow-lg
  },
  timelineEmoji: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4, // pt-1
  },
  timelineText: {
    fontSize: 16, // Reduced by 2pts from 18
    color: '#111827', // text-gray-900
    fontWeight: '600', // font-semibold
    lineHeight: 28, // leading-relaxed
  },

  // Start Free Trial Section
  trialSection: {
    marginTop: 32, // mt-8
    gap: 16, // space-y-4
    width: '100%',
    maxWidth: 384,
  },
  noPaymentContainer: {
    alignItems: 'center',
  },
  noPaymentText: {
    fontSize: 16,
    color: '#374151', // text-gray-700
    fontWeight: '500', // font-medium
  },
  startTrialButton: {
    backgroundColor: '#6366f1', // bg-primary hover:bg-primary/90
    paddingHorizontal: 32, // px-8
    paddingVertical: 12, // py-3
    borderRadius: 9999, // rounded-full
    width: '100%',
  },
  startTrialButtonText: {
    color: '#FFFFFF', // text-white
    fontSize: 14, // Reduced by 2pts from 16
    fontWeight: '500',
    textAlign: 'center',
  },
  trialPriceContainer: {
    alignItems: 'center',
    marginTop: 12, // mt-3
  },
  trialPriceText: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },

  // Payment Screen - Stripe Integration Styles
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorButtonsContainer: {
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 384,
  },
  errorButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    width: '100%',
  },
  errorButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 14, // Reduced by 2pts from 16
    fontWeight: '500',
    textAlign: 'center',
  },
  errorButtonSecondaryText: {
    color: '#6366f1',
  },
  paymentPlanCard: {
    backgroundColor: '#EFF6FF', // bg-blue-50
    borderRadius: 12, // rounded-xl
    padding: 16, // p-4
    marginBottom: 24, // mb-6
    width: '100%',
  },
  paymentPlanHeader: {
    marginBottom: 12,
  },
  paymentPlanTitle: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentPlanTrial: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  paymentPlanPrice: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentPlanCancel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  paymentPlanFeatures: {
    gap: 4,
  },
  paymentPlanFeature: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stripeFormContainer: {
    gap: 24,
    width: '100%',
  },
  cardFieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardFieldWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stripeButtonContainer: {
    marginTop: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  cardFieldStyle: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  stripeSubmitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 9999,
    width: '100%',
  },
  stripeSubmitButtonDisabled: {
    opacity: 0.5,
  },
  stripeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // Reduced by 2pts from 18
    fontWeight: '600',
    textAlign: 'center',
  },
  stripeSubmitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  stripeTermsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // FIXED: New styles for payment screen keyboard avoiding view and scroll
  paymentKeyboardContainer: {
    flex: 1,
    width: '100%',
  },
  paymentScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 24,
  },
  paymentScreenContent: {
    flex: 1,
    maxWidth: 384,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },

  // Testimonials Screen Styles
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 512,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  testimonialText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialInitialsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  testimonialTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  testimonialNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  testimonialNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  testimonialDots: {
    flexDirection: 'row',
    gap: 8,
  },
  testimonialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  testimonialDotActive: {
    width: 32,
    backgroundColor: '#6366f1',
  },
  testimonialContinueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    width: '100%',
    maxWidth: 448,
  },
  testimonialContinueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});