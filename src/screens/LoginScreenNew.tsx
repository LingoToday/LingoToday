import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme, scaleFontSize } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  const { login } = authContext || {};
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error and general error when user starts typing
    if (loginErrors[field] || loginErrors.general) {
      setLoginErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[field]) delete newErrors[field];
        if (newErrors.general) delete newErrors.general;
        return newErrors;
      });
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setLoginErrors({});
    
    // Validation
    const errors: Record<string, string> = {};
    if (!loginData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errors.email = 'Please enter a valid email';
    if (!loginData.password) errors.password = 'Password is required';
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    if (!login) {
      setLoginErrors({ general: 'Authentication service not available' });
      return;
    }

    setIsLoggingIn(true);
    
    try {
      await login(loginData.email.trim(), loginData.password);
      // If we get here without an error, login was successful
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract and normalize error message from various error formats
      let errorMessage: string;
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error?.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = 'Login failed. Please check your credentials and try again.';
      }
      
      // Check if this is a network connectivity error
      if (errorMessage.includes('Network connection failed') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      // Set the error message to display to user
      console.log('Setting login error message:', errorMessage);
      setLoginErrors({ general: errorMessage });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section - Matching web exactly */}
          <View style={styles.headerSection}>
            <TouchableOpacity 
              onPress={() => (navigation as any).navigate('Landing')} 
              style={styles.logoContainer}
            >
              <View style={styles.logoIcon}>
                <Ionicons name="globe" size={18} color={theme.colors.primaryForeground} />
              </View>
              <Text style={styles.logoText}>LingoToday</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Sign in to your account</Text>
            
            <View style={styles.headerSubtitle}>
              <Text style={styles.subtitleText}>Or </Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('Onboarding')}>
                <Text style={styles.linkText}>start your free trial</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form Card - Matching web exactly */}
          <View style={styles.formSection}>
            <Card style={styles.formCard}>
              <CardContent style={styles.cardContent}>
                {/* Welcome Header */}
                <View style={styles.welcomeHeader}>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                </View>

                {/* General Error Alert */}
                {loginErrors.general && (
                  <View style={styles.errorAlert}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.destructive} />
                    <Text style={styles.errorText}>{loginErrors.general}</Text>
                  </View>
                )}

                {/* Form Fields */}
                <View style={styles.formFields}>
                  {/* Email Field */}
                  <View style={styles.fieldContainer}>
                    <Label style={styles.fieldLabel}>Email Address</Label>
                    <View style={styles.inputContainer}>
                      <Ionicons 
                        name="mail-outline" 
                        size={16} 
                        color={theme.colors.mutedForeground} 
                        style={styles.inputIcon} 
                      />
                      <Input
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                          styles.input,
                          styles.inputOverrides, // Additional overrides for Input component
                          loginErrors.email && styles.inputError
                        ]}
                      />
                    </View>
                    {loginErrors.email && (
                      <Text style={styles.fieldError}>{loginErrors.email}</Text>
                    )}
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldContainer}>
                    <Label style={styles.fieldLabel}>Password</Label>
                    <View style={styles.inputContainer}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={16} 
                        color={theme.colors.mutedForeground} 
                        style={styles.inputIcon} 
                      />
                      <Input
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry
                        style={[
                          styles.input,
                          styles.inputOverrides, // Additional overrides for Input component
                          loginErrors.password && styles.inputError
                        ]}
                      />
                    </View>
                    {loginErrors.password && (
                      <Text style={styles.fieldError}>{loginErrors.password}</Text>
                    )}
                  </View>

                  {/* Forgot Password */}
                  <View style={styles.forgotPasswordContainer}>
                    <TouchableOpacity>
                      <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign In Button */}
                  <Button
                    title={isLoggingIn ? 'Signing In...' : 'Sign In'}
                    onPress={handleLogin}
                    disabled={isLoggingIn}
                    style={styles.signInButton}
                  />
                </View>
              </CardContent>
            </Card>

            {/* Bottom Link */}
            <View style={styles.bottomSection}>
              <Text style={styles.bottomText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('Onboarding')}>
                <Text style={styles.bottomLink}>Start your free trial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  // Header Section - Matching web exactly
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: 384, // sm:max-w-md
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  headerTitle: {
    fontSize: scaleFontSize(30),
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleText: {
    fontSize: scaleFontSize(14),
    color: theme.colors.mutedForeground,
  },
  linkText: {
    fontSize: scaleFontSize(14),
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Form Section - Matching web exactly
  formSection: {
    maxWidth: 384, // sm:max-w-md
    alignSelf: 'center',
    width: '100%',
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 0,
  },
  cardContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '500',
    color: theme.colors.foreground,
    marginBottom: 16,
  },

  // Error Alert
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    color: theme.colors.onErrorContainer,
  },

  // Form Fields
  formFields: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: scaleFontSize(14),
    fontWeight: '500',
    color: theme.colors.foreground,
    marginBottom: 6,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 10, // Adjusted for compact height (40px - 16px icon / 2 = 10px)
    zIndex: 1,
  },
  input: {
    paddingLeft: 40, // Space for icon
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: 6,
    padding: 12,
    fontSize: scaleFontSize(16),
    backgroundColor: theme.colors.background,
    height: 40, // Match web h-10 (40px)
    marginBottom: 0, // Remove default margin from Input component
  },
  inputOverrides: {
    // Override Input component's internal styles
    height: 40,
    borderRadius: 6,
    marginBottom: 0,
  },
  inputError: {
    borderColor: theme.colors.destructive,
  },
  fieldError: {
    fontSize: scaleFontSize(14),
    color: theme.colors.destructive,
    marginTop: 4,
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: scaleFontSize(14),
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Sign In Button
  signInButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 8,
  },

  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomText: {
    fontSize: scaleFontSize(14),
    color: theme.colors.mutedForeground,
  },
  bottomLink: {
    fontSize: scaleFontSize(14),
    fontWeight: '500',
    color: theme.colors.primary,
  },
});