import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../lib/theme';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  style?: ViewStyle;
}

export function Toast({
  title,
  description,
  variant = 'default',
  visible,
  onDismiss,
  duration = 4000,
  style,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'destructive':
        return {
          backgroundColor: theme.colors.destructive,
          borderColor: theme.colors.destructive,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success500,
          borderColor: theme.colors.success500,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning500,
          borderColor: theme.colors.warning500,
        };
      default:
        return {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'destructive':
      case 'success':
      case 'warning':
        return theme.colors.primaryForeground;
      default:
        return theme.colors.foreground;
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return 'close-circle';
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getVariantStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIcon()}
          size={24}
          color={getTextColor()}
        />
      </View>
      
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: getTextColor() }]}>
            {title}
          </Text>
        )}
        {description && (
          <Text style={[styles.description, { color: getTextColor() }]}>
            {description}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleDismiss}
      >
        <Ionicons
          name="close"
          size={20}
          color={getTextColor()}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.md,
    right: theme.spacing.md,
    maxWidth: width - (theme.spacing.md * 2),
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadows.lg,
    zIndex: 1000,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
});