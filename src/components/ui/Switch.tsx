import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
  switchStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  style,
  switchStyle,
  labelStyle,
}: SwitchProps) {
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [checked, animatedValue]);

  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.input, theme.colors.primary],
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {label && (
        <Text
          style={[
            styles.label,
            disabled && styles.disabledLabel,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.track,
          { backgroundColor },
          disabled && styles.disabledTrack,
          switchStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
            disabled && styles.disabledThumb,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    position: 'absolute',
    ...theme.shadows.sm,
  },
  disabledTrack: {
    opacity: 0.5,
  },
  disabledThumb: {
    opacity: 0.5,
  },
  label: {
    marginRight: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  disabledLabel: {
    color: theme.colors.mutedForeground,
    opacity: 0.5,
  },
});