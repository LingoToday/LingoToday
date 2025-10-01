import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // In React Native, we're always on mobile, but we can check for tablet vs phone
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Consider anything less than tablet width as mobile
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    });

    // Initial check
    const { width } = Dimensions.get('window');
    setIsMobile(width < MOBILE_BREAKPOINT);

    return subscription?.remove;
  }, []);

  return isMobile;
}

export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return subscription?.remove;
  }, []);

  return dimensions;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Consider devices with width >= 768 as tablets
      setIsTablet(window.width >= MOBILE_BREAKPOINT);
    });

    // Initial check
    const { width } = Dimensions.get('window');
    setIsTablet(width >= MOBILE_BREAKPOINT);

    return subscription?.remove;
  }, []);

  return isTablet;
}