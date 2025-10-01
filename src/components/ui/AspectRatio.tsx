import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: number;
  style?: ViewStyle;
}

export function AspectRatio({ 
  children, 
  ratio = 1, 
  style 
}: AspectRatioProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, { aspectRatio: ratio }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    width: '100%',
  },
});