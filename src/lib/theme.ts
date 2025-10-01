export const theme = {
  colors: {
    // Light theme inspired by Taaskhub
    background: '#ffffff',
    foreground: '#09090b',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    popover: '#ffffff',
    popoverForeground: '#09090b',
    card: '#ffffff',
    cardForeground: '#09090b',
    border: '#e2e8f0',
    input: '#e2e8f0',
    primary: '#6366f1',
    primaryForeground: '#ffffff',
    secondary: '#f8fafc',
    secondaryForeground: '#09090b',
    accent: '#f8fafc',
    accentForeground: '#09090b',
    destructive: '#ef4444',
    destructiveForeground: '#fefefe',
    ring: '#6366f1',

    // Custom Taaskhub-inspired colors
    primary50: '#f0f4ff',
    primary100: '#e0ecff',
    primary500: '#6366f1',
    primary600: '#5855eb',
    primary700: '#4f46e5',

    secondary50: '#fffbeb',
    secondary100: '#fef3c7',
    secondary500: '#f59e0b',
    secondary600: '#d97706',
    secondary700: '#b45309',

    success50: '#f0fdf4',
    success500: '#22c55e',
    success600: '#16a34a',

    warning50: '#fffbeb',
    warning500: '#f59e0b',
    warning600: '#d97706',

    // Surface colors for clean cards
    surface: '#ffffff',
    surfaceContainer: '#f8fafc',
    surfaceVariant: '#f1f5f9',

    // Text colors
    onSurface: '#09090b',
    onSurfaceVariant: '#64748b',
    onPrimary: '#ffffff',
    onSecondary: '#09090b',

    // Status colors
    error: '#ef4444',
    errorContainer: '#fee2e2',
    onError: '#ffffff',
    onErrorContainer: '#7f1d1d',

    // Additional colors
    outline: '#cbd5e1',
    shadow: '#000000',
    inverseSurface: '#18181b',
    inverseOnSurface: '#fafafa',
    inversePrimary: '#a5b4fc',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
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
