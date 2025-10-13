import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  PanResponder,
  Dimensions,
} from 'react-native';

import { theme } from '../../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface ResizableProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
  style?: ViewStyle;
}

export const Resizable: React.FC<ResizableProps> = ({
  children,
  direction = 'horizontal',
  defaultSize = 200,
  minSize = 100,
  maxSize = screenWidth * 0.8,
  onResize,
  style,
}) => {
  const [size, setSize] = React.useState(defaultSize);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      let newSize;
      if (direction === 'horizontal') {
        newSize = Math.max(minSize, Math.min(maxSize, size + gestureState.dx));
      } else {
        newSize = Math.max(minSize, Math.min(maxSize, size + gestureState.dy));
      }
      
      setSize(newSize);
      onResize?.(newSize);
    },
  });

  const containerStyle = direction === 'horizontal' 
    ? { width: size } 
    : { height: size };

  const handleStyle = direction === 'horizontal'
    ? styles.horizontalHandle
    : styles.verticalHandle;

  return (
    <View style={[containerStyle, style]}>
      <View style={styles.content}>
        {children}
      </View>
      <View style={[styles.handle, handleStyle]} {...panResponder.panHandlers}>
        <View style={styles.handleIndicator} />
      </View>
    </View>
  );
};

// Resizable panels for complex layouts
export interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export const ResizablePanelGroup: React.FC<ResizablePanelGroupProps> = ({
  children,
  direction = 'horizontal',
  style,
}) => {
  return (
    <View 
      style={[
        styles.panelGroup,
        direction === 'horizontal' ? styles.horizontalGroup : styles.verticalGroup,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  style?: ViewStyle;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultSize = 1,
  minSize = 0.1,
  maxSize = 0.9,
  style,
}) => {
  return (
    <View style={[{ flex: defaultSize }, style]}>
      {children}
    </View>
  );
};

export interface ResizableHandleProps {
  direction?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export const ResizableHandle: React.FC<ResizableHandleProps> = ({
  direction = 'horizontal',
  style,
}) => {
  return (
    <View style={[
      styles.handle,
      direction === 'horizontal' ? styles.horizontalHandle : styles.verticalHandle,
      style,
    ]}>
      <View style={styles.handleIndicator} />
    </View>
  );
};

// Simple split view for mobile
export interface SimpleSplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
  style?: ViewStyle;
}

export const SimpleSplitView: React.FC<SimpleSplitViewProps> = ({
  left,
  right,
  leftWidth = screenWidth * 0.3,
  style,
}) => {
  return (
    <View style={[styles.splitView, style]}>
      <View style={[styles.splitPanel, { width: leftWidth }]}>
        {left}
      </View>
      <View style={styles.splitDivider} />
      <View style={[styles.splitPanel, { flex: 1 }]}>
        {right}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  handle: {
    position: 'absolute',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalHandle: {
    right: -5,
    top: 0,
    bottom: 0,
    width: 10,
  },
  verticalHandle: {
    bottom: -5,
    left: 0,
    right: 0,
    height: 10,
  },
  handleIndicator: {
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  panelGroup: {
    flex: 1,
  },
  horizontalGroup: {
    flexDirection: 'row',
  },
  verticalGroup: {
    flexDirection: 'column',
  },

  // Simple split view
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  splitPanel: {
    backgroundColor: theme.colors.background,
  },
  splitDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
});

// Note: Full resizable functionality requires gesture handling
// This is a simplified version for React Native
export default Resizable;