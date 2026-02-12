import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const improvementOptions = [
  { value: 'speaking', label: 'Speaking', emoji: '🗣️' },
  { value: 'listening', label: 'Listening', emoji: '👂' },
  { value: 'vocabulary', label: 'Vocabulary', emoji: '📚' },
  { value: 'grammar', label: 'Grammar', emoji: '✏️' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'interesting_facts', label: 'Interesting Facts', emoji: '💡' },
  { value: 'pronunciation', label: 'Pronunciation', emoji: '🎙️' },
];

const OnboardingImprovementAreasScreen = ({ selectedAreas, onToggle }: {
  selectedAreas: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Which area would you like to improve?
    </Text>

    <View style={styles.improvementGrid}>
      {improvementOptions.map((option) => {
        const isSelected = selectedAreas.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.improvementCard,
              isSelected && styles.improvementCardSelected,
            ]}
            testID={`button-improvement-${option.value}`}
          >
            <Text style={styles.improvementEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.improvementLabel,
              isSelected && styles.improvementLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.improvementCheckIcon}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default OnboardingImprovementAreasScreen;
