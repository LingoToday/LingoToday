import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../lib/theme';

export interface LabelProps {
  children: React.ReactNode;
  style?: TextStyle;
  htmlFor?: string; // For web compatibility
}

export const Label: React.FC<LabelProps> = ({ children, style }) => {
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
});