import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

import { theme } from '../../lib/theme';

interface ScrollAreaProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScrollArea({ 
  children, 
  style, 
  contentContainerStyle,
  ...props 
}: ScrollAreaProps) {
  return (
    <ScrollView
      style={[styles.scrollArea, style]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

interface ScrollBarProps {
  orientation?: 'vertical' | 'horizontal';
  style?: ViewStyle;
}

export function ScrollBar({ orientation = 'vertical', style }: ScrollBarProps) {
  return (
    <View 
      style={[
        styles.scrollBar,
        orientation === 'horizontal' ? styles.scrollBarHorizontal : styles.scrollBarVertical,
        style
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollBar: {
    backgroundColor: theme.colors.border,
    borderRadius: 4,
  },
  scrollBarVertical: {
    width: 8,
    minHeight: 20,
  },
  scrollBarHorizontal: {
    height: 8,
    minWidth: 20,
  },
});