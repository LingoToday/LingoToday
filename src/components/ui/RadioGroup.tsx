import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

interface RadioGroupItemProps {
  value: string;
  label: string;
  selected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function RadioGroup({
  value,
  onValueChange,
  options,
  disabled = false,
  style,
  itemStyle,
  labelStyle,
}: RadioGroupProps) {
  return (
    <View style={[styles.group, style]}>
      {options.map((option) => (
        <RadioGroupItem
          key={option.value}
          value={option.value}
          label={option.label}
          selected={value === option.value}
          onSelect={onValueChange}
          disabled={disabled}
          style={itemStyle}
          labelStyle={labelStyle}
        />
      ))}
    </View>
  );
}

export function RadioGroupItem({
  value,
  label,
  selected,
  onSelect,
  disabled = false,
  style,
  labelStyle,
}: RadioGroupItemProps) {
  const handlePress = () => {
    if (!disabled) {
      onSelect(value);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.radio,
          selected && styles.selectedRadio,
          disabled && styles.disabledRadio,
        ]}
      >
        {selected && (
          <View
            style={[
              styles.indicator,
              disabled && styles.disabledIndicator,
            ]}
          />
        )}
      </View>
      
      <Text
        style={[
          styles.label,
          disabled && styles.disabledLabel,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: theme.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: theme.colors.primary,
  },
  disabledRadio: {
    borderColor: theme.colors.mutedForeground,
    opacity: 0.5,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  disabledIndicator: {
    backgroundColor: theme.colors.mutedForeground,
  },
  label: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  disabledLabel: {
    color: theme.colors.mutedForeground,
    opacity: 0.5,
  },
});