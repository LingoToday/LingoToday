import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { theme } from '../../lib/theme';
import { Button } from './Button';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  style?: ViewStyle;
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => onOpenChange(false)}
      >
        <View style={styles.container}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export function AlertDialogContent({ children, style }: AlertDialogContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export function AlertDialogHeader({ children, style }: AlertDialogHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function AlertDialogTitle({ children, style }: AlertDialogTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function AlertDialogDescription({ children, style }: AlertDialogDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

export function AlertDialogFooter({ children, style }: AlertDialogFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

export function AlertDialogAction({ children, onPress, variant = 'default', style }: AlertDialogActionProps) {
  return (
    <Button
      title={typeof children === 'string' ? children : 'Action'}
      onPress={onPress}
      variant={variant === 'destructive' ? 'destructive' : 'default'}
      style={style}
    />
  );
}

export function AlertDialogCancel({ children, onPress, style }: AlertDialogCancelProps) {
  return (
    <Button
      title={typeof children === 'string' ? children : 'Cancel'}
      onPress={onPress}
      variant="outline"
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minWidth: 300,
    maxWidth: 400,
    ...theme.shadows.xl,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  action: {
    flex: 1,
  },
  cancel: {
    flex: 1,
  },
});