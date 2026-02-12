import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const eventOptions = [
  { value: 'new_job', label: 'Starting a new job', emoji: '💼' },
  { value: 'moving_country', label: 'Moving to a different country', emoji: '🌍' },
  { value: 'job_interview', label: 'Attending a job interview', emoji: '🤝' },
  { value: 'exams', label: 'Exams ahead', emoji: '📝' },
  { value: 'travel_abroad', label: 'Travel abroad', emoji: '✈️' },
  { value: 'no_events', label: 'No events upcoming', emoji: '😊' },
];

const OnboardingEventsScreen = ({ selectedEvent, onEventSelect }: {
  selectedEvent: string;
  onEventSelect: (value: string) => void;
}) => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>
      Are there any important events happening soon to get prepared for?
    </Text>
    <Text style={styles.screenSubtitle}>
      Help us understand your plans
    </Text>

    <View style={{ width: '100%' }}>
      {eventOptions.map((option) => {
        const isSelected = selectedEvent === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onEventSelect(option.value)}
            style={[
              styles.eventCard,
              isSelected && styles.eventCardSelected,
            ]}
            testID={`button-event-${option.value}`}
          >
            <Text style={styles.eventEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.eventLabel,
              isSelected && styles.eventLabelSelected,
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.eventCheckIcon}>
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default OnboardingEventsScreen;
