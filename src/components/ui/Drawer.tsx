import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

import { theme } from '../../lib/theme';

const { height: screenHeight } = Dimensions.get('window');

export interface DrawerProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  style?: any;
}

export const Drawer: React.FC<DrawerProps> = ({
  children,
  visible,
  onClose,
  side = 'bottom',
  style,
}) => {
  return (
    <SimpleDrawer
      visible={visible}
      onClose={onClose}
      side={side}
      style={style}
    >
      {children}
    </SimpleDrawer>
  );
};

// Alternative simple drawer without gesture handler dependency
export const SimpleDrawer: React.FC<DrawerProps> = ({
  children,
  visible,
  onClose,
  side = 'bottom',
  style,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateX = useRef(new Animated.Value(side === 'left' ? -300 : 300)).current;

  useEffect(() => {
    if (visible) {
      if (side === 'bottom') {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    } else {
      if (side === 'bottom') {
        Animated.spring(translateY, {
          toValue: screenHeight,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: side === 'left' ? -300 : 300,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  }, [visible, side, translateY, translateX]);

  const getDrawerStyle = () => {
    switch (side) {
      case 'left':
        return [
          styles.drawerLeft,
          { transform: [{ translateX }] },
        ];
      case 'right':
        return [
          styles.drawerRight,
          { transform: [{ translateX }] },
        ];
      case 'bottom':
      default:
        return [
          styles.drawerBottom,
          { transform: [{ translateY }] },
        ];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[getDrawerStyle(), style]}>
          {side === 'bottom' && <View style={styles.handle} />}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Export SimpleDrawer as default to avoid gesture handler dependency
export default SimpleDrawer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: screenHeight * 0.8,
    ...theme.shadows.xl,
  },
  drawerLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: theme.colors.background,
    borderTopRightRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    ...theme.shadows.xl,
  },
  drawerRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
    ...theme.shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.mutedForeground,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
});