import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../lib/theme';

interface DropdownMenuItemProps {
  onPress: () => void;
  children: React.ReactNode;
  icon?: string;
  disabled?: boolean;
  destructive?: boolean;
}

interface DropdownMenuSeparatorProps {
  style?: ViewStyle;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function DropdownMenu({ trigger, children, open, onOpenChange }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(open || false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleTriggerPress = () => {
    handleOpenChange(!isOpen);
  };

  return (
    <>
      <TouchableOpacity onPress={handleTriggerPress}>
        {trigger}
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => handleOpenChange(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => handleOpenChange(false)}
        >
          <View style={styles.content}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    onItemPress: () => handleOpenChange(false),
                  });
                }
                return child;
              })}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function DropdownMenuContent({ children, style }: DropdownMenuContentProps) {
  return (
    <View style={[styles.menuContent, style]}>
      {children}
    </View>
  );
}

export function DropdownMenuItem({ 
  onPress, 
  children, 
  icon, 
  disabled = false,
  destructive = false,
  ...props 
}: DropdownMenuItemProps & any) {
  const handlePress = () => {
    if (!disabled) {
      onPress();
      props.onItemPress?.();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        disabled && styles.disabledMenuItem,
        destructive && styles.destructiveMenuItem,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={
            destructive 
              ? theme.colors.destructive 
              : disabled 
                ? theme.colors.mutedForeground 
                : theme.colors.foreground
          }
          style={styles.menuIcon}
        />
      )}
      <Text
        style={[
          styles.menuText,
          disabled && styles.disabledMenuText,
          destructive && styles.destructiveMenuText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function DropdownMenuSeparator({ style }: DropdownMenuSeparatorProps) {
  return <View style={[styles.separator, style]} />;
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginHorizontal: theme.spacing.lg,
  },
  menuContent: {
    backgroundColor: theme.colors.popover,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
    minWidth: 200,
    ...theme.shadows.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  destructiveMenuItem: {
    backgroundColor: theme.colors.destructive + '10',
  },
  menuIcon: {
    marginRight: theme.spacing.sm,
  },
  menuText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  disabledMenuText: {
    color: theme.colors.mutedForeground,
  },
  destructiveMenuText: {
    color: theme.colors.destructive,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
  },
});