import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const checklistItems = [
  { emoji: '✨', label: 'Creating diverse topics' },
  { emoji: '💬', label: 'Preparing interactive dialogues' },
  { emoji: '📚', label: 'Optimizing your learning path' },
  { emoji: '✅', label: 'Finishing your plan' },
];

const SIZE = 220;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const progressSteps = [
  { target: 8, duration: 800 },
  { target: 15, duration: 600 },
  { target: 22, duration: 1200 },
  { target: 28, duration: 400 },
  { target: 35, duration: 1500 },
  { target: 42, duration: 800 },
  { target: 48, duration: 600 },
  { target: 55, duration: 1800 },
  { target: 60, duration: 400 },
  { target: 68, duration: 1200 },
  { target: 72, duration: 300 },
  { target: 78, duration: 1500 },
  { target: 85, duration: 800 },
  { target: 90, duration: 1000 },
  { target: 94, duration: 600 },
  { target: 97, duration: 800 },
  { target: 100, duration: 700 },
];

const OnboardingLoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const hasCompleted = useRef(false);
  const completeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => {
      const percent = Math.round(value);
      setDisplayPercent(percent);

      const newCompleted: number[] = [];
      if (value >= 25) newCompleted.push(0);
      if (value >= 50) newCompleted.push(1);
      if (value >= 75) newCompleted.push(2);
      if (value >= 95) newCompleted.push(3);
      setCompletedItems(newCompleted);

      if (value >= 100 && !hasCompleted.current) {
        hasCompleted.current = true;
        completeTimeout.current = setTimeout(() => {
          onComplete();
        }, 600);
      }
    });

    let currentStep = 0;
    const runNextStep = () => {
      if (currentStep >= progressSteps.length) return;
      const step = progressSteps[currentStep];
      Animated.timing(animatedProgress, {
        toValue: step.target,
        duration: step.duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        currentStep++;
        runNextStep();
      });
    };

    const timeout = setTimeout(() => {
      runNextStep();
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (completeTimeout.current) clearTimeout(completeTimeout.current);
      animatedProgress.stopAnimation();
      animatedProgress.removeListener(listener);
    };
  }, []);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.screenContent}>
      <Text style={styles.loadingHeader}>
        Creating your personal experience...
      </Text>

      <View style={styles.loadingProgressContainer}>
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.colors.border}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.colors.primary}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View style={styles.loadingImageContainer}>
          <Image
            source={require('../attached_assets/Gemini_Generated_Image_9mgcok9mgcok9mgc_1770930709966.png')}
            style={styles.loadingImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.loadingPercentContainer}>
          <Text style={styles.loadingPercent}>{displayPercent}%</Text>
        </View>
      </View>

      <View style={styles.loadingChecklist}>
        {checklistItems.map((item, index) => {
          const isDone = completedItems.includes(index);
          return (
            <View key={index} style={styles.loadingChecklistItem}>
              <Text style={styles.loadingChecklistEmoji}>{item.emoji}</Text>
              <Text style={styles.loadingChecklistLabel}>{item.label}</Text>
              <Text style={[
                styles.loadingChecklistStatus,
                isDone && styles.loadingChecklistStatusDone,
              ]}>
                {isDone ? 'Done' : 'Loading'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default OnboardingLoadingScreen;
