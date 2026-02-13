import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const challengeOptions = [
  { value: 'true', label: 'True' },
  { value: 'partially_true', label: 'Partially true' },
  { value: 'not_true', label: "That's not true for me" },
];

const OnboardingChallengeScreen = ({ statement, selectedAnswer, onAnswerSelect }: {
  statement: string;
  selectedAnswer: string;
  onAnswerSelect: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.challengeStatement}>
      "{statement}"
    </Text>
    <Text style={styles.challengeSubheader}>
      Is this statement true for you?
    </Text>

    <View style={styles.levelsList}>
      {challengeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onAnswerSelect(option.value)}
          style={[
            styles.levelCard,
            selectedAnswer === option.value && styles.levelCardSelected,
          ]}
          testID={`button-challenge-${option.value}`}
        >
          <Text style={[
            styles.levelTitle,
            selectedAnswer === option.value && styles.levelTitleSelected,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default OnboardingChallengeScreen;
