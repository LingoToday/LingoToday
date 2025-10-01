import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface NavigationMenuProps {
  children: React.ReactNode;
  style?: any;
}

export interface NavigationMenuListProps {
  children: React.ReactNode;
  style?: any;
}

export interface NavigationMenuItemProps {
  children: React.ReactNode;
  style?: any;
}

export interface NavigationMenuTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export interface NavigationMenuContentProps {
  children: React.ReactNode;
  visible?: boolean;
  onClose?: () => void;
  style?: any;
}

export interface NavigationMenuLinkProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  style?: any;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.navigationMenu, style]}>
      {children}
    </View>
  );
};

export const NavigationMenuList: React.FC<NavigationMenuListProps> = ({
  children,
  style,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.navigationMenuList, style]}
      contentContainerStyle={styles.navigationMenuListContent}
    >
      {children}
    </ScrollView>
  );
};

export const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({
  children,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  // Clone children to pass down menu state
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === NavigationMenuTrigger) {
        return React.cloneElement(child as any, { onPress: openMenu });
      }
      if (child.type === NavigationMenuContent) {
        return React.cloneElement(child as any, { visible: isOpen, onClose: closeMenu });
      }
    }
    return child;
  });

  return (
    <View style={[styles.navigationMenuItem, style]}>
      {childrenWithProps}
    </View>
  );
};

export const NavigationMenuTrigger: React.FC<NavigationMenuTriggerProps> = ({
  children,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.navigationMenuTrigger, style]} onPress={onPress}>
      <View style={styles.navigationMenuTriggerContent}>
        {children}
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.mutedForeground}
          style={styles.triggerIcon}
        />
      </View>
    </TouchableOpacity>
  );
};

export const NavigationMenuContent: React.FC<NavigationMenuContentProps> = ({
  children,
  visible = false,
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
          <View style={[styles.navigationMenuContent, style]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

export const NavigationMenuLink: React.FC<NavigationMenuLinkProps> = ({
  children,
  onPress,
  active = false,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.navigationMenuLink,
        active && styles.navigationMenuLinkActive,
        disabled && styles.navigationMenuLinkDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.navigationMenuLinkText,
          active && styles.navigationMenuLinkTextActive,
          disabled && styles.navigationMenuLinkTextDisabled,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Simple horizontal navigation for mobile
export interface SimpleNavigationProps {
  items: Array<{
    label: string;
    onPress: () => void;
    active?: boolean;
    icon?: string;
  }>;
  style?: any;
}

export const SimpleNavigation: React.FC<SimpleNavigationProps> = ({
  items,
  style,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.simpleNavigation, style]}
      contentContainerStyle={styles.simpleNavigationContent}
    >
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.simpleNavigationItem,
            item.active && styles.simpleNavigationItemActive,
          ]}
          onPress={item.onPress}
        >
          {item.icon && (
            <Ionicons
              name={item.icon as any}
              size={20}
              color={item.active ? theme.colors.primary : theme.colors.mutedForeground}
              style={styles.simpleNavigationIcon}
            />
          )}
          <Text
            style={[
              styles.simpleNavigationText,
              item.active && styles.simpleNavigationTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  navigationMenu: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navigationMenuList: {
    flexGrow: 0,
  },
  navigationMenuListContent: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  navigationMenuItem: {
    position: 'relative',
  },
  navigationMenuTrigger: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  navigationMenuTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerIcon: {
    marginLeft: theme.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100, // Account for navigation height
  },
  modalContainer: {
    flex: 1,
  },
  navigationMenuContent: {
    backgroundColor: theme.colors.popover,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 400,
    ...theme.shadows.lg,
  },
  navigationMenuLink: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navigationMenuLinkActive: {
    backgroundColor: theme.colors.accent,
  },
  navigationMenuLinkDisabled: {
    opacity: 0.5,
  },
  navigationMenuLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  navigationMenuLinkTextActive: {
    color: theme.colors.primary,
    fontWeight: '500' as any,
  },
  navigationMenuLinkTextDisabled: {
    color: theme.colors.mutedForeground,
  },

  // Simple navigation styles
  simpleNavigation: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  simpleNavigationContent: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  simpleNavigationItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minWidth: 80,
  },
  simpleNavigationItemActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  simpleNavigationIcon: {
    marginBottom: theme.spacing.xs,
  },
  simpleNavigationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  simpleNavigationTextActive: {
    color: theme.colors.primary,
    fontWeight: '500' as any,
  },
});