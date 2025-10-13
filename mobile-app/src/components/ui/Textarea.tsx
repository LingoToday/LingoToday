import React from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface TextareaProps extends Omit<TextInputProps, 'style'> {
  style?: ViewStyle | TextStyle;
  rows?: number;
}

export function Textarea({ 
  style, 
  rows = 4, 
  multiline = true,
  textAlignVertical = 'top',
  ...props 
}: TextareaProps) {
  return (
    <TextInput
      style={[
        styles.textarea,
        { height: rows * 24 + theme.spacing.md * 2 },
        style,
      ]}
      multiline={multiline}
      textAlignVertical={textAlignVertical}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    minHeight: 100,
  },
});