import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const methodOptions = [
  { value: 'school', label: 'School' },
  { value: 'language_school', label: 'Language school' },
  { value: 'college_university', label: 'College / University' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'self_education', label: 'Self education' },
  { value: 'abroad', label: 'Abroad' },
  { value: 'never_learned', label: 'Never learned' },
];

const OnboardingMethodsScreen = ({ selectedMethods, onToggle }: {
  selectedMethods: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What methods did you use to learn?
    </Text>

    <View style={styles.levelsList}>
      {methodOptions.map((option) => {
        const isSelected = selectedMethods.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.levelCard,
              isSelected && styles.multiSelectCardSelected,
            ]}
            testID={`button-method-${option.value}`}
          >
            <Text style={[
              styles.levelTitle,
              isSelected && styles.levelTitleSelected,
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

export default OnboardingMethodsScreen;
