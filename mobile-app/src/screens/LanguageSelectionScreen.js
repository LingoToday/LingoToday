import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const languages = [
  { code: 'it', name: 'Italian', emoji: '🇮🇹', available: true },
  { code: 'es', name: 'Spanish', emoji: '🇪🇸', available: true },
  { code: 'fr', name: 'French', emoji: '🇫🇷', available: true },
  { code: 'de', name: 'German', emoji: '🇩🇪', available: true },
];

export default function LanguageSelectionScreen({ onLanguageSelect, onBack }) {
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const handleLanguagePress = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = () => {
    if (!selectedLanguage) {
      Alert.alert('Please Select', 'Choose a language to continue');
      return;
    }
    onLanguageSelect(selectedLanguage);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>Which language would you like to learn?</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.languageGrid}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                selectedLanguage === language.code && styles.selectedCard
              ]}
              onPress={() => handleLanguagePress(language.code)}
              disabled={!language.available}
            >
              <Text style={styles.languageEmoji}>{language.emoji}</Text>
              <Text style={[
                styles.languageName,
                !language.available && styles.unavailableText
              ]}>
                {language.name}
              </Text>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
              {!language.available && (
                <Text style={styles.comingSoon}>Coming Soon</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🎯 What you'll learn:</Text>
          <Text style={styles.infoText}>• Essential vocabulary and phrases</Text>
          <Text style={styles.infoText}>• Basic grammar and sentence structure</Text>
          <Text style={styles.infoText}>• Real-life conversations</Text>
          <Text style={styles.infoText}>• Cultural insights and context</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedLanguage && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedLanguage}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedLanguage && styles.disabledButtonText
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
  languageGrid: {
    paddingVertical: 24,
    gap: 16,
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  languageEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
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
  comingSoon: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    paddingLeft: 8,
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
});