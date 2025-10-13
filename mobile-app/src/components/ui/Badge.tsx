import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../lib/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const getBadgeStyle = () => {
    const baseStyle = [styles.badge, styles[size]];
    
    switch (variant) {
      case 'default':
        return [...baseStyle, styles.default];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'destructive':
        return [...baseStyle, styles.destructive];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'success':
        return [...baseStyle, styles.success];
      case 'warning':
        return [...baseStyle, styles.warning];
      default:
        return [...baseStyle, styles.default];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text];
    
    switch (variant) {
      case 'default':
        return [...baseTextStyle, styles.defaultText];
      case 'secondary':
        return [...baseTextStyle, styles.secondaryText];
      case 'destructive':
        return [...baseTextStyle, styles.destructiveText];
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      case 'success':
        return [...baseTextStyle, styles.successText];
      case 'warning':
        return [...baseTextStyle, styles.warningText];
      default:
        return [...baseTextStyle, styles.defaultText];
    }
  };

  return (
    <View style={[...getBadgeStyle(), style]}>
      <Text style={[...getTextStyle(), textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  lg: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  destructive: {
    backgroundColor: theme.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.success500,
  },
  warning: {
    backgroundColor: theme.colors.warning500,
  },
  
  // Text styles
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
  },
  defaultText: {
    color: theme.colors.primaryForeground,
  },
  secondaryText: {
    color: theme.colors.secondaryForeground,
  },
  destructiveText: {
    color: theme.colors.destructiveForeground,
  },
  outlineText: {
    color: theme.colors.foreground,
  },
  successText: {
    color: theme.colors.primaryForeground,
  },
  warningText: {
    color: theme.colors.primaryForeground,
  },
});
