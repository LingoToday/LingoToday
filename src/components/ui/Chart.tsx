import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

const screenWidth = Dimensions.get('window').width;

export interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: any;
  style?: ViewStyle;
  width?: number;
  height?: number;
  title?: string;
}

export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  style,
  width = screenWidth - theme.spacing.lg * 2,
  height = 220,
  title,
}) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <SimpleBarChart data={data} height={height} />;
      
      case 'line':
        return <SimpleLineChart data={data} height={height} />;
      
      case 'pie':
        return (
          <View style={[styles.fallback, { width, height }]}>
            <Text style={styles.fallbackText}>Pie charts require additional setup</Text>
          </View>
        );
      
      default:
        return (
          <View style={[styles.fallback, { width, height }]}>
            <Text style={styles.fallbackText}>Chart type not supported</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
    </View>
  );
};

// Simple chart components for basic data visualization without external dependencies
export interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  style?: ViewStyle;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  maxValue,
  height = 200,
  style,
}) => {
  const max = maxValue || Math.max(...data.map(item => item.value));

  return (
    <View style={[styles.simpleChart, { height }, style]}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (item.value / max) * (height - 60),
                    backgroundColor: item.color || theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export interface SimpleLineChartProps {
  data: Array<{ x: string; y: number }>;
  height?: number;
  style?: ViewStyle;
}

// Note: For a full LineChart implementation, you would need react-native-svg
export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  height = 200,
  style,
}) => {
  const maxValue = Math.max(...data.map(item => item.y));

  return (
    <View style={[styles.simpleChart, { height }, style]}>
      <Text style={styles.chartNote}>
        Line chart requires react-native-svg for full implementation
      </Text>
      {/* Simplified dot representation */}
      <View style={styles.dotsContainer}>
        {data.map((point, index) => (
          <View key={index} style={styles.dotColumn}>
            <View
              style={[
                styles.dot,
                {
                  marginTop: height - 80 - (point.y / maxValue) * (height - 80),
                },
              ]}
            />
            <Text style={styles.dotLabel}>{point.x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  fallback: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },

  // Simple chart styles
  simpleChart: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    minHeight: 100,
  },
  bar: {
    width: '100%',
    minHeight: 4,
    borderRadius: theme.borderRadius.sm,
  },
  barLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  barValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    marginTop: theme.spacing.xs,
  },
  chartNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  dotColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  dotLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
});