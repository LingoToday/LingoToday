import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  style?: ViewStyle;
  trackColor?: string;
  progressColor?: string;
  height?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  style,
  trackColor = theme.colors.secondary,
  progressColor = theme.colors.primary,
  height = 8,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }, style]}>
      <View 
        style={[
          styles.progress, 
          { 
            backgroundColor: progressColor, 
            width: `${percentage}%`,
            height,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    backgroundColor: theme.colors.secondary,
  },
  progress: {
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
});
