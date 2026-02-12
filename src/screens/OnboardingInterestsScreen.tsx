import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const interestOptions = [
  { value: 'podcasts', label: 'Podcasts', emoji: '🎧' },
  { value: 'cooking', label: 'Cooking', emoji: '🍳' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'travelling', label: 'Travelling', emoji: '✈️' },
  { value: 'art', label: 'Art', emoji: '🎨' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'cinema', label: 'Cinema', emoji: '🎬' },
  { value: 'dancing', label: 'Dancing', emoji: '💃' },
  { value: 'history', label: 'History', emoji: '🏛️' },
  { value: 'social_media', label: 'Social media', emoji: '📱' },
  { value: 'gardening', label: 'Gardening', emoji: '🌱' },
  { value: 'photography', label: 'Photography', emoji: '📸' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'politics', label: 'Politics', emoji: '🗳️' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
];

const OnboardingInterestsScreen = ({ selectedInterests, onToggle }: {
  selectedInterests: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What are your personal interests?
    </Text>
    <Text style={styles.screenSubtitle}>
      Select topics to discuss with your tutor
    </Text>

    <View style={styles.interestsGrid}>
      {interestOptions.map((option) => {
        const isSelected = selectedInterests.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.interestCard,
              isSelected && styles.interestCardSelected,
            ]}
            testID={`button-interest-${option.value}`}
          >
            <Text style={styles.interestEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.interestLabel,
              isSelected && styles.interestLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.interestCheckIcon}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default OnboardingInterestsScreen;
