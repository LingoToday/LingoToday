import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Text as SvgText, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHART_WIDTH = 320;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 20;
const PADDING_BOTTOM = 30;
const PADDING_TOP = 20;

const lingoTodayPath = `M ${PADDING_LEFT},${CHART_HEIGHT - PADDING_BOTTOM - 10} C ${PADDING_LEFT + 40},${CHART_HEIGHT - PADDING_BOTTOM - 15} ${PADDING_LEFT + 80},${CHART_HEIGHT - PADDING_BOTTOM - 40} ${PADDING_LEFT + 120},${CHART_HEIGHT - PADDING_BOTTOM - 70} S ${PADDING_LEFT + 200},${CHART_HEIGHT - PADDING_BOTTOM - 140} ${PADDING_LEFT + 260},${CHART_HEIGHT - PADDING_BOTTOM - 160} S ${CHART_WIDTH - 20},${PADDING_TOP + 5} ${CHART_WIDTH - 10},${PADDING_TOP}`;

const otherAppsPath = `M ${PADDING_LEFT},${CHART_HEIGHT - PADDING_BOTTOM - 10} C ${PADDING_LEFT + 50},${CHART_HEIGHT - PADDING_BOTTOM - 15} ${PADDING_LEFT + 100},${CHART_HEIGHT - PADDING_BOTTOM - 30} ${PADDING_LEFT + 150},${CHART_HEIGHT - PADDING_BOTTOM - 45} S ${PADDING_LEFT + 220},${CHART_HEIGHT - PADDING_BOTTOM - 55} ${CHART_WIDTH - 10},${CHART_HEIGHT - PADDING_BOTTOM - 60}`;

const LINGO_PATH_LENGTH = 450;
const OTHER_PATH_LENGTH = 350;

const lingoTodayDots = [
  { cx: PADDING_LEFT, cy: CHART_HEIGHT - PADDING_BOTTOM - 10, r: 6 },
  { cx: CHART_WIDTH - 10, cy: PADDING_TOP, r: 7 },
];

const otherAppsDots = [
  { cx: PADDING_LEFT, cy: CHART_HEIGHT - PADDING_BOTTOM - 10, r: 6 },
  { cx: CHART_WIDTH - 10, cy: CHART_HEIGHT - PADDING_BOTTOM - 60, r: 6 },
];

const OnboardingGrowthChartScreen = () => {
  const lingoAnim = useRef(new Animated.Value(0)).current;
  const otherAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(lingoAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(otherAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const lingoStrokeDashoffset = lingoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [LINGO_PATH_LENGTH, 0],
  });

  const otherStrokeDashoffset = otherAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [OTHER_PATH_LENGTH, 0],
  });

  return (
    <View style={styles.screenContent}>
      <Text style={styles.growthChartHeader}>
        Your personalized plan is ready!
      </Text>
      <Text style={styles.growthChartSubheader}>
        We've developed a personal growth strategy tailored for your goal.
      </Text>

      <View style={styles.growthChartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 20}`}>
          <Defs>
            <LinearGradient id="lingoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#8B5CF6" />
              <Stop offset="50%" stopColor="#A855F7" />
              <Stop offset="100%" stopColor="#EC4899" />
            </LinearGradient>
          </Defs>

          {[0.2, 0.4, 0.6, 0.8].map((frac, i) => (
            <Line
              key={`vline-${i}`}
              x1={PADDING_LEFT + frac * (CHART_WIDTH - PADDING_LEFT - 10)}
              y1={PADDING_TOP}
              x2={PADDING_LEFT + frac * (CHART_WIDTH - PADDING_LEFT - 10)}
              y2={CHART_HEIGHT - PADDING_BOTTOM}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          {[0, 1, 2, 3].map((i) => {
            const y1 = CHART_HEIGHT - PADDING_BOTTOM - 10 - i * 15;
            const y2 = CHART_HEIGHT - PADDING_BOTTOM - 60 + i * 5;
            return (
              <Line
                key={`dashed-${i}`}
                x1={PADDING_LEFT + 20}
                y1={y1}
                x2={CHART_WIDTH - 20}
                y2={y2}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
                strokeDasharray="6,4"
              />
            );
          })}

          <AnimatedPath
            d={otherAppsPath}
            stroke="#3B82F6"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${OTHER_PATH_LENGTH}`}
            strokeDashoffset={otherStrokeDashoffset}
          />

          <AnimatedPath
            d={lingoTodayPath}
            stroke="url(#lingoGradient)"
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${LINGO_PATH_LENGTH}`}
            strokeDashoffset={lingoStrokeDashoffset}
          />

          {lingoTodayDots.map((dot, i) => (
            <React.Fragment key={`lingo-dot-${i}`}>
              <Circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r + 2}
                fill="rgba(168, 85, 247, 0.2)"
                opacity={dotOpacity as any}
              />
              <Circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill={i === lingoTodayDots.length - 1 ? '#EC4899' : '#A855F7'}
                stroke="white"
                strokeWidth={2}
                opacity={dotOpacity as any}
              />
            </React.Fragment>
          ))}

          {otherAppsDots.map((dot, i) => (
            <React.Fragment key={`other-dot-${i}`}>
              <Circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r + 2}
                fill="rgba(59, 130, 246, 0.2)"
                opacity={dotOpacity as any}
              />
              <Circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill="#3B82F6"
                stroke="white"
                strokeWidth={2}
                opacity={dotOpacity as any}
              />
            </React.Fragment>
          ))}

          <AnimatedG opacity={dotOpacity as any}>
            <Line
              x1={CHART_WIDTH - 10}
              y1={PADDING_TOP + 7}
              x2={CHART_WIDTH - 10}
              y2={CHART_HEIGHT - PADDING_BOTTOM}
              stroke="rgba(236, 72, 153, 0.5)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          </AnimatedG>

          <SvgText
            x={PADDING_LEFT}
            y={CHART_HEIGHT - 2}
            fill="rgba(255,255,255,0.5)"
            fontSize={12}
            fontWeight="500"
          >
            Today
          </SvgText>
          <SvgText
            x={CHART_WIDTH - 10}
            y={CHART_HEIGHT - 2}
            fill="#FFFFFF"
            fontSize={12}
            fontWeight="500"
            textAnchor="end"
          >
            4 weeks
          </SvgText>

          <SvgText
            x={PADDING_LEFT - 5}
            y={CHART_HEIGHT - PADDING_BOTTOM - 30}
            fill="rgba(255,255,255,0.4)"
            fontSize={10}
            fontWeight="400"
            transform={`rotate(-90, ${PADDING_LEFT - 5}, ${CHART_HEIGHT - PADDING_BOTTOM - 30})`}
          >
            Your level
          </SvgText>

          <AnimatedG opacity={dotOpacity as any}>
            <SvgText
              x={CHART_WIDTH - 22}
              y={PADDING_TOP - 6}
              fill="#EC4899"
              fontSize={14}
              fontWeight="700"
              textAnchor="end"
            >
              LingoToday
            </SvgText>
            <SvgText
              x={CHART_WIDTH - 22}
              y={CHART_HEIGHT - PADDING_BOTTOM - 70}
              fill="#3B82F6"
              fontSize={14}
              fontWeight="700"
              textAnchor="end"
            >
              Other apps
            </SvgText>
          </AnimatedG>
        </Svg>

        <View style={styles.growthChartLegend}>
          <View style={styles.growthChartLegendItem}>
            <View style={[styles.growthChartLegendDot, { backgroundColor: '#A855F7' }]} />
            <Text style={styles.growthChartLegendLabel}>LingoToday</Text>
          </View>
          <View style={styles.growthChartLegendItem}>
            <View style={[styles.growthChartLegendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.growthChartLegendLabel}>Other apps</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingGrowthChartScreen;
