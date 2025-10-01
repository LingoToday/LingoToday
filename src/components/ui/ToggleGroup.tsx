import React, { useState, createContext, useContext } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { Toggle } from './Toggle';
import { theme } from '../../lib/theme';

type ToggleGroupType = 'single' | 'multiple';
type ToggleVariant = 'default' | 'outline';
type ToggleSize = 'default' | 'sm' | 'lg';

interface ToggleGroupContextValue {
  variant?: ToggleVariant;
  size?: ToggleSize;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: 'default',
  variant: 'default',
});

interface ToggleGroupProps {
  children: React.ReactNode;
  type?: ToggleGroupType;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ToggleGroup({
  children,
  type = 'single',
  value: controlledValue,
  onValueChange,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
}: ToggleGroupProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    type === 'multiple' ? [] : ''
  );

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = (itemValue: string, pressed: boolean) => {
    if (disabled) return;

    let newValue: string | string[];

    if (type === 'multiple') {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (pressed) {
        newValue = [...currentArray, itemValue];
      } else {
        newValue = currentArray.filter(v => v !== itemValue);
      }
    } else {
      newValue = pressed ? itemValue : '';
    }

    if (!isControlled) {
      setInternalValue(newValue);
    }

    onValueChange?.(newValue);
  };

  const isItemPressed = (itemValue: string): boolean => {
    if (type === 'multiple') {
      return Array.isArray(currentValue) && currentValue.includes(itemValue);
    } else {
      return currentValue === itemValue;
    }
  };

  return (
    <ToggleGroupContext.Provider value={{ variant, size }}>
      <View style={[styles.toggleGroup, style]}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ToggleGroupItemProps>(child) && child.type === ToggleGroupItem) {
            const childProps = child.props;
            return React.cloneElement(child, {
              ...childProps,
              pressed: isItemPressed(childProps.value),
              onPressedChange: (pressed: boolean) => 
                handleValueChange(childProps.value, pressed),
              disabled: disabled || childProps.disabled,
            });
          }
          return child;
        })}
      </View>
    </ToggleGroupContext.Provider>
  );
}

interface ToggleGroupItemProps {
  children: React.ReactNode;
  value: string;
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  style?: ViewStyle;
}

export function ToggleGroupItem({
  children,
  value,
  variant: itemVariant,
  size: itemSize,
  disabled = false,
  pressed,
  onPressedChange,
  style,
}: ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext);

  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      variant={context.variant || itemVariant}
      size={context.size || itemSize}
      disabled={disabled}
      style={style}
    >
      {children}
    </Toggle>
  );
}

const styles = StyleSheet.create({
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
});