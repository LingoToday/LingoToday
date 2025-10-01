import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  PanResponder,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface SheetContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
}

interface SheetFooterProps {
  children: React.ReactNode;
}

interface SheetCloseProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Context for sharing state between Sheet components
const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

// Main Sheet component
export function Sheet({ children, open = false, onOpenChange }: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <SheetContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

// Sheet Trigger
export function SheetTrigger({ children }: SheetTriggerProps) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  return (
    <TouchableOpacity 
      onPress={() => onOpenChange(true)}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

// Sheet Content
export function SheetContent({ 
  children, 
  side = 'bottom',
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, slideAnim, fadeAnim]);

  const getTransform = () => {
    switch (side) {
      case 'top':
        return [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenHeight, 0],
          }),
        }];
      case 'bottom':
        return [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [screenHeight, 0],
          }),
        }];
      case 'left':
        return [{
          translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenWidth, 0],
          }),
        }];
      case 'right':
        return [{
          translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [screenWidth, 0],
          }),
        }];
      default:
        return [];
    }
  };

  const getContentStyles = () => {
    const baseStyle = [styles.sheetContent];
    
    switch (side) {
      case 'top':
        return [...baseStyle, styles.sheetContentTop];
      case 'bottom':
        return [...baseStyle, styles.sheetContentBottom];
      case 'left':
        return [...baseStyle, styles.sheetContentLeft];
      case 'right':
        return [...baseStyle, styles.sheetContentRight];
      default:
        return [...baseStyle, styles.sheetContentBottom];
    }
  };

  // Pan responder for swipe to dismiss
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { dy, dx } = gestureState;
      
      // Only respond to swipes in the correct direction based on side
      switch (side) {
        case 'bottom':
          return dy > 0 && Math.abs(dy) > Math.abs(dx);
        case 'top':
          return dy < 0 && Math.abs(dy) > Math.abs(dx);
        case 'left':
          return dx < 0 && Math.abs(dx) > Math.abs(dy);
        case 'right':
          return dx > 0 && Math.abs(dx) > Math.abs(dy);
        default:
          return false;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dy, dx } = gestureState;
      const distance = side === 'bottom' || side === 'top' ? Math.abs(dy) : Math.abs(dx);
      const threshold = side === 'bottom' || side === 'top' ? screenHeight * 0.3 : screenWidth * 0.3;
      const progress = Math.min(distance / threshold, 1);
      
      slideAnim.setValue(1 - progress);
      fadeAnim.setValue(1 - progress * 0.5);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy, dx } = gestureState;
      const velocity = side === 'bottom' || side === 'top' ? gestureState.vy : gestureState.vx;
      const shouldClose = Math.abs(velocity) > 0.5;
      
      if (shouldClose) {
        onOpenChange(false);
      } else {
        // Snap back to open position
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 1,
            tension: 300,
            friction: 30,
            useNativeDriver: true,
          }),
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 300,
            friction: 30,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={() => onOpenChange(false)}
        />
        
        <Animated.View
          style={[
            getContentStyles(),
            {
              transform: getTransform(),
            }
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Drag indicator for bottom and top sheets */}
            {(side === 'bottom' || side === 'top') && (
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>
            )}
            
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Sheet Header
export function SheetHeader({ children }: SheetHeaderProps) {
  return (
    <View style={styles.sheetHeader}>
      {children}
    </View>
  );
}

// Sheet Title
export function SheetTitle({ children }: SheetTitleProps) {
  return (
    <Text style={styles.sheetTitle}>
      {children}
    </Text>
  );
}

// Sheet Description
export function SheetDescription({ children }: SheetDescriptionProps) {
  return (
    <Text style={styles.sheetDescription}>
      {children}
    </Text>
  );
}

// Sheet Footer
export function SheetFooter({ children }: SheetFooterProps) {
  return (
    <View style={styles.sheetFooter}>
      {children}
    </View>
  );
}

// Sheet Close
export function SheetClose({ children }: SheetCloseProps) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  return (
    <TouchableOpacity 
      onPress={() => onOpenChange(false)}
      style={styles.closeButton}
      activeOpacity={0.8}
    >
      {children || <Ionicons name="close" size={24} color={theme.colors.foreground} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },

  // Sheet Content
  sheetContent: {
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetContentBottom: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: screenHeight * 0.9,
  },
  sheetContentTop: {
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    maxHeight: screenHeight * 0.9,
  },
  sheetContentLeft: {
    width: Math.min(screenWidth * 0.85, 400),
    height: screenHeight,
    borderTopRightRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  sheetContentRight: {
    width: Math.min(screenWidth * 0.85, 400),
    height: screenHeight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: theme.borderRadius.xl,
    alignSelf: 'flex-end',
  },

  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Drag Indicator
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  dragIndicator: {
    width: 32,
    height: 4,
    backgroundColor: theme.colors.mutedForeground,
    borderRadius: 2,
    opacity: 0.4,
  },

  // Header
  sheetHeader: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  sheetTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  sheetDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: theme.fontSize.base * 1.5,
  },

  // Footer
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  // Close Button
  closeButton: {
    padding: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
});