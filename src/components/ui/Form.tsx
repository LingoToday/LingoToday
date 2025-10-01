import React, { createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

interface FormContextValue {
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

const FormContext = createContext<FormContextValue>({});

interface FormProps {
  children: React.ReactNode;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  style?: ViewStyle;
}

export function Form({ children, errors = {}, touched = {}, style }: FormProps) {
  return (
    <FormContext.Provider value={{ errors, touched }}>
      <View style={[styles.form, style]}>
        {children}
      </View>
    </FormContext.Provider>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  name: string;
  style?: ViewStyle;
}

export function FormField({ children, name, style }: FormFieldProps) {
  const { errors, touched } = useContext(FormContext);
  const error = errors?.[name];
  const isTouched = touched?.[name];
  const showError = error && isTouched;

  return (
    <View style={[styles.formField, style]}>
      {children}
      {showError && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  style?: TextStyle;
}

export function FormLabel({ children, required = false, style }: FormLabelProps) {
  return (
    <Text style={[styles.formLabel, style]}>
      {children}
      {required && <Text style={styles.requiredIndicator}> *</Text>}
    </Text>
  );
}

interface FormDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function FormDescription({ children, style }: FormDescriptionProps) {
  return (
    <Text style={[styles.formDescription, style]}>
      {children}
    </Text>
  );
}

interface FormMessageProps {
  children: React.ReactNode;
  type?: 'error' | 'success' | 'info';
  style?: TextStyle;
}

export function FormMessage({ 
  children, 
  type = 'error', 
  style 
}: FormMessageProps) {
  const typeStyles = {
    error: styles.formMessageError,
    success: styles.formMessageSuccess,
    info: styles.formMessageInfo,
  };

  return (
    <Text 
      style={[
        styles.formMessage, 
        typeStyles[type],
        style
      ]}
    >
      {children}
    </Text>
  );
}

// Hook to access form context
export function useFormField(name: string) {
  const { errors, touched } = useContext(FormContext);
  
  return {
    error: errors?.[name],
    isTouched: touched?.[name],
    hasError: Boolean(errors?.[name] && touched?.[name]),
  };
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },

  formField: {
    gap: theme.spacing.sm,
  },

  formLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  requiredIndicator: {
    color: theme.colors.destructive,
  },

  formDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: theme.fontSize.sm * 1.4,
  },

  formMessage: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
    marginTop: theme.spacing.xs,
  },

  formMessageError: {
    color: theme.colors.destructive,
  },

  formMessageSuccess: {
    color: theme.colors.success500,
  },

  formMessageInfo: {
    color: theme.colors.primary,
  },

  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.destructive,
    marginTop: theme.spacing.xs,
  },
});