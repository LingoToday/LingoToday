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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingMethodsScreen from './OnboardingMethodsScreen';
import OnboardingBarriersScreen from './OnboardingBarriersScreen';
import OnboardingFlexibilityScreen from './OnboardingFlexibilityScreen';
import OnboardingChallengeScreen from './OnboardingChallengeScreen';
import OnboardingImprovementAreasScreen from './OnboardingImprovementAreasScreen';
import OnboardingVocabularyScreen from './OnboardingVocabularyScreen';
import OnboardingInterestsScreen from './OnboardingInterestsScreen';
import OnboardingEventsScreen from './OnboardingEventsScreen';
import OnboardingLoadingScreen from './OnboardingLoadingScreen';
import OnboardingGrowthChartScreen from './OnboardingGrowthChartScreen';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/OnboardingStyles';
import { theme } from '../lib/theme';

// Import UI components exactly like web version
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Constants from 'expo-constants';
import { Asset } from 'expo-asset';
import { Alert, AlertDescription } from '../components/ui/Alert';

// Import API client
import { apiClient } from '../lib/apiClient';

// Import IAP service
import { purchaseService } from '../services/purchaseService';
import { PurchasesPackage } from 'react-native-purchases';
import { PRO_PRICING } from '../constants/pricing';

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

const ageRanges = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45+', label: '45 +' },
];

const genderOptions = [
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'rather_not_say', label: 'Rather not to say', emoji: '🤐' },
];

const currentLevelOptions = [
  { value: 'total_beginner', label: 'Total Beginner' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'pre_intermediate', label: 'Pre-Intermediate' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'upper_intermediate', label: 'Upper Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'proficient', label: 'Proficient' },
];

const motivationOptions = [
  { value: 'career_growth', label: 'Career growth', emoji: '💼' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'study_abroad', label: 'Study abroad', emoji: '🎓' },
  { value: 'living_abroad', label: 'Living abroad', emoji: '🏠' },
  { value: 'personal_development', label: 'Personal development', emoji: '🌱' },
];

const useCaseOptions = [
  { value: 'hotel_booking', label: 'Hotel booking', emoji: '🏨' },
  { value: 'emergencies', label: 'Emergencies', emoji: '🚨' },
  { value: 'food_and_cafe', label: 'Food and cafe', emoji: '☕' },
  { value: 'city_navigation', label: 'City navigation', emoji: '🗺️' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'transport', label: 'Transport', emoji: '🚌' },
  { value: 'culture_etiquette', label: 'Culture & Etiquette', emoji: '🎭' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'problem_solving', label: 'Problem solving', emoji: '🧩' },
];

const learningGoalOptions = [
  { value: 'speak_confidently', label: 'Speak confidently with natives', emoji: '🗣️' },
  { value: 'watch_movies', label: 'Watch movies without subtitles', emoji: '🎬' },
  { value: 'understand_conversations', label: 'Understand conversations effortlessly', emoji: '👂' },
  { value: 'read_fluently', label: 'Read texts fluently', emoji: '📖' },
];

const experienceOptions = [
  { value: 'recently', label: 'Recently' },
  { value: 'a_year_ago', label: 'A year ago' },
  { value: 'more_than_a_year_ago', label: 'More than a year ago' },
  { value: 'never', label: 'Never' },
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


export default function OnboardingScreen() {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedCurrentLevel, setSelectedCurrentLevel] = useState('');
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [challengeAnswer1, setChallengeAnswer1] = useState('');
  const [challengeAnswer2, setChallengeAnswer2] = useState('');
  const [challengeAnswer3, setChallengeAnswer3] = useState('');
  const [selectedImprovementAreas, setSelectedImprovementAreas] = useState<string[]>([]);
  const [vocabKnown1, setVocabKnown1] = useState<string[]>([]);
  const [vocabKnown2, setVocabKnown2] = useState<string[]>([]);
  const [vocabKnown3, setVocabKnown3] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
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

  const totalScreens = 26;

  // Function to clear onboarding state (for testing/reset) - matching web exactly
  const clearOnboardingState = async () => {
    try {
      await AsyncStorage.removeItem('lingoToday_onboarding_temp');
      await AsyncStorage.removeItem('lingoToday_onboarding');
      setCurrentScreen(0);
      setSelectedLanguage('');
      setSelectedAge('');
      setSelectedGender('');
      setSelectedCurrentLevel('');
      setSelectedMotivations([]);
      setSelectedUseCases([]);
      setSelectedGoals([]);
      setSelectedExperience('');
      setSelectedMethods([]);
      setSelectedBarriers([]);
      setChallengeAnswer1('');
      setChallengeAnswer2('');
      setChallengeAnswer3('');
      setSelectedImprovementAreas([]);
      setVocabKnown1([]);
      setVocabKnown2([]);
      setVocabKnown3([]);
      setSelectedInterests([]);
      setSelectedEvent('');
      setSelectedGoal('');
      setSelectedLevel('');
      setSelectedLearningStyle('');
      setNotificationsEnabled(false);
      console.log('🧹 Onboarding state cleared');
    } catch (error) {
      console.error('Error clearing onboarding state:', error);
    }
  };
  
  useEffect(() => {
    const loadOnboardingData = async () => {
      await clearOnboardingState();
    };
    
    loadOnboardingData();

    Asset.loadAsync([
      require('../../attached_assets/Flexibility_Messaging__1770935348200.png'),
      require('../../attached_assets/Loading_&_Plan_Creation_1770935409900.png'),
    ]).catch(() => {});
  }, []);
  
  // Save to AsyncStorage whenever data changes - matching web localStorage functionality
  const saveToLocalStorage = async () => {
    try {
      const data = {
        language: selectedLanguage,
        age: selectedAge,
        gender: selectedGender,
        currentLevel: selectedCurrentLevel,
        motivations: selectedMotivations,
        useCases: selectedUseCases,
        goals: selectedGoals,
        experience: selectedExperience,
        methods: selectedMethods,
        barriers: selectedBarriers,
        challengeAnswer1,
        challengeAnswer2,
        challengeAnswer3,
        improvementAreas: selectedImprovementAreas,
        vocabKnown1,
        vocabKnown2,
        vocabKnown3,
        interests: selectedInterests,
        event: selectedEvent,
        dailyGoal: selectedGoal,
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
    if (selectedLanguage || selectedAge || selectedGender || selectedCurrentLevel || selectedMotivations.length || selectedUseCases.length || selectedGoals.length || selectedExperience || selectedMethods.length || selectedBarriers.length || challengeAnswer1 || challengeAnswer2 || challengeAnswer3 || selectedImprovementAreas.length || vocabKnown1.length || vocabKnown2.length || vocabKnown3.length || selectedInterests.length || selectedEvent || selectedGoal || selectedLevel || selectedLearningStyle) {
      saveToLocalStorage();
    }
  }, [selectedLanguage, selectedAge, selectedGender, selectedCurrentLevel, selectedMotivations, selectedUseCases, selectedGoals, selectedExperience, selectedMethods, selectedBarriers, challengeAnswer1, challengeAnswer2, challengeAnswer3, selectedImprovementAreas, vocabKnown1, vocabKnown2, vocabKnown3, selectedInterests, selectedEvent, selectedGoal, selectedLevel, selectedLearningStyle, notificationsEnabled, currentScreen]);

  const nextScreen = () => {
    if (currentScreen < totalScreens - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentScreen(currentScreen + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const toggleMultiSelect = (value: string, selected: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(value)) {
      setter(selected.filter(v => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const canContinueFromScreen = (screen: number) => {
    switch (screen) {
      case 0: return selectedLanguage !== '';
      case 1: return selectedAge !== '';
      case 2: return selectedGender !== '';
      case 3: return selectedCurrentLevel !== '';
      case 4: return selectedMotivations.length > 0;
      case 5: return selectedUseCases.length > 0;
      case 6: return selectedGoals.length > 0;
      case 7: return selectedExperience !== '';
      case 8: return selectedMethods.length > 0;
      case 9: return selectedBarriers.length > 0;
      case 10: return true;
      case 11: return challengeAnswer1 !== '';
      case 12: return challengeAnswer2 !== '';
      case 13: return challengeAnswer3 !== '';
      case 14: return selectedImprovementAreas.length > 0;
      case 15: return true;
      case 16: return true;
      case 17: return true;
      case 18: return selectedInterests.length > 0;
      case 19: return selectedEvent !== '';
      case 20: return false;
      case 21: return true;
      case 22: return false;
      case 23: return true;
      case 24: return true;
      case 25: return true;
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
    try {
      // Request actual OS notification permissions
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowTimeSensitive: true as any, // Type not yet in SDK 54 definitions but supported
          allowCriticalAlerts: false,
          provideAppNotificationSettings: true,
        },
      });
      
      const permissionGranted = status === 'granted';
      setNotificationsEnabled(permissionGranted);
      
      console.log('🔔 Notification permission result:', status);
      
      // Update AsyncStorage with the permission result
      const data = {
        language: selectedLanguage,
        level: selectedLevel,
        learningStyle: selectedLearningStyle,
        notifications: permissionGranted,
        currentScreen
      };
      await AsyncStorage.setItem('lingoToday_onboarding_temp', JSON.stringify(data));
      
      return permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setNotificationsEnabled(false);
      return false;
    }
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
        }
        
        try {
          console.log('📋 Sending onboarding profile to backend...');
          const languageCodeMap: Record<string, string> = { italian: 'it', spanish: 'es', german: 'de', french: 'fr' };
          const levelCodeMap: Record<string, string> = {
            total_beginner: 'complete_beginner', beginner: 'beginner', pre_intermediate: 'some_basics',
            intermediate: 'intermediate', upper_intermediate: 'upper_intermediate', advanced: 'advanced', proficient: 'fluent',
          };
          const onboardingProfile = {
            language: languageCodeMap[selectedLanguage] || selectedLanguage,
            age: selectedAge,
            gender: selectedGender,
            currentLevel: levelCodeMap[selectedCurrentLevel] || selectedCurrentLevel,
            motivations: selectedMotivations,
            useCases: selectedUseCases,
            goals: selectedGoals,
            experience: selectedExperience,
            methods: selectedMethods,
            barriers: selectedBarriers,
            challengeAnswers: {
              '1': challengeAnswer1,
              '2': challengeAnswer2,
              '3': challengeAnswer3,
            },
            improvementAreas: selectedImprovementAreas,
            vocabKnown: {
              a1a2: vocabKnown1,
              b1b2: vocabKnown2,
              c1c2: vocabKnown3,
            },
            interests: selectedInterests,
            upcomingEvent: selectedEvent,
            dailyGoal: selectedGoal,
          };
          const profileResponse = await apiClient.postOnboardingProfile(onboardingProfile);
          console.log('✅ Onboarding profile saved:', profileResponse);
          
          await AsyncStorage.setItem('lingoToday_assigned_level', JSON.stringify({
            assignedLevel: profileResponse.assignedLevel,
            startingTrack: profileResponse.startingTrack,
            recommendedDailyGoal: profileResponse.recommendedDailyGoal,
          }));
        } catch (profileError) {
          console.error('❌ Error saving onboarding profile (non-critical):', profileError);
        }
        
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
      
      // Check if this is a network connectivity error
      if (error.message && (
        error.message.includes('Network connection failed') ||
        error.message.includes('Network request failed') ||
        error.message.includes('fetch')
      )) {
        setRegisterErrors({ general: 'Network error. Please check your connection and try again.' });
      } else {
        // This is an API error with a specific message - display it directly
        setRegisterErrors({ general: error.message || 'Registration failed. Please try again.' });
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
        return <AgeSelectionScreen
          selectedAge={selectedAge}
          onAgeSelect={setSelectedAge}
        />;
      case 2:
        return <GenderSelectionScreen
          selectedGender={selectedGender}
          onGenderSelect={setSelectedGender}
        />;
      case 3:
        return <CurrentLevelScreen
          selectedCurrentLevel={selectedCurrentLevel}
          onCurrentLevelSelect={setSelectedCurrentLevel}
          onContinue={nextScreen}
        />;
      case 4:
        return <LearningMotivationScreen
          selectedMotivations={selectedMotivations}
          onToggle={(value) => toggleMultiSelect(value, selectedMotivations, setSelectedMotivations)}
        />;
      case 5:
        return <UseCaseScenariosScreen
          selectedUseCases={selectedUseCases}
          onToggle={(value) => toggleMultiSelect(value, selectedUseCases, setSelectedUseCases)}
        />;
      case 6:
        return <LearningGoalsScreen
          selectedGoals={selectedGoals}
          onToggle={(value) => toggleMultiSelect(value, selectedGoals, setSelectedGoals)}
        />;
      case 7:
        return <PreviousExperienceScreen
          selectedExperience={selectedExperience}
          onExperienceSelect={setSelectedExperience}
        />;
      case 8:
        return <OnboardingMethodsScreen
          selectedMethods={selectedMethods}
          onToggle={(value) => toggleMultiSelect(value, selectedMethods, setSelectedMethods)}
        />;
      case 9:
        return <OnboardingBarriersScreen
          selectedBarriers={selectedBarriers}
          onToggle={(value) => toggleMultiSelect(value, selectedBarriers, setSelectedBarriers)}
        />;
      case 10:
        return <OnboardingFlexibilityScreen />;
      case 11:
        return <OnboardingChallengeScreen
          statement="I don't understand when someone speaks fluently."
          selectedAnswer={challengeAnswer1}
          onAnswerSelect={setChallengeAnswer1}
        />;
      case 12:
        return <OnboardingChallengeScreen
          statement="I find it hard to express myself because my vocabulary is limited."
          selectedAnswer={challengeAnswer2}
          onAnswerSelect={setChallengeAnswer2}
        />;
      case 13:
        return <OnboardingChallengeScreen
          statement="I often struggle with forming sentences correctly when I speak."
          selectedAnswer={challengeAnswer3}
          onAnswerSelect={setChallengeAnswer3}
        />;
      case 14:
        return <OnboardingImprovementAreasScreen
          selectedAreas={selectedImprovementAreas}
          onToggle={(value) => toggleMultiSelect(value, selectedImprovementAreas, setSelectedImprovementAreas)}
        />;
      case 15:
        return <OnboardingVocabularyScreen
          selectedLanguage={selectedLanguage}
          level="a1a2"
          selectedWords={vocabKnown1}
          onToggle={(word) => toggleMultiSelect(word, vocabKnown1, setVocabKnown1)}
        />;
      case 16:
        return <OnboardingVocabularyScreen
          selectedLanguage={selectedLanguage}
          level="b1b2"
          selectedWords={vocabKnown2}
          onToggle={(word) => toggleMultiSelect(word, vocabKnown2, setVocabKnown2)}
        />;
      case 17:
        return <OnboardingVocabularyScreen
          selectedLanguage={selectedLanguage}
          level="c1c2"
          selectedWords={vocabKnown3}
          onToggle={(word) => toggleMultiSelect(word, vocabKnown3, setVocabKnown3)}
        />;
      case 18:
        return <OnboardingInterestsScreen
          selectedInterests={selectedInterests}
          onToggle={(value) => toggleMultiSelect(value, selectedInterests, setSelectedInterests)}
        />;
      case 19:
        return <OnboardingEventsScreen
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
        />;
      case 20:
        return <OnboardingLoadingScreen
          onComplete={nextScreen}
          selectedGoal={selectedGoal}
          onGoalSelect={setSelectedGoal}
        />;
      case 21:
        return <OnboardingGrowthChartScreen />;
      case 22:
        return <RegistrationScreen 
          registerData={registerData}
          registerErrors={registerErrors}
          isRegistering={isRegistering}
          onInputChange={handleRegisterInputChange}
          onRegister={handleRegister}
          navigation={navigation}
        />;
      case 23:
        return <NotificationScreen 
          notificationsEnabled={notificationsEnabled}
          onRequestPermission={requestNotificationPermission}
        />;
      case 24:
        return <TestimonialsScreen onContinue={nextScreen} />;
      case 25:
        return <PaymentScreen onSuccess={handlePaymentSuccess} />;
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
        routes: [{ name: 'MainTabs' as never }],
      });
    }, 1000);
  }
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
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
            
          </View>

          {/* Handle payment screen separately */}
          {currentScreen === 25 ? (
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

          {/* Continue button - hide on current level (3, has own), loading (20), registration (22), testimonials (24), payment (25) */}
          {currentScreen < 25 && currentScreen !== 3 && currentScreen !== 20 && currentScreen !== 22 && currentScreen !== 24 && (
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
                    color={(!canContinueFromScreen(currentScreen) || isTransitioning) ? "#9CA3AF" : theme.colors.primaryForeground} 
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

const AgeSelectionScreen = ({ selectedAge, onAgeSelect }: {
  selectedAge: string;
  onAgeSelect: (age: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Start speaking a new language with LingoToday
    </Text>
    <Text style={styles.screenSubtitle}>
      Get your personalised learning plan tailored to your language goals
    </Text>
    
    <View style={styles.languageGrid}>
      {ageRanges.map((age) => (
        <TouchableOpacity
          key={age.value}
          onPress={() => onAgeSelect(age.value)}
          style={[
            styles.ageCard,
            selectedAge === age.value && styles.ageCardSelected,
          ]}
          testID={`button-age-${age.value}`}
        >
          <Text style={[
            styles.ageLabel,
            selectedAge === age.value && styles.ageLabelSelected,
          ]}>
            {age.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const GenderSelectionScreen = ({ selectedGender, onGenderSelect }: {
  selectedGender: string;
  onGenderSelect: (gender: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What is your gender?
    </Text>
    <Text style={styles.screenSubtitle}>
      Our tutors want to address you correctly.
    </Text>
    
    <View style={styles.levelsList}>
      {genderOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onGenderSelect(option.value)}
          style={[
            styles.genderCard,
            selectedGender === option.value && styles.genderCardSelected,
          ]}
          testID={`button-gender-${option.value}`}
        >
          <Text style={styles.genderEmoji}>{option.emoji}</Text>
          <Text style={[
            styles.genderLabel,
            selectedGender === option.value && styles.genderLabelSelected,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CurrentLevelScreen = ({ selectedCurrentLevel, onCurrentLevelSelect, onContinue }: {
  selectedCurrentLevel: string;
  onCurrentLevelSelect: (level: string) => void;
  onContinue: () => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What is your current language level?
    </Text>
    
    <View style={styles.currentLevelGrid}>
      {currentLevelOptions.map((level) => (
        <TouchableOpacity
          key={level.value}
          onPress={() => onCurrentLevelSelect(level.value)}
          style={[
            styles.currentLevelCard,
            selectedCurrentLevel === level.value && styles.currentLevelCardSelected,
          ]}
          testID={`button-currentlevel-${level.value}`}
        >
          <Text style={[
            styles.currentLevelLabel,
            selectedCurrentLevel === level.value && styles.currentLevelLabelSelected,
          ]}>
            {level.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.currentLevelContinueSection}>
      <Button
        onPress={onContinue}
        disabled={selectedCurrentLevel === ''}
        style={[
          styles.continueButton,
          selectedCurrentLevel === '' && styles.continueButtonDisabled
        ]}
      >
        <View style={styles.continueButtonContent}>
          <Text style={[
            styles.continueButtonText,
            selectedCurrentLevel === '' && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={selectedCurrentLevel === '' ? "#9CA3AF" : theme.colors.primaryForeground} 
            style={styles.continueButtonIcon}
          />
        </View>
      </Button>
    </View>
  </View>
);

const LearningMotivationScreen = ({ selectedMotivations, onToggle }: {
  selectedMotivations: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Why do you want to learn a new language?
    </Text>
    
    <View style={styles.levelsList}>
      {motivationOptions.map((option) => {
        const isSelected = selectedMotivations.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.genderCard,
              isSelected && styles.multiSelectCardSelected,
            ]}
            testID={`button-motivation-${option.value}`}
          >
            <Text style={styles.genderEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.genderLabel,
              isSelected && styles.genderLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.multiSelectCheck}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const UseCaseScenariosScreen = ({ selectedUseCases, onToggle }: {
  selectedUseCases: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Where would you use the new language?
    </Text>
    
    <View style={styles.levelsList}>
      {useCaseOptions.map((option) => {
        const isSelected = selectedUseCases.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.genderCard,
              isSelected && styles.multiSelectCardSelected,
            ]}
            testID={`button-usecase-${option.value}`}
          >
            <Text style={styles.genderEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.genderLabel,
              isSelected && styles.genderLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.multiSelectCheck}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const LearningGoalsScreen = ({ selectedGoals, onToggle }: {
  selectedGoals: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What level do you aim to achieve?
    </Text>
    
    <View style={styles.goalsGrid}>
      {learningGoalOptions.map((option) => {
        const isSelected = selectedGoals.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.goalCard,
              isSelected && styles.goalCardSelected,
            ]}
            testID={`button-goal-${option.value}`}
          >
            <Text style={styles.goalEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.goalLabel,
              isSelected && styles.goalLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.goalCheckIcon}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const PreviousExperienceScreen = ({ selectedExperience, onExperienceSelect }: {
  selectedExperience: string;
  onExperienceSelect: (experience: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      When did you last pick up a new language?
    </Text>
    
    <View style={styles.levelsList}>
      {experienceOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onExperienceSelect(option.value)}
          style={[
            styles.levelCard,
            selectedExperience === option.value && styles.levelCardSelected,
          ]}
          testID={`button-experience-${option.value}`}
        >
          <Text style={[
            styles.levelTitle,
            selectedExperience === option.value && styles.levelTitleSelected,
          ]}>
            {option.label}
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
}) => {
  const handleOpenTerms = async () => {
    await WebBrowser.openBrowserAsync('https://www.lingotoday.co/terms');
  };

  const handleOpenPrivacy = async () => {
    await WebBrowser.openBrowserAsync('https://www.lingotoday.co/privacy');
  };

  const handleRestorePurchase = async () => {
    try {
      RNAlert.alert('Restore Purchases', 'Checking for existing subscriptions...');
      
      const result = await purchaseService.restorePurchases();
      
      if (result.success) {
        // Notify backend about restored purchase to sync entitlements
        try {
          // Refresh user data to get updated subscription status
          const updatedUser = await apiClient.getCurrentUser();
          console.log('✅ User data refreshed after restore:', updatedUser);
        } catch (backendError) {
          console.warn('⚠️ Failed to refresh user after restore:', backendError);
          // Continue anyway - RevenueCat webhook will eventually sync
        }

        RNAlert.alert(
          '✅ Purchase Restored',
          'Your subscription has been restored successfully!'
        );
      } else {
        RNAlert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases for this account.'
        );
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      RNAlert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    // Open App Store subscription management on iOS
    if (Platform.OS === 'ios') {
      await WebBrowser.openBrowserAsync('https://apps.apple.com/account/subscriptions');
    } else {
      // For Android, open Google Play subscriptions
      await WebBrowser.openBrowserAsync('https://play.google.com/store/account/subscriptions');
    }
  };

  return (
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
            <Ionicons name="alert-circle" size={16} color={theme.colors.destructive} />
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
                <Text style={styles.termsLink} onPress={handleOpenPrivacy}>Privacy Policy</Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={handleOpenTerms}>Terms of Use</Text>
              </Text>
              
              <Text style={styles.restoreText}>
                Alternatively,{' '}
                <Text style={styles.termsLink} onPress={handleRestorePurchase}>Restore</Text>
                {' '}your purchase or{' '}
                <Text style={styles.termsLink} onPress={handleManageSubscription}>Manage Subscription</Text>
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
};

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
            <Ionicons name="hourglass" size={20} color={theme.colors.primary} />
            <Text style={styles.loadingText}>Saving preferences...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screenContent}>
      <View style={styles.notificationIconContainer}>
        <Ionicons name="notifications" size={32} color={theme.colors.primary} />
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

// IAP Purchase Component
const IAPPurchaseForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);

  useEffect(() => {
    initializeAndFetchOfferings();
  }, []);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializeAndFetchOfferings = async () => {
    try {
      setLoadingOfferings(true);
      setErrorMessage(null);
      
      // Get current user to initialize RevenueCat with user ID
      const user = await apiClient.getCurrentUser();
      const userId = (user as any)?.id || (user as any)?.email;
      
      // Initialize RevenueCat
      await purchaseService.initialize(userId);
      
      // Fetch available offerings
      const availablePackages = await purchaseService.getOfferings();
      
      if (availablePackages.length === 0) {
        setErrorMessage('No subscription plans are currently available. Please check your internet connection and try again.');
        return;
      }
      
      setPackages(availablePackages);
      
      // Auto-select the first package
      if (availablePackages.length > 0) {
        setSelectedPackage(availablePackages[0]);
      }
    } catch (error: any) {
      console.error('Error fetching offerings:', error);
      const message = error?.message || 'Unable to load subscription options. Please check your connection and try again.';
      setErrorMessage(message);
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      RNAlert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await purchaseService.purchasePackage(selectedPackage);

      if (result.success) {
        // Notify backend about the purchase to sync entitlements
        try {
          // Refresh user data to get updated subscription status
          const updatedUser = await apiClient.getCurrentUser();
          console.log('✅ User data refreshed after purchase:', updatedUser);
        } catch (backendError) {
          console.warn('⚠️ Failed to refresh user after purchase:', backendError);
          // Continue anyway - RevenueCat webhook will eventually sync
        }

        RNAlert.alert(
          '🎉 Welcome to LingoToday Pro!',
          'Your subscription is now active. You have access to all premium features.',
          [{ text: 'Continue', onPress: onSuccess }]
        );
      } else if (result.error === 'Purchase cancelled') {
        // User cancelled, do nothing
      } else {
        RNAlert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      RNAlert.alert('Purchase Error', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);

    try {
      const result = await purchaseService.restorePurchases();

      if (result.success) {
        RNAlert.alert(
          '✅ Purchase Restored',
          'Your subscription has been restored successfully!',
          [{ text: 'Continue', onPress: onSuccess }]
        );
      } else {
        RNAlert.alert('No Purchases Found', 'We couldn\'t find any previous purchases for this account.');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      RNAlert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    // Open App Store subscription management on iOS
    if (Platform.OS === 'ios') {
      await WebBrowser.openBrowserAsync('https://apps.apple.com/account/subscriptions');
    } else {
      // For Android, open Google Play subscriptions
      await WebBrowser.openBrowserAsync('https://play.google.com/store/account/subscriptions');
    }
  };

  if (loadingOfferings) {
    return (
      <View style={styles.stripeFormContainer}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </View>
    );
  }

  if (errorMessage || packages.length === 0) {
    return (
      <View style={styles.stripeFormContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.destructive} style={{ marginBottom: 16 }} />
          <Text style={styles.errorTitle}>Unable to Load Subscription Options</Text>
          <Text style={styles.errorText}>
            {errorMessage || 'No subscription options available at this time.'}
          </Text>
          <Button onPress={initializeAndFetchOfferings} style={styles.retryButton}>
            <View style={styles.stripeButtonContent}>
              <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </View>
          </Button>
        </View>
      </View>
    );
  }

  const formatPrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getTrialText = (pkg: PurchasesPackage) => {
    if (pkg.product.introPrice) {
      const period = pkg.product.introPrice.periodNumberOfUnits;
      const unit = pkg.product.introPrice.periodUnit.toLowerCase();
      return `${period}-${unit} free trial`;
    }
    return null;
  };

  const getPackageIdentifier = (pkg: PurchasesPackage) => {
    return pkg.identifier;
  };

  return (
    <View style={styles.stripeFormContainer}>
      {/* Display all available packages */}
      {packages.map((pkg) => {
        const isSelected = selectedPackage?.identifier === pkg.identifier;
        const trialText = getTrialText(pkg);
        
        return (
          <TouchableOpacity
            key={getPackageIdentifier(pkg)}
            style={[
              styles.packageOption,
              isSelected && styles.packageOptionSelected
            ]}
            onPress={() => setSelectedPackage(pkg)}
            disabled={isProcessing}
          >
            <View style={styles.packageOptionContent}>
              <View style={styles.packageRadio}>
                {isSelected && <View style={styles.packageRadioSelected} />}
              </View>
              
              <View style={styles.packageDetails}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageTitle}>
                    {pkg.product.title}
                  </Text>
                  {trialText && (
                    <View style={styles.trialBadge}>
                      <Text style={styles.trialBadgeText}>{trialText}</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.packagePrice}>{formatPrice(pkg)}</Text>
                
                {pkg.product.description && (
                  <Text style={styles.packageDescription} numberOfLines={2}>
                    {pkg.product.description}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Purchase Button */}
      <View style={styles.stripeButtonContainer}>
        <Button
          onPress={handlePurchase}
          disabled={isProcessing || !selectedPackage}
          style={[
            styles.stripeSubmitButton,
            (isProcessing || !selectedPackage) && styles.stripeSubmitButtonDisabled
          ]}
        >
          <View style={styles.stripeButtonContent}>
            {isProcessing && <Ionicons name="hourglass" size={16} color="#ffffff" style={{ marginRight: 8 }} />}
            <Text style={[
              styles.stripeSubmitButtonText,
              (isProcessing || !selectedPackage) && styles.stripeSubmitButtonTextDisabled
            ]}>
              {isProcessing ? 'Processing...' : selectedPackage && getTrialText(selectedPackage) ? 'Start Free Trial' : 'Subscribe Now'}
            </Text>
          </View>
        </Button>
      </View>

      {/* Restore Purchases Button */}
      <TouchableOpacity onPress={handleRestore} disabled={isProcessing} style={styles.restorePurchasesButton}>
        <Text style={styles.restorePurchasesText}>Restore Purchases</Text>
      </TouchableOpacity>

      {/* Manage Subscription Link */}
      <TouchableOpacity onPress={handleManageSubscription} disabled={isProcessing} style={styles.restorePurchasesButton}>
        <Text style={styles.restorePurchasesText}>Manage Subscription</Text>
      </TouchableOpacity>

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
          <Ionicons name="hourglass" size={32} color={theme.colors.primary} />
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
            Choose your plan and start learning today
          </Text>
          
          <IAPPurchaseForm onSuccess={handleSuccess} />
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
      avatarBg: theme.colors.success500,
      avatarText: theme.colors.success500,
    },
    {
      id: 2,
      text: "The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday...",
      name: "Paul Martinez",
      title: "Product Manager, London",
      initials: "SM",
      avatarBg: theme.colors.primary,
      avatarText: theme.colors.primary,
    },
    {
      id: 3,
      text: "I tried Duolingo, Babbel, everything. But LingoToday's spaced repetition actually works. My German colleagues are impressed!",
      name: "Sophie Liu",
      title: "Software Engineer, London",
      initials: "AL",
      avatarBg: theme.colors.primary,
      avatarText: theme.colors.primary,
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
                    <Ionicons key={i} name="star" size={20} color={theme.colors.warning500} />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <View style={styles.testimonialUserRow}>
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
            <Ionicons name="chevron-back" size={20} color={theme.colors.foreground} />
          </Button>
          <View style={styles.testimonialDotsRow}>
            {testimonials.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => scrollToIndex(i)}>
                <View style={[styles.testimonialDot, i === selectedIndex && styles.testimonialDotActive]} />
              </TouchableOpacity>
            ))}
          </View>
          <Button onPress={scrollNext} style={styles.testimonialArrowButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.foreground} />
          </Button>
        </View>
      </View>

      <Button onPress={onContinue} style={styles.testimonialContinueButton}>
        <Text style={styles.testimonialContinueButtonText}>Continue</Text>
      </Button>
    </View>
  );
};
