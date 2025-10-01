import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

import { theme } from '../../lib/theme';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  mode?: 'single' | 'multiple' | 'range';
  disabled?: Date[];
  style?: ViewStyle;
}

export function Calendar({
  selected,
  onSelect,
  mode = 'single',
  disabled = [],
  style,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isDateDisabled = (date: Date) => {
    return disabled.some(disabledDate => 
      isSameDay(date, disabledDate)
    );
  };

  const isDateSelected = (date: Date) => {
    if (!selected) return false;
    return isSameDay(date, selected);
  };

  const handleDatePress = (date: Date) => {
    if (isDateDisabled(date)) return;
    onSelect?.(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const renderWeeks = () => {
    const weeks = [];
    const daysPerWeek = 7;
    
    for (let i = 0; i < days.length; i += daysPerWeek) {
      const week = days.slice(i, i + daysPerWeek);
      weeks.push(
        <View key={i} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isSelected = isDateSelected(day);
            const isDisabled = isDateDisabled(day);

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDay,
                  isToday && !isSelected && styles.todayDay,
                  isDisabled && styles.disabledDay,
                ]}
                onPress={() => handleDatePress(day)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.outsideMonthText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayDayText,
                    isDisabled && styles.disabledDayText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return weeks;
  };

  return (
    <View style={[styles.calendar, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={goToPreviousMonth}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={theme.colors.foreground} 
          />
        </TouchableOpacity>
        
        <Text style={styles.monthLabel}>
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={goToNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.foreground} 
          />
        </TouchableOpacity>
      </View>

      {/* Week days header */}
      <View style={styles.weekHeader}>
        {weekDays.map((weekDay) => (
          <View key={weekDay} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>
              {weekDay}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {renderWeeks()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  monthLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },

  // Week header
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  weekDayText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    color: theme.colors.mutedForeground,
  },

  // Grid
  grid: {
    gap: theme.spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },

  // Day cells
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
  },
  todayDay: {
    backgroundColor: theme.colors.accent,
  },
  disabledDay: {
    opacity: 0.3,
  },

  // Day text
  dayText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '400' as any,
    color: theme.colors.foreground,
  },
  outsideMonthText: {
    color: theme.colors.mutedForeground,
    opacity: 0.5,
  },
  selectedDayText: {
    color: theme.colors.primaryForeground,
    fontWeight: '600' as any,
  },
  todayDayText: {
    color: theme.colors.accentForeground,
    fontWeight: '600' as any,
  },
  disabledDayText: {
    color: theme.colors.mutedForeground,
  },
});