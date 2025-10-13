import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

import { theme } from '../../lib/theme';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export function Tooltip({ 
  children, 
  content, 
  placement = 'top',
  disabled = false 
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [childLayout, setChildLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showTooltip = () => {
    if (disabled) return;
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const getTooltipPosition = () => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const tooltipWidth = Math.min(content.length * 8 + 20, screenWidth - 40);
    const tooltipHeight = 32;

    let x = childLayout.x + childLayout.width / 2 - tooltipWidth / 2;
    let y = childLayout.y;

    switch (placement) {
      case 'top':
        y = childLayout.y - tooltipHeight - 8;
        break;
      case 'bottom':
        y = childLayout.y + childLayout.height + 8;
        break;
      case 'left':
        x = childLayout.x - tooltipWidth - 8;
        y = childLayout.y + childLayout.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = childLayout.x + childLayout.width + 8;
        y = childLayout.y + childLayout.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within screen bounds
    x = Math.max(10, Math.min(x, screenWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, screenHeight - tooltipHeight - 10));

    return { x, y, width: tooltipWidth, height: tooltipHeight };
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        onLongPress={showTooltip}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          setChildLayout({ x, y, width, height });
        }}
      >
        {children}
      </TouchableOpacity>

      {visible && (
        <Modal
          transparent
          visible={visible}
          animationType="none"
          onRequestClose={hideTooltip}
        >
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1}
            onPress={hideTooltip}
          >
            <Animated.View
              style={[
                styles.tooltip,
                getTooltipPosition(),
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.tooltipText}>{content}</Text>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: theme.colors.foreground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
});