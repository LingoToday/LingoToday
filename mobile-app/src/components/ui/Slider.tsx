import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  ViewStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  style,
}: SliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0);
  
  // Calculate initial thumb position
  React.useEffect(() => {
    if (sliderWidth > 0) {
      const percentage = (value[0] - min) / (max - min);
      setThumbPosition(percentage * (sliderWidth - 20)); // 20 is thumb width
    }
  }, [value, min, max, sliderWidth]);

  const updateValue = (newPosition: number) => {
    const percentage = newPosition / (sliderWidth - 20);
    const newValue = min + percentage * (max - min);
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    onValueChange?.([steppedValue]);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      // Start gesture
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!disabled) {
        const newPosition = Math.max(0, Math.min(sliderWidth - 20, thumbPosition + gestureState.dx));
        setThumbPosition(newPosition);
        updateValue(newPosition);
      }
    },
    onPanResponderRelease: () => {
      // End gesture
    },
  });

  const trackFillWidth = thumbPosition + 10; // 10 is half thumb width

  return (
    <View 
      style={[styles.container, style]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: trackFillWidth }]} />
      </View>
      
      <View 
        style={[
          styles.thumb, 
          { left: thumbPosition }, 
          disabled && styles.thumbDisabled
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  track: {
    height: 8,
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  trackFill: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbDisabled: {
    opacity: 0.5,
  },
});