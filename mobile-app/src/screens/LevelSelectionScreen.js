import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

const levels = [
  {
    code: 'beginner',
    name: 'Beginner',
    emoji: '🌱',
    description: 'Start from the basics',
    details: 'Perfect for complete beginners or those who want to refresh fundamentals',
    available: true,
  },
  {
    code: 'intermediate',
    name: 'Intermediate',
    emoji: '📚',
    description: 'Build on existing knowledge',
    details: 'For learners with some basic vocabulary and grammar understanding',
    available: false,
  },
  {
    code: 'advanced',
    name: 'Advanced',
    emoji: '🎓',
    description: 'Perfect your skills',
    details: 'For confident speakers looking to achieve fluency',
    available: false,
  },
];

export default function LevelSelectionScreen({ 
  language, 
  onLevelSelect, 
  onBack 
}) {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLevelPress = (levelCode) => {
    const level = levels.find(l => l.code === levelCode);
    
    if (!level.available) {
      setSelectedLevel(levelCode);
      setShowWaitlist(true);
      return;
    }
    
    setSelectedLevel(levelCode);
    setShowWaitlist(false);
  };

  const handleContinue = () => {
    if (!selectedLevel) {
      Alert.alert('Please Select', 'Choose your current level to continue');
      return;
    }

    const selectedLevelData = levels.find(l => l.code === selectedLevel);
    if (!selectedLevelData.available) {
      Alert.alert('Coming Soon', 'This level is not available yet. Please join our waitlist!');
      return;
    }

    onLevelSelect(selectedLevel);
  };

  const handleWaitlistSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Thank You!',
        `We'll notify you when ${selectedLevel} level becomes available for ${language}!`,
        [{ text: 'OK', onPress: () => setShowWaitlist(false) }]
      );
      setEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageName = (code) => {
    const languageNames = {
      'it': 'Italian',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German'
    };
    return languageNames[code] || code;
  };

  if (showWaitlist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowWaitlist(false)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Join Waitlist</Text>
          <Text style={styles.subtitle}>
            {levels.find(l => l.code === selectedLevel)?.name} {getLanguageName(language)} is coming soon!
          </Text>
        </View>

        <View style={styles.waitlistContent}>
          <View style={styles.waitlistCard}>
            <Text style={styles.waitlistEmoji}>⏰</Text>
            <Text style={styles.waitlistTitle}>We're working on it!</Text>
            <Text style={styles.waitlistText}>
              {levels.find(l => l.code === selectedLevel)?.name} level content is currently in development. 
              Enter your email below and we'll notify you as soon as it's ready.
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleWaitlistSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.alternativeText}>
            In the meantime, you can start with Beginner level to build a strong foundation!
          </Text>
          
          <TouchableOpacity
            style={styles.beginnerButton}
            onPress={() => {
              setSelectedLevel('beginner');
              setShowWaitlist(false);
            }}
          >
            <Text style={styles.beginnerButtonText}>Start with Beginner</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Level</Text>
        <Text style={styles.subtitle}>What's your current {getLanguageName(language)} level?</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.levelGrid}>
          {levels.map((level) => (
            <TouchableOpacity
              key={level.code}
              style={[
                styles.levelCard,
                selectedLevel === level.code && styles.selectedCard,
                !level.available && styles.unavailableCard
              ]}
              onPress={() => handleLevelPress(level.code)}
            >
              <Text style={styles.levelEmoji}>{level.emoji}</Text>
              <Text style={[
                styles.levelName,
                !level.available && styles.unavailableText
              ]}>
                {level.name}
              </Text>
              <Text style={[
                styles.levelDescription,
                !level.available && styles.unavailableText
              ]}>
                {level.description}
              </Text>
              <Text style={styles.levelDetails}>{level.details}</Text>
              
              {selectedLevel === level.code && level.available && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
              
              {!level.available && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedLevel && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedLevel}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedLevel && styles.disabledButtonText
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  levelGrid: {
    paddingVertical: 24,
    gap: 16,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  unavailableCard: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  levelEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  levelName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 8,
  },
  levelDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 8,
  },
  levelDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
  },
  unavailableText: {
    color: '#9ca3af',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  waitlistContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  waitlistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  waitlistEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  waitlistTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  waitlistText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  beginnerButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  beginnerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});