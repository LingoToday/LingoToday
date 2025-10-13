import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

interface CommandItem {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

interface CommandProps {
  children?: React.ReactNode;
  className?: string;
}

interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface CommandListProps {
  children?: React.ReactNode;
}

interface CommandEmptyProps {
  children?: React.ReactNode;
}

interface CommandGroupProps {
  heading?: string;
  children?: React.ReactNode;
}

interface CommandItemProps {
  children?: React.ReactNode;
  value?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

interface CommandSeparatorProps {
  className?: string;
}

// Main Command component
export function Command({ children }: CommandProps) {
  return (
    <View style={styles.command}>
      {children}
    </View>
  );
}

// Command Dialog (Modal version)
export function CommandDialog({ 
  open = false, 
  onOpenChange, 
  children 
}: CommandDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange?.(false)}
    >
      <View style={styles.dialogOverlay}>
        <SafeAreaView style={styles.dialogContainer}>
          <View style={styles.dialog}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => onOpenChange?.(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
            {children}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Command Input
export function CommandInput({ 
  placeholder = 'Type a command or search...', 
  value, 
  onValueChange 
}: CommandInputProps) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons 
        name="search" 
        size={18} 
        color={theme.colors.mutedForeground} 
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        value={value}
        onChangeText={onValueChange}
        autoFocus
        returnKeyType="search"
      />
    </View>
  );
}

// Command List
export function CommandList({ children }: CommandListProps) {
  return (
    <View style={styles.list}>
      {children}
    </View>
  );
}

// Command Empty
export function CommandEmpty({ children }: CommandEmptyProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {children || 'No results found.'}
      </Text>
    </View>
  );
}

// Command Group
export function CommandGroup({ heading, children }: CommandGroupProps) {
  return (
    <View style={styles.group}>
      {heading && (
        <Text style={styles.groupHeading}>{heading}</Text>
      )}
      {children}
    </View>
  );
}

// Command Item
export function CommandItem({ 
  children, 
  value, 
  onSelect, 
  disabled = false 
}: CommandItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.itemDisabled]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

// Command Separator
export function CommandSeparator(props: CommandSeparatorProps) {
  return <View style={styles.separator} />;
}

// Shortcut component for displaying keyboard shortcuts
interface CommandShortcutProps {
  children: React.ReactNode;
}

export function CommandShortcut({ children }: CommandShortcutProps) {
  return (
    <Text style={styles.shortcut}>
      {children}
    </Text>
  );
}

// Hook for building command palettes with search functionality
export function useCommand(items: CommandItem[], searchValue: string = '') {
  const filteredItems = items.filter(item => {
    if (!searchValue) return true;
    return item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
           item.value.toLowerCase().includes(searchValue.toLowerCase());
  });

  return {
    filteredItems,
    isEmpty: filteredItems.length === 0,
  };
}

const styles = StyleSheet.create({
  command: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },

  // Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  dialog: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    padding: theme.spacing.xs,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    padding: 0,
  },

  // List
  list: {
    flex: 1,
    maxHeight: 300,
  },

  // Empty
  empty: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Group
  group: {
    paddingVertical: theme.spacing.xs,
  },
  groupHeading: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600' as any,
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
    gap: theme.spacing.sm,
  },
  itemDisabled: {
    opacity: 0.5,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },

  // Shortcut
  shortcut: {
    marginLeft: 'auto',
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    letterSpacing: 0.5,
  },
});