import { Platform } from 'react-native';

// Platform-specific font scaling to match iOS appearance
// Android renders fonts larger than iOS at the same pixel size
const platformFontScale = Platform.OS === 'android' ? 0.82 : 1;

export const scaleFontSize = (size: number): number => {
  return Math.round(size * platformFontScale);
};

export const theme = {
  colors: {
    // Dark mode color palette
    background: '#2B2D3A',
    foreground: '#ffffff',
    muted: '#3A3C4A',
    mutedForeground: '#9CA3AF',
    popover: '#3A3C4A',
    popoverForeground: '#ffffff',
    card: '#3A3C4A',
    cardForeground: '#ffffff',
    border: '#4B5563',
    input: '#4B5563',
    
    // Lime green primary color (from designs)
    primary: '#A3E635',
    primaryForeground: '#1F2937',
    
    // Secondary colors
    secondary: '#6366F1',
    secondaryForeground: '#ffffff',
    accent: '#4B5563',
    accentForeground: '#ffffff',
    destructive: '#EF4444',
    destructiveForeground: '#ffffff',
    ring: '#A3E635',

    // Extended brand colors with lime green
    primary50: '#F7FEE7',
    primary100: '#ECFCCB',
    primary500: '#A3E635',
    primary600: '#84CC16',
    primary700: '#65A30D',

    // Indigo/Purple secondary
    secondary50: '#EEF2FF',
    secondary100: '#E0E7FF',
    secondary500: '#6366F1',
    secondary600: '#4F46E5',
    secondary700: '#4338CA',

    // Success (kept green)
    success50: '#d1fae5',
    success500: '#10B981',
    success600: '#059669',

    // Warning/Orange
    warning50: '#fffbeb',
    warning500: '#f59e0b',
    warning600: '#d97706',

    // Surface colors for dark mode
    surface: '#2B2D3A',
    surfaceContainer: '#3A3C4A',
    surfaceVariant: '#4B5563',
    surfaceDark: '#1F2937',
    
    // Colorful gradient colors
    gradientPurple: '#A855F7',
    gradientPink: '#EC4899',
    gradientOrange: '#F97316',
    gradientYellow: '#EAB308',
    gradientGreen: '#A3E635',
    gradientBlue: '#3B82F6',
    gradientIndigo: '#6366F1',

    // Text colors for dark mode
    onSurface: '#ffffff',
    onSurfaceVariant: '#D1D5DB',
    onPrimary: '#1F2937',
    onSecondary: '#ffffff',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',

    // Status colors
    error: '#EF4444',
    errorContainer: '#7f1d1d',
    onError: '#ffffff',
    onErrorContainer: '#fee2e2',

    // Additional colors
    outline: '#4B5563',
    shadow: '#000000',
    inverseSurface: '#F3F4F6',
    inverseOnSurface: '#1F2937',
    inversePrimary: '#65A30D',
    transparent: 'transparent',
    
    // Special colors from designs
    proGreen: '#A3E635',
    proTag: '#84CC16',
    progressBarBg: '#4B5563',
    checkmarkGreen: '#10B981',
    
    // Interactive states for dark mode
    primaryHover: '#84CC16',
    primaryPressed: '#65A30D',
    cardHover: '#404252',
    toggleActive: '#5B6B4A',
    
    // Stat card gradient backgrounds
    statGradientGreen: '#A3E635',
    statGradientPurple: '#A855F7',
    statGradientPink: '#EC4899',
    
    // Feedback and comment backgrounds
    feedbackOlive: '#5B6B4A',
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
