import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  style?: ViewStyle;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Alert({ children, variant = 'default', style }: AlertProps) {
  return (
    <View 
      style={[
        styles.alert,
        styles[variant],
        style
      ]}
      accessibilityRole="alert"
    >
      {children}
    </View>
  );
}

export function AlertTitle({ children, style }: AlertTitleProps) {
  return (
    <Text style={[styles.alertTitle, style]}>
      {children}
    </Text>
  );
}

export function AlertDescription({ children, style }: AlertDescriptionProps) {
  return (
    <Text style={[styles.alertDescription, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  alert: {
    position: 'relative',
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  destructive: {
    backgroundColor: theme.colors.destructive + '10',
    borderColor: theme.colors.destructive,
  },
  warning: {
    backgroundColor: theme.colors.warning50,
    borderColor: theme.colors.warning500,
  },
  success: {
    backgroundColor: theme.colors.success50,
    borderColor: theme.colors.success500,
  },

  alertTitle: {
    marginBottom: theme.spacing.xs,
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    lineHeight: theme.fontSize.base * 1.2,
  },

  alertDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: theme.fontSize.sm * 1.4,
  },
});