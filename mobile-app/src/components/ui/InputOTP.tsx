import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

export interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  placeholder?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  autoFocus?: boolean;
}

export const InputOTP: React.FC<InputOTPProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  placeholder = '○',
  style,
  inputStyle,
  autoFocus = false,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChangeText = (text: string) => {
    // Only allow numbers and limit to specified length
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleanText);
  };

  const renderDigit = (index: number) => {
    const digit = value[index] || '';
    const isFocused = focusedIndex === index;
    const isEmpty = !digit;

    return (
      <View
        key={index}
        style={[
          styles.digitContainer,
          isFocused && styles.digitContainerFocused,
          isEmpty && styles.digitContainerEmpty,
          disabled && styles.digitContainerDisabled,
        ]}
      >
        <Text
          style={[
            styles.digitText,
            isEmpty && styles.digitTextEmpty,
            disabled && styles.digitTextDisabled,
            inputStyle,
          ]}
        >
          {digit || (isEmpty ? placeholder : '')}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.digitsContainer}>
        {Array.from({ length }, (_, index) => renderDigit(index))}
      </View>
      
      {/* Hidden input for handling actual text input */}
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        onFocus={() => setFocusedIndex(value.length < length ? value.length : length - 1)}
        onBlur={() => setFocusedIndex(null)}
        // Make input invisible but still focusable
        caretHidden
      />
    </View>
  );
};

export interface InputOTPGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const InputOTPGroup: React.FC<InputOTPGroupProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.group, style]}>
      {children}
    </View>
  );
};

export interface InputOTPSlotProps {
  index: number;
  value: string;
  isActive?: boolean;
  style?: ViewStyle;
}

export const InputOTPSlot: React.FC<InputOTPSlotProps> = ({
  index,
  value,
  isActive = false,
  style,
}) => {
  const digit = value[index] || '';
  
  return (
    <View
      style={[
        styles.slot,
        isActive && styles.slotActive,
        style,
      ]}
    >
      <Text style={styles.slotText}>
        {digit || '○'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  digitsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  digitContainer: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  digitContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  digitContainerEmpty: {
    borderColor: theme.colors.input,
  },
  digitContainerDisabled: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    opacity: 0.5,
  },
  digitText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  digitTextEmpty: {
    color: theme.colors.mutedForeground,
  },
  digitTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 1,
    textAlign: 'center',
  },

  // Group and Slot styles
  group: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  slot: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  slotActive: {
    borderColor: theme.colors.primary,
  },
  slotText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
});