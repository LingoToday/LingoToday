import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface AvatarProps {
  size?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface AvatarImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Avatar({ size = 40, style, children }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function AvatarImage({ source, style }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      onError={() => setHasError(true)}
      resizeMode="cover"
    />
  );
}

export function AvatarFallback({ children, style, textStyle }: AvatarFallbackProps) {
  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.fallbackText, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.muted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: theme.fontSize.base,
    fontWeight: '500' as any,
    color: theme.colors.mutedForeground,
  },
});