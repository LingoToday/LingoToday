import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  // Helper function to render icon
  const renderIcon = (icon: React.ReactNode | string | undefined) => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      // If it's a string, render as Ionicons
      return (
        <Ionicons
          name={icon as any}
          size={20}
          color={theme.colors.mutedForeground}
        />
      );
    }

    // Otherwise render as React component
    return icon;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, style]}>
        {leftIcon && <View style={styles.leftIcon}>{renderIcon(leftIcon)}</View>}
        <TextInput
          style={[
            styles.input,
            !!leftIcon && styles.inputWithLeftIcon,
            !!rightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={theme.colors.mutedForeground}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{renderIcon(rightIcon)}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.destructive,
  },
  leftIcon: {
    marginLeft: theme.spacing.md,
  },
  rightIcon: {
    marginRight: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },
});