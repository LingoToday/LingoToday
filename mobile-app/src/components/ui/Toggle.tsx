import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

type ToggleVariant = 'default' | 'outline';
type ToggleSize = 'default' | 'sm' | 'lg';

interface ToggleProps {
  children?: React.ReactNode;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Toggle({
  children,
  pressed: controlledPressed,
  onPressedChange,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
  textStyle,
}: ToggleProps) {
  const [internalPressed, setInternalPressed] = useState(false);
  
  const isControlled = controlledPressed !== undefined;
  const isPressed = isControlled ? controlledPressed : internalPressed;

  const handlePress = () => {
    if (disabled) return;
    
    const newPressed = !isPressed;
    
    if (!isControlled) {
      setInternalPressed(newPressed);
    }
    
    onPressedChange?.(newPressed);
  };

  const getToggleStyles = () => {
    return [
      styles.toggle,
      size === 'sm' && styles.toggleSm,
      size === 'lg' && styles.toggleLg,
      size === 'default' && styles.toggleDefault,
      variant === 'outline' && styles.toggleOutline,
      variant === 'outline' && isPressed && styles.toggleOutlinePressed,
      variant === 'default' && styles.toggleDefaultVariant,
      variant === 'default' && isPressed && styles.toggleDefaultPressed,
      disabled && styles.toggleDisabled,
    ].filter(Boolean);
  };

  const getTextStyles = () => {
    return [
      styles.text,
      size === 'sm' && styles.textSm,
      size === 'lg' && styles.textLg,
      size === 'default' && styles.textDefault,
      isPressed && variant === 'outline' && styles.textOutlinePressed,
      isPressed && variant === 'default' && styles.textDefaultPressed,
      !isPressed && styles.textNormal,
      disabled && styles.textDisabled,
    ].filter(Boolean);
  };

  return (
    <TouchableOpacity
      style={[getToggleStyles(), style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isPressed }}
    >
      {typeof children === 'string' ? (
        <Text style={[getTextStyles(), textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },

  // Sizes
  toggleDefault: {
    height: 40,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 40,
  },
  toggleSm: {
    height: 36,
    paddingHorizontal: theme.spacing.xs,
    minWidth: 36,
  },
  toggleLg: {
    height: 44,
    paddingHorizontal: theme.spacing.md,
    minWidth: 44,
  },

  // Variants
  toggleDefaultVariant: {
    backgroundColor: 'transparent',
  },
  toggleDefaultPressed: {
    backgroundColor: theme.colors.accent,
  },
  toggleOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.input,
  },
  toggleOutlinePressed: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  // Disabled state
  toggleDisabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
  },
  textDefault: {
    fontSize: theme.fontSize.sm,
  },
  textSm: {
    fontSize: theme.fontSize.xs,
  },
  textLg: {
    fontSize: theme.fontSize.base,
  },
  textNormal: {
    color: theme.colors.foreground,
  },
  textDefaultPressed: {
    color: theme.colors.accentForeground,
  },
  textOutlinePressed: {
    color: theme.colors.accentForeground,
  },
  textDisabled: {
    opacity: 0.5,
  },
});