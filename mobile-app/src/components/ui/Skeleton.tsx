import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  style,
  borderRadius = theme.borderRadius.md 
}: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Predefined skeleton variations
export function SkeletonText({ lines = 1, ...props }: { lines?: number } & SkeletonProps) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '80%' : '100%'}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
          {...props}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40, ...props }: { size?: number } & SkeletonProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={48} />
        <View style={styles.cardHeaderText}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={16} width="40%" style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonText lines={3} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.muted,
  },
  textContainer: {
    gap: theme.spacing.xs,
  },
  card: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
});