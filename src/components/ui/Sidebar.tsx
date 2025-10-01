import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface SidebarProps {
  children: React.ReactNode;
  style?: any;
  width?: number;
}

export interface SidebarHeaderProps {
  children: React.ReactNode;
  style?: any;
}

export interface SidebarContentProps {
  children: React.ReactNode;
  style?: any;
}

export interface SidebarFooterProps {
  children: React.ReactNode;
  style?: any;
}

export interface SidebarMenuProps {
  children: React.ReactNode;
  style?: any;
}

export interface SidebarMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export interface SidebarMenuButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  style,
  width = 280,
}) => {
  return (
    <SafeAreaView style={[styles.sidebar, { width }, style]}>
      {children}
    </SafeAreaView>
  );
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.sidebarHeader, style]}>
      {children}
    </View>
  );
};

export const SidebarContent: React.FC<SidebarContentProps> = ({
  children,
  style,
}) => {
  return (
    <ScrollView 
      style={[styles.sidebarContent, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
};

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.sidebarFooter, style]}>
      {children}
    </View>
  );
};

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.sidebarMenu, style]}>
      {children}
    </View>
  );
};

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  children,
  onPress,
  active = false,
  disabled = false,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.sidebarMenuItem,
        active && styles.sidebarMenuItemActive,
        disabled && styles.sidebarMenuItemDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.sidebarMenuItemContent}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={18}
            color={
              active
                ? theme.colors.primary
                : disabled
                ? theme.colors.mutedForeground
                : theme.colors.foreground
            }
            style={styles.sidebarMenuItemIcon}
          />
        )}
        <Text
          style={[
            styles.sidebarMenuItemText,
            active && styles.sidebarMenuItemTextActive,
            disabled && styles.sidebarMenuItemTextDisabled,
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const SidebarMenuButton: React.FC<SidebarMenuButtonProps> = ({
  children,
  onPress,
  active = false,
  disabled = false,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.sidebarMenuButton,
        active && styles.sidebarMenuButtonActive,
        disabled && styles.sidebarMenuButtonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.sidebarMenuButtonContent}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color={
              active
                ? theme.colors.primaryForeground
                : disabled
                ? theme.colors.mutedForeground
                : theme.colors.foreground
            }
            style={styles.sidebarMenuButtonIcon}
          />
        )}
        <Text
          style={[
            styles.sidebarMenuButtonText,
            active && styles.sidebarMenuButtonTextActive,
            disabled && styles.sidebarMenuButtonTextDisabled,
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Collapsible sidebar for mobile
export interface CollapsibleSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  style?: any;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  children,
  collapsed = false,
  onToggle,
  style,
}) => {
  return (
    <View style={[
      styles.collapsibleSidebar,
      collapsed && styles.collapsibleSidebarCollapsed,
      style,
    ]}>
      <TouchableOpacity style={styles.toggleButton} onPress={onToggle}>
        <Ionicons
          name={collapsed ? "chevron-forward" : "chevron-back"}
          size={20}
          color={theme.colors.foreground}
        />
      </TouchableOpacity>
      
      {!collapsed && (
        <View style={styles.collapsibleContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: theme.colors.card,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    flex: 1,
  },
  sidebarHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sidebarContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sidebarFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sidebarMenu: {
    gap: theme.spacing.xs,
  },
  sidebarMenuItem: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  sidebarMenuItemActive: {
    backgroundColor: theme.colors.accent,
  },
  sidebarMenuItemDisabled: {
    opacity: 0.5,
  },
  sidebarMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  sidebarMenuItemIcon: {
    marginRight: theme.spacing.sm,
  },
  sidebarMenuItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  sidebarMenuItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '500' as any,
  },
  sidebarMenuItemTextDisabled: {
    color: theme.colors.mutedForeground,
  },

  // Menu Button (more prominent)
  sidebarMenuButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.secondary,
  },
  sidebarMenuButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  sidebarMenuButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.muted,
  },
  sidebarMenuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  sidebarMenuButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  sidebarMenuButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    color: theme.colors.secondaryForeground,
  },
  sidebarMenuButtonTextActive: {
    color: theme.colors.primaryForeground,
  },
  sidebarMenuButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },

  // Collapsible Sidebar
  collapsibleSidebar: {
    backgroundColor: theme.colors.card,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    width: 280,
    position: 'relative',
  },
  collapsibleSidebarCollapsed: {
    width: 60,
  },
  toggleButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.sm,
    zIndex: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  collapsibleContent: {
    flex: 1,
    paddingTop: theme.spacing.xl + 40, // Account for toggle button
  },
});