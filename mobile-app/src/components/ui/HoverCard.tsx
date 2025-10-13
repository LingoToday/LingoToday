import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';

import { theme } from '../../lib/theme';

export interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  style?: any;
  contentStyle?: any;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  content,
  style,
  contentStyle,
  side = 'top',
  align = 'center',
}) => {
  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  const showCard = () => {
    setVisible(true);
  };

  const hideCard = () => {
    setVisible(false);
  };

  const onTriggerLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setTriggerLayout({ x, y, width, height });
  };

  const getCardPosition = () => {
    const { x, y, width, height } = triggerLayout;
    let cardX = x;
    let cardY = y;

    // Adjust position based on side
    switch (side) {
      case 'top':
        cardY = y - 10; // Card height + margin
        break;
      case 'bottom':
        cardY = y + height + 10;
        break;
      case 'left':
        cardX = x - 200; // Card width + margin
        cardY = y + height / 2;
        break;
      case 'right':
        cardX = x + width + 10;
        cardY = y + height / 2;
        break;
    }

    // Adjust position based on alignment
    switch (align) {
      case 'start':
        if (side === 'top' || side === 'bottom') {
          cardX = x;
        }
        break;
      case 'center':
        if (side === 'top' || side === 'bottom') {
          cardX = x + width / 2 - 100; // Half card width
        } else {
          cardY = y + height / 2 - 50; // Half card height
        }
        break;
      case 'end':
        if (side === 'top' || side === 'bottom') {
          cardX = x + width - 200; // Card width
        }
        break;
    }

    return { left: Math.max(10, cardX), top: Math.max(10, cardY) };
  };

  return (
    <>
      <TouchableOpacity
        onPressIn={showCard}
        onPressOut={hideCard}
        onLayout={onTriggerLayout}
        style={style}
        delayPressIn={500}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={hideCard}
      >
        <TouchableWithoutFeedback onPress={hideCard}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.card,
                getCardPosition(),
                contentStyle,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            >
              {content}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// Simplified version for basic tooltips
export interface SimpleHoverCardProps {
  children: React.ReactNode;
  text: string;
  style?: any;
}

export const SimpleHoverCard: React.FC<SimpleHoverCardProps> = ({
  children,
  text,
  style,
}) => {
  return (
    <HoverCard
      content={
        <View style={styles.simpleContent}>
          <Text style={styles.simpleText}>{text}</Text>
        </View>
      }
      style={style}
    >
      {children}
    </HoverCard>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    backgroundColor: theme.colors.popover,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    maxWidth: 200,
    ...theme.shadows.lg,
  },
  simpleContent: {
    padding: theme.spacing.sm,
  },
  simpleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.popoverForeground,
    textAlign: 'center',
  },
});