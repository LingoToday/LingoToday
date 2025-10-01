import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface ToastType {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: React.ReactNode;
  onClose?: () => void;
}

import { theme } from '../../lib/theme';

export interface ToasterProps {
  toasts: Array<ToastType & { id: string }>;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: ViewStyle;
}

export const Toaster: React.FC<ToasterProps> = ({
  toasts,
  position = 'bottom',
  style,
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { top: 60, left: 0, right: 0, alignItems: 'center' as const };
      case 'bottom':
        return { bottom: 60, left: 0, right: 0, alignItems: 'center' as const };
      case 'top-left':
        return { top: 60, left: 20, alignItems: 'flex-start' as const };
      case 'top-right':
        return { top: 60, right: 20, alignItems: 'flex-end' as const };
      case 'bottom-left':
        return { bottom: 60, left: 20, alignItems: 'flex-start' as const };
      case 'bottom-right':
        return { bottom: 60, right: 20, alignItems: 'flex-end' as const };
      default:
        return { bottom: 60, left: 0, right: 0, alignItems: 'center' as const };
    }
  };

  return (
    <View style={[styles.container, getPositionStyles(), style]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

interface ToastItemProps {
  toast: ToastType & { id: string };
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, opacity, translateY]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      toast.onClose?.();
    });
  };

  const getToastStyle = () => {
    switch (toast.variant) {
      case 'destructive':
        return styles.toastDestructive;
      case 'success':
        return styles.toastSuccess;
      case 'warning':
        return styles.toastWarning;
      default:
        return styles.toastDefault;
    }
  };

  const getTextColor = () => {
    switch (toast.variant) {
      case 'destructive':
        return styles.textDestructive;
      case 'success':
        return styles.textSuccess;
      case 'warning':
        return styles.textWarning;
      default:
        return styles.textDefault;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        getToastStyle(),
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {toast.title && (
        <Text style={[styles.toastTitle, getTextColor()]}>
          {toast.title}
        </Text>
      )}
      {toast.description && (
        <Text style={[styles.toastDescription, getTextColor()]}>
          {toast.description}
        </Text>
      )}
      {toast.action && (
        <View style={styles.toastAction}>
          {toast.action}
        </View>
      )}
    </Animated.View>
  );
};

// Toast manager for global state
class ToastManager {
  private toasts: Array<ToastType & { id: string }> = [];
  private listeners: Array<(toasts: Array<ToastType & { id: string }>) => void> = [];

  show(toast: Omit<ToastType, 'onClose'>) {
    const id = Date.now().toString();
    const newToast = {
      ...toast,
      id,
      onClose: () => this.dismiss(id),
    };

    this.toasts.push(newToast);
    this.notifyListeners();

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  dismissAll() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: Array<ToastType & { id: string }>) => void) {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

export const toastManager = new ToastManager();

// Hook to use toasts
export const useToasts = () => {
  const [toasts, setToasts] = React.useState<Array<ToastType & { id: string }>>([]);

  React.useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return {
    toasts,
    show: toastManager.show.bind(toastManager),
    dismiss: toastManager.dismiss.bind(toastManager),
    dismissAll: toastManager.dismissAll.bind(toastManager),
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    gap: theme.spacing.sm,
  },
  toast: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    minWidth: 300,
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  toastDefault: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  toastDestructive: {
    backgroundColor: theme.colors.destructive + '10',
    borderColor: theme.colors.destructive,
  },
  toastSuccess: {
    backgroundColor: theme.colors.success500 + '10',
    borderColor: theme.colors.success500,
  },
  toastWarning: {
    backgroundColor: theme.colors.warning500 + '10',
    borderColor: theme.colors.warning500,
  },
  toastTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    marginBottom: theme.spacing.xs,
  },
  toastDescription: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.fontSize.sm * 1.4,
  },
  toastAction: {
    marginTop: theme.spacing.md,
    alignItems: 'flex-end',
  },
  textDefault: {
    color: theme.colors.foreground,
  },
  textDestructive: {
    color: theme.colors.destructive,
  },
  textSuccess: {
    color: theme.colors.success600,
  },
  textWarning: {
    color: theme.colors.warning600,
  },
});