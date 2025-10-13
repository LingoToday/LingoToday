import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { theme } from '../../lib/theme';

export interface CarouselProps {
  children: React.ReactNode[];
  style?: ViewStyle;
  itemWidth?: number;
  spacing?: number;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  style,
  itemWidth,
  spacing = theme.spacing.md,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(Dimensions.get('window').width);
  
  const effectiveItemWidth = itemWidth || viewportWidth - (theme.spacing.lg * 2);
  const totalItemWidth = effectiveItemWidth + spacing;

  React.useEffect(() => {
    if (autoPlay && children.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % children.length;
        scrollToIndex(nextIndex);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlay, currentIndex, children.length, autoPlayInterval]);

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * totalItemWidth,
        animated: true,
      });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / totalItemWidth);
    setCurrentIndex(Math.max(0, Math.min(index, children.length - 1)));
  };

  const renderDots = () => {
    if (!showDots || children.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {children.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={totalItemWidth}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: (viewportWidth - effectiveItemWidth) / 2 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={(event) => {
          setViewportWidth(event.nativeEvent.layout.width);
        }}
      >
        {children.map((child, index) => (
          <View
            key={index}
            style={[
              styles.item,
              { 
                width: effectiveItemWidth,
                marginRight: index < children.length - 1 ? spacing : 0,
              },
            ]}
          >
            {child}
          </View>
        ))}
      </ScrollView>
      
      {renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollContent: {
    alignItems: 'center',
  },
  item: {
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.mutedForeground,
    opacity: 0.3,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    opacity: 1,
    width: 12,
    height: 8,
    borderRadius: 4,
  },
});