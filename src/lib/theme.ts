import { Platform } from 'react-native';

// Platform-specific font scaling to match iOS appearance
// Android renders fonts ~12% larger than iOS at the same pixel size
const platformFontScale = Platform.OS === 'android' ? 0.88 : 1;

export const scaleFontSize = (size: number): number => {
  return Math.round(size * platformFontScale);
};

export const theme = {
  colors: {
    // Brand colors from style guide
    background: '#ffffff',
    foreground: '#09090b',
    muted: '#ECECF0',
    mutedForeground: '#64748b',
    popover: '#ffffff',
    popoverForeground: '#09090b',
    card: '#ffffff',
    cardForeground: '#09090b',
    border: '#e2e8f0',
    input: '#e2e8f0',
    primary: '#50B8FD',
    primaryForeground: '#ffffff',
    secondary: '#50B8FD',
    secondaryForeground: '#ffffff',
    accent: '#E9EBEF',
    accentForeground: '#09090b',
    destructive: '#EF4444',
    destructiveForeground: '#ffffff',
    ring: '#50B8FD',

    // Extended brand colors
    primary50: '#e6f6ff',
    primary100: '#b3e5ff',
    primary500: '#50B8FD',
    primary600: '#40a8ed',
    primary700: '#3098dd',

    secondary50: '#e6f6ff',
    secondary100: '#b3e5ff',
    secondary500: '#50B8FD',
    secondary600: '#40a8ed',
    secondary700: '#3098dd',

    success50: '#d1fae5',
    success500: '#10B981',
    success600: '#059669',

    warning50: '#fffbeb',
    warning500: '#f59e0b',
    warning600: '#d97706',

    // Surface colors for clean cards
    surface: '#ffffff',
    surfaceContainer: '#ECECF0',
    surfaceVariant: '#E9EBEF',

    // Text colors
    onSurface: '#09090b',
    onSurfaceVariant: '#64748b',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',

    // Status colors
    error: '#EF4444',
    errorContainer: '#fee2e2',
    onError: '#ffffff',
    onErrorContainer: '#7f1d1d',

    // Additional colors
    outline: '#cbd5e1',
    shadow: '#000000',
    inverseSurface: '#18181b',
    inverseOnSurface: '#fafafa',
    inversePrimary: '#a5b4fc',
    transparent: 'transparent',
  },
  
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999,
  },

  fontSize: {
    xxs: scaleFontSize(11),
    xs: scaleFontSize(12),
    sm: scaleFontSize(14),
    base: scaleFontSize(16),
    lg: scaleFontSize(18),
    xl: scaleFontSize(20),
    '2xl': scaleFontSize(24),
    '2.5xl': scaleFontSize(28),
    '3xl': scaleFontSize(30),
    '4xl': scaleFontSize(36),
    '5xl': scaleFontSize(48),
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    // Absolute values for specific use cases
    xs: scaleFontSize(18),
    sm: scaleFontSize(20),
    md: scaleFontSize(24),
    lg: scaleFontSize(28),
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
