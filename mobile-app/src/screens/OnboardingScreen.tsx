import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

interface OnboardingScreenProps {
  navigation: any;
}

const LANGUAGES = [
  { code: 'italian', name: 'Italian', emoji: '🇮🇹', description: 'Learn the language of art and cuisine' },
  { code: 'spanish', name: 'Spanish', emoji: '🇪🇸', description: 'Speak to over 500 million people worldwide' },
  { code: 'french', name: 'French', emoji: '🇫🇷', description: 'The language of love and diplomacy' },
  { code: 'german', name: 'German', emoji: '🇩🇪', description: 'Perfect for business and travel in Europe' },
];

const LEVELS = [
  { code: 'beginner', name: 'Beginner', emoji: '🌱', description: 'New to the language' },
  { code: 'intermediate', name: 'Intermediate', emoji: '📈', description: 'Some knowledge, ready to grow' },
  { code: 'advanced', name: 'Advanced', emoji: '🚀', description: 'Looking to perfect your skills' },
];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleLevelSelect = (levelCode: string) => {
    setSelectedLevel(levelCode);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedLanguage) {
      Alert.alert('Please select a language', 'Choose the language you want to learn.');
      return;
    }
    if (currentStep === 2 && !selectedLevel) {
      Alert.alert('Please select a level', 'Choose your current skill level.');
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    try {
      await apiClient.completeOnboarding({
        selectedLanguage,
        selectedLevel,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      // Update user context
      updateUser({
        selectedLanguage,
        selectedLevel,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        completedOnboarding: true,
      });

      Alert.alert('Welcome to LingoToday!', 'Your account is all set up. Let\'s start learning!');
    } catch (error: any) {
      Alert.alert('Setup Failed', error.message || 'Could not complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Choose Your Language</Text>
        <Text style={styles.stepSubtitle}>Which language would you like to learn?</Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.optionCard,
              selectedLanguage === language.code && styles.selectedOption
            ]}
            onPress={() => handleLanguageSelect(language.code)}
          >
            <Text style={styles.optionEmoji}>{language.emoji}</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionName}>{language.name}</Text>
              <Text style={styles.optionDescription}>{language.description}</Text>
            </View>
            {selectedLanguage === language.code && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLevelStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Choose Your Level</Text>
        <Text style={styles.stepSubtitle}>
          What's your current level in {LANGUAGES.find(l => l.code === selectedLanguage)?.name}?
        </Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level.code}
            style={[
              styles.optionCard,
              selectedLevel === level.code && styles.selectedOption
            ]}
            onPress={() => handleLevelSelect(level.code)}
          >
            <Text style={styles.optionEmoji}>{level.emoji}</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionName}>{level.name}</Text>
              <Text style={styles.optionDescription}>{level.description}</Text>
            </View>
            {selectedLevel === level.code && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>You're All Set!</Text>
        <Text style={styles.stepSubtitle}>
          Ready to start learning {LANGUAGES.find(l => l.code === selectedLanguage)?.name} at the {selectedLevel} level
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>🎯</Text>
          <Text style={styles.summaryTitle}>Your Learning Plan</Text>
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryItem}>
              📚 Language: {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
            </Text>
            <Text style={styles.summaryItem}>
              🎓 Level: {LEVELS.find(l => l.code === selectedLevel)?.name}
            </Text>
            <Text style={styles.summaryItem}>
              ⏰ Daily Practice: 10-15 minutes recommended
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's Next?</Text>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📖</Text>
            <Text style={styles.featureText}>Access structured lessons</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>⭐</Text>
            <Text style={styles.featureText}>Take checkpoint reviews</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🔔</Text>
            <Text style={styles.featureText}>Get learning reminders</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📊</Text>
            <Text style={styles.featureText}>Track your progress</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                currentStep >= step && styles.progressStepActive
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 3</Text>
      </View>

      {/* Content */}
      {currentStep === 1 && renderLanguageStep()}
      {currentStep === 2 && renderLevelStep()}
      {currentStep === 3 && renderWelcomeStep()}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevStep}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            (currentStep === 1 && !selectedLanguage) || 
            (currentStep === 2 && !selectedLevel) ? styles.disabledButton : {},
          ]}
          onPress={handleNextStep}
          disabled={isLoading || 
            (currentStep === 1 && !selectedLanguage) || 
            (currentStep === 2 && !selectedLevel)
          }
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Start Learning' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f7ff',
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  selectedIndicator: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  summaryContainer: {
    flex: 1,
    gap: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryDetails: {
    gap: 8,
    alignItems: 'center',
  },
  summaryItem: {
    fontSize: 16,
    color: '#374151',
  },
  featuresContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
});