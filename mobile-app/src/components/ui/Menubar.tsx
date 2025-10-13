import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface MenubarProps {
  children: React.ReactNode;
  style?: any;
}

export interface MenubarMenuProps {
  children: React.ReactNode;
  style?: any;
}

export interface MenubarTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export interface MenubarContentProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  style?: any;
}

export interface MenubarItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: string;
  style?: any;
}

export interface MenubarSeparatorProps {
  style?: any;
}

export const Menubar: React.FC<MenubarProps> = ({ children, style }) => {
  return (
    <View style={[styles.menubar, style]}>
      {children}
    </View>
  );
};

export const MenubarMenu: React.FC<MenubarMenuProps> = ({ children, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  // Clone children to pass down menu state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === MenubarTrigger) {
        return React.cloneElement(child as any, { onPress: openMenu });
      }
      if (child.type === MenubarContent) {
        return React.cloneElement(child as any, { visible: isOpen, onClose: closeMenu });
      }
    }
    return child;
  });

  return (
    <View style={[styles.menubarMenu, style]}>
      {childrenWithProps}
    </View>
  );
};

export const MenubarTrigger: React.FC<MenubarTriggerProps> = ({
  children,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.menubarTrigger, style]} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
};

export const MenubarContent: React.FC<MenubarContentProps> = ({
  children,
  visible,
  onClose,
  style,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.menubarContent, style]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

export const MenubarItem: React.FC<MenubarItemProps> = ({
  children,
  onPress,
  disabled = false,
  destructive = false,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.menubarItem,
        disabled && styles.menubarItemDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.menubarItemContent}>
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
            style={styles.menubarItemIcon}
          />
        )}
        <Text
          style={[
            styles.menubarItemText,
            destructive && styles.menubarItemTextDestructive,
            disabled && styles.menubarItemTextDisabled,
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const MenubarSeparator: React.FC<MenubarSeparatorProps> = ({ style }) => {
  return <View style={[styles.menubarSeparator, style]} />;
};

const styles = StyleSheet.create({
  menubar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  menubarMenu: {
    position: 'relative',
  },
  menubarTrigger: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60, // Account for menubar height
  },
  modalContainer: {
    flex: 1,
  },
  menubarContent: {
    backgroundColor: theme.colors.popover,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 400,
    ...theme.shadows.lg,
  },
  menubarItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menubarItemDisabled: {
    opacity: 0.5,
  },
  menubarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  menubarItemIcon: {
    marginRight: theme.spacing.sm,
  },
  menubarItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  menubarItemTextDestructive: {
    color: theme.colors.destructive,
  },
  menubarItemTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  menubarSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
});