import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: ViewStyle;
}

export function Collapsible({
  children,
  open: controlledOpen,
  onOpenChange,
  style,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const toggleOpen = () => {
    const newOpen = !isOpen;
    
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    
    onOpenChange?.(newOpen);
  };

  return (
    <View style={[styles.collapsible, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onPress: toggleOpen,
              isOpen,
            });
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
            });
          }
        }
        return child;
      })}
    </View>
  );
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  isOpen?: boolean;
  style?: ViewStyle;
}

export function CollapsibleTrigger({
  children,
  onPress,
  style,
}: CollapsibleTriggerProps) {
  return (
    <TouchableOpacity
      style={[styles.trigger, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  style?: ViewStyle;
}

export function CollapsibleContent({
  children,
  isOpen = false,
  style,
}: CollapsibleContentProps) {
  const animatedHeight = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animatedHeight]);

  if (!isOpen) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: animatedHeight,
          transform: [{
            scaleY: animatedHeight,
          }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  collapsible: {
    overflow: 'hidden',
  },
  trigger: {
    // No specific styles, let the consumer define them
  },
  content: {
    overflow: 'hidden',
  },
});