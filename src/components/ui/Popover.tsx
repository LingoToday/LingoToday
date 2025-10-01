import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

import { theme } from '../../lib/theme';

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  trigger?: 'press' | 'longPress';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

export function Popover({ 
  children, 
  content, 
  trigger = 'press',
  placement = 'bottom',
  visible: controlledVisible,
  onVisibleChange
}: PopoverProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const [childLayout, setChildLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const visible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  const showPopover = () => {
    const newVisible = true;
    if (controlledVisible === undefined) {
      setInternalVisible(newVisible);
    }
    onVisibleChange?.(newVisible);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePopover = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newVisible = false;
      if (controlledVisible === undefined) {
        setInternalVisible(newVisible);
      }
      onVisibleChange?.(newVisible);
    });
  };

  const getPopoverPosition = () => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const popoverWidth = Math.min(300, screenWidth - 40);
    const popoverMaxHeight = Math.min(400, screenHeight - 100);

    let x = childLayout.x;
    let y = childLayout.y;

    switch (placement) {
      case 'top':
        x = childLayout.x + childLayout.width / 2 - popoverWidth / 2;
        y = childLayout.y - popoverMaxHeight - 8;
        break;
      case 'bottom':
        x = childLayout.x + childLayout.width / 2 - popoverWidth / 2;
        y = childLayout.y + childLayout.height + 8;
        break;
      case 'left':
        x = childLayout.x - popoverWidth - 8;
        y = childLayout.y + childLayout.height / 2 - popoverMaxHeight / 2;
        break;
      case 'right':
        x = childLayout.x + childLayout.width + 8;
        y = childLayout.y + childLayout.height / 2 - popoverMaxHeight / 2;
        break;
    }

    // Keep popover within screen bounds
    x = Math.max(10, Math.min(x, screenWidth - popoverWidth - 10));
    y = Math.max(10, Math.min(y, screenHeight - popoverMaxHeight - 10));

    return { x, y, width: popoverWidth, maxHeight: popoverMaxHeight };
  };

  const handleTrigger = () => {
    if (visible) {
      hidePopover();
    } else {
      showPopover();
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={trigger === 'press' ? handleTrigger : undefined}
        onLongPress={trigger === 'longPress' ? handleTrigger : undefined}
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
          onRequestClose={hidePopover}
        >
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1}
            onPress={hidePopover}
          >
            <Animated.View
              style={[
                styles.popover,
                getPopoverPosition(),
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <ScrollView 
                  style={styles.popoverContent}
                  showsVerticalScrollIndicator={false}
                >
                  {content}
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

// Subcomponents for easier usage
interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  return <>{children}</>;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PopoverContent({ children }: PopoverContentProps) {
  return (
    <View style={styles.contentContainer}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  popover: {
    position: 'absolute',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  popoverContent: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});