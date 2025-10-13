import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../lib/theme';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
  checkboxStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  style,
  checkboxStyle,
  labelStyle,
}: CheckboxProps) {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkedCheckbox,
          disabled && styles.disabledCheckbox,
          checkboxStyle,
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={16}
            color={disabled ? theme.colors.mutedForeground : theme.colors.primaryForeground}
          />
        )}
      </View>
      
      {label && (
        <Text
          style={[
            styles.label,
            disabled && styles.disabledLabel,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabledCheckbox: {
    borderColor: theme.colors.mutedForeground,
    backgroundColor: theme.colors.muted,
    opacity: 0.5,
  },
  label: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  disabledLabel: {
    color: theme.colors.mutedForeground,
    opacity: 0.5,
  },
});