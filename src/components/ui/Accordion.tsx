import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../lib/theme';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
}

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  style?: ViewStyle;
}

export function AccordionItem({
  title,
  children,
  isOpen = false,
  onToggle,
  style,
  titleStyle,
  contentStyle,
}: AccordionItemProps) {
  const [animation] = useState(new Animated.Value(isOpen ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animation]);

  const contentHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Adjust based on your content
  });

  const iconRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.item, style]}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, titleStyle]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.colors.mutedForeground}
          />
        </Animated.View>
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.content,
          { height: isOpen ? 'auto' : 0 },
          contentStyle,
        ]}
      >
        {isOpen && (
          <View style={styles.contentInner}>
            {children}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

export function Accordion({ children, type = 'single', style }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    if (type === 'single') {
      setOpenItems(openItems.has(index) ? new Set() : new Set([index]));
    } else {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      setOpenItems(newOpenItems);
    }
  };

  return (
    <View style={[styles.accordion, style]}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<AccordionItemProps>(child) && child.type === AccordionItem) {
          return React.cloneElement(child, {
            ...child.props,
            isOpen: openItems.has(index),
            onToggle: () => handleToggle(index),
          });
        }
        return child;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  accordion: {
    backgroundColor: theme.colors.background,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  triggerText: {
    fontSize: theme.fontSize.base,
    fontWeight: '500' as any,
    color: theme.colors.foreground,
    flex: 1,
  },
  content: {
    overflow: 'hidden',
  },
  contentInner: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});