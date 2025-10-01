import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  style?: ViewStyle;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  style?: ViewStyle;
}

export interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  style?: ViewStyle;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: '', onValueChange: () => {} });

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  style,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <View style={[styles.tabs, style]}>
        {children}
      </View>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, style }) => {
  return (
    <View style={[styles.tabsList, style]}>
      {children}
    </View>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, style }) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <TouchableOpacity
      style={[styles.tabsTrigger, isActive && styles.tabsTriggerActive, style]}
      onPress={() => onValueChange(value)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabsTriggerText, isActive && styles.tabsTriggerTextActive]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ children, value, style }) => {
  const { value: currentValue } = React.useContext(TabsContext);
  
  if (currentValue !== value) {
    return null;
  }

  return (
    <View style={[styles.tabsContent, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    // No specific styling needed
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tabsTrigger: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsTriggerActive: {
    backgroundColor: theme.colors.background,
    ...theme.shadows.sm,
  },
  tabsTriggerText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    color: theme.colors.mutedForeground,
  },
  tabsTriggerTextActive: {
    color: theme.colors.foreground,
  },
  tabsContent: {
    marginTop: theme.spacing.md,
  },
});