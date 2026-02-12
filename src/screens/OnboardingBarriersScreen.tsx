import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const barrierOptions = [
  { value: 'cost', label: "The cost was prohibitive, and I wasn't willing to invest that much" },
  { value: 'speaking_practice', label: 'I needed more speaking practice to overcome my language barrier' },
  { value: 'time', label: "I found it hard to find the time and couldn't keep going" },
  { value: 'uncomfortable', label: 'I felt uncomfortable practicing my speaking skills in front of others' },
  { value: 'no_tailored_program', label: "There wasn't a tailored program that suited my needs" },
  { value: 'scheduling', label: "My availability didn't align with my instructor's" },
  { value: 'enhance_skills', label: "I've made some strides but I'm eager to enhance my skills even more" },
];

const OnboardingBarriersScreen = ({ selectedBarriers, onToggle }: {
  selectedBarriers: string[];
  onToggle: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      What do you think of your past experience?
    </Text>

    <View style={styles.levelsList}>
      {barrierOptions.map((option) => {
        const isSelected = selectedBarriers.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[
              styles.barrierCard,
              isSelected && styles.barrierCardSelected,
            ]}
            testID={`button-barrier-${option.value}`}
          >
            <Text style={[
              styles.barrierLabel,
              isSelected && styles.barrierLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.barrierCheckIcon}>
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default OnboardingBarriersScreen;
