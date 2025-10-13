import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { theme } from '../../lib/theme';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      paddingVertical: size === 'sm' ? theme.spacing.sm : size === 'lg' ? theme.spacing.lg : theme.spacing.md,
      paddingHorizontal: size === 'sm' ? theme.spacing.md : size === 'lg' ? theme.spacing.xl : theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: size === 'sm' ? 36 : size === 'lg' ? 56 : 44,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.destructive,
          borderWidth: 0,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: theme.fontSize.base,
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseTextStyle,
          color: theme.colors.foreground,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: theme.colors.primary,
        };
      case 'destructive':
        return {
          ...baseTextStyle,
          color: theme.colors.destructiveForeground || '#ffffff',
        };
      default:
        return {
          ...baseTextStyle,
          color: theme.colors.primaryForeground || '#ffffff',
        };
    }
  };

  const buttonStyle = [
    getButtonStyle(),
    disabled && styles.disabled,
    style,
  ];

  const finalTextStyle = [
    getTextStyle(),
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#ffffff'}
          style={styles.loader}
        />
      )}
      {title ? (
        <Text style={finalTextStyle}>{title}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
  loader: {
    marginRight: theme.spacing.sm,
  },
});
