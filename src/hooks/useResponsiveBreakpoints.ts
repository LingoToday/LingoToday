import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface ResponsiveBreakpoints {
  isSmallHandset: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useResponsiveBreakpoints(): ResponsiveBreakpoints {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isAndroid = Platform.OS === 'android';
  const isSmallHandset = isAndroid && (dimensions.width <= 400 || dimensions.height <= 720);

  return {
    isSmallHandset,
    isAndroid,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
  };
}
