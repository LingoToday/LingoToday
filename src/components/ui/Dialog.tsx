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
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../lib/theme';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DialogTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface DialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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

export function DialogContent({ children, style }: DialogContentProps) {
  return (
    <View style={[styles.content, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
      
      <TouchableOpacity style={styles.closeButton}>
        <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export function DialogHeader({ children, style }: DialogHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function DialogTitle({ children, style }: DialogTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function DialogDescription({ children, style }: DialogDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

export function DialogFooter({ children, style }: DialogFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
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
    maxHeight: '90%',
  },
  content: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minWidth: 300,
    maxWidth: 500,
    maxHeight: '80%',
    ...theme.shadows.xl,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: theme.spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  header: {
    marginBottom: theme.spacing.md,
    paddingRight: theme.spacing.xl, // Space for close button
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
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});