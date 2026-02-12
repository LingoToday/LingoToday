import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, TouchableOpacity } from 'react-native';
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

const goalOptions = [
  { value: '5', label: '5 min/day' },
  { value: '10', label: '10 min/day' },
  { value: '15', label: '15 min/day' },
  { value: '30', label: '30 min/day' },
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

const OnboardingLoadingScreen = ({ onComplete, selectedGoal, onGoalSelect }: {
  onComplete: () => void;
  selectedGoal: string;
  onGoalSelect: (value: string) => void;
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const hasCompleted = useRef(false);
  const hasShownOverlay = useRef(false);
  const isPaused = useRef(false);
  const currentStepRef = useRef(0);
  const completeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runNextStepRef = useRef<() => void>(() => {});

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

      if (value >= 40 && !hasShownOverlay.current) {
        hasShownOverlay.current = true;
        isPaused.current = true;
        setShowOverlay(true);
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }

      if (value >= 100 && !hasCompleted.current) {
        hasCompleted.current = true;
        completeTimeout.current = setTimeout(() => {
          onComplete();
        }, 600);
      }
    });

    const runNextStep = () => {
      if (isPaused.current) return;
      if (currentStepRef.current >= progressSteps.length) return;
      const step = progressSteps[currentStepRef.current];
      Animated.timing(animatedProgress, {
        toValue: step.target,
        duration: step.duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        currentStepRef.current++;
        runNextStep();
      });
    };
    runNextStepRef.current = runNextStep;

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

  const handleGoalSelect = (value: string) => {
    onGoalSelect(value);
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setOverlayDismissed(true);
      setShowOverlay(false);
      isPaused.current = false;
      runNextStepRef.current();
    });
  };

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
            source={require('../../attached_assets/Loading_&_Plan_Creation_1770935409900.png')}
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

      {showOverlay && !overlayDismissed && (
        <Animated.View style={[styles.goalOverlayBackdrop, { opacity: overlayOpacity }]}>
          <View style={styles.goalOverlayCard}>
            <Text style={styles.goalOverlayTitle}>
              What is your daily practice goal?
            </Text>
            <View style={styles.goalOverlayOptions}>
              {goalOptions.map((option) => {
                const isSelected = selectedGoal === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleGoalSelect(option.value)}
                    style={[
                      styles.goalOverlayOption,
                      isSelected && styles.goalOverlayOptionSelected,
                    ]}
                    testID={`button-goal-${option.value}`}
                  >
                    <Text style={[
                      styles.goalOverlayOptionText,
                      isSelected && styles.goalOverlayOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default OnboardingLoadingScreen;
