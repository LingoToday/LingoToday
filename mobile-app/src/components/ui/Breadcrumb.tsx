import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    onPress?: () => void;
  }>;
  separator?: React.ReactNode;
  style?: any;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  style,
}) => {
  const defaultSeparator = (
    <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedForeground} />
  );

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.onPress ? (
            <TouchableOpacity
              style={[
                styles.item,
                index === items.length - 1 && styles.lastItem,
              ]}
              onPress={item.onPress}
            >
              <Text style={[
                styles.text,
                index === items.length - 1 ? styles.currentText : styles.linkText,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[
              styles.item,
              index === items.length - 1 && styles.lastItem,
            ]}>
              <Text style={[
                styles.text,
                index === items.length - 1 ? styles.currentText : styles.linkText,
              ]}>
                {item.label}
              </Text>
            </View>
          )}
          
          {index < items.length - 1 && (
            <View style={styles.separator}>
              {separator || defaultSeparator}
            </View>
          )}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  item: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  lastItem: {
    // No special styling for last item in mobile
  },
  text: {
    fontSize: theme.fontSize.sm,
  },
  linkText: {
    color: theme.colors.primary,
  },
  currentText: {
    color: theme.colors.foreground,
    fontWeight: '500' as any,
  },
  separator: {
    marginHorizontal: theme.spacing.xs,
  },
});