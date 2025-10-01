import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Footer } from '../components/ui/Footer';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Landing' as never);
    }
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link with form data - matching web exactly
      const mailtoLink = `mailto:hello@lingotoday.co?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      
      // Check if mailto is supported
      const canOpen = await Linking.canOpenURL(mailtoLink);
      if (canOpen) {
        await Linking.openURL(mailtoLink);
        
        // Show success message
        Alert.alert(
          'Email client opened',
          'Your default email client should open with the message pre-filled.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form - matching web behavior
                setFormData({ name: '', email: '', subject: '', message: '' });
              }
            }
          ]
        );
      } else {
        // Fallback if mailto not supported
        Alert.alert(
          'Email', 
          'Please contact us at: hello@lingotoday.co\n\nOr copy this message and send it manually:\n\n' +
          `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please contact us directly at hello@lingotoday.co');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPress = async () => {
    const email = 'hello@lingotoday.co';
    const url = `mailto:${email}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Email', `Please contact us at: ${email}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header - matching web sticky header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
        </View>

        {/* Contact Content - matching web layout exactly */}
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Contact Us</Text>
            <Text style={styles.pageDescription}>
              Have questions or feedback? We'd love to hear from you.
            </Text>
          </View>

          <View style={styles.contentGrid}>
            {/* Contact Information Card - matching web exactly */}
            <Card style={styles.infoCard}>
              <CardHeader>
                <CardTitle style={styles.cardTitle}>
                  <Ionicons name="mail" size={20} color="#6366f1" style={styles.cardIcon} />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent style={styles.cardContent}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Email Us</Text>
                  <Text style={styles.infoText}>
                    Send us an email and we'll get back to you as soon as possible.
                  </Text>
                  <TouchableOpacity onPress={handleEmailPress} style={styles.emailLink}>
                    <Ionicons name="mail" size={16} color="#6366f1" />
                    <Text style={styles.emailLinkText}>hello@lingotoday.co</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Support Hours</Text>
                  <Text style={styles.infoText}>
                    Monday - Friday: 9:00 AM - 6:00 PM (UTC)
                  </Text>
                  <Text style={styles.infoText}>
                    We aim to respond within 24 hours during business days.
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Contact Form Card - matching web exactly */}
            <Card style={styles.formCard}>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.form}>
                  {/* Name Field */}
                  <View style={styles.formField}>
                    <Label>Name</Label>
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      style={[styles.input, errors.name && styles.inputError]}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  {/* Email Field */}
                  <View style={styles.formField}>
                    <Label>Email</Label>
                    <Input
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, errors.email && styles.inputError]}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* Subject Field */}
                  <View style={styles.formField}>
                    <Label>Subject</Label>
                    <Input
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChangeText={(text) => handleInputChange('subject', text)}
                      style={[styles.input, errors.subject && styles.inputError]}
                    />
                    {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
                  </View>

                  {/* Message Field */}
                  <View style={styles.formField}>
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Tell us more about your question or feedback..."
                      value={formData.message}
                      onChangeText={(text) => handleInputChange('message', text)}
                      multiline
                      numberOfLines={5}
                      style={{
                        ...styles.textarea,
                        ...(errors.message && styles.inputError)
                      }}
                    />
                    {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
                  </View>

                  {/* Submit Button */}
                  <Button
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="send" size={16} color="#ffffff" style={styles.buttonIcon} />
                      <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  // Header - Matching TermsScreen exactly
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    padding: theme.spacing.sm,
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
  },

  // Content
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },

  // Page Header
  pageHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  pageTitle: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  pageDescription: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Content Grid
  contentGrid: {
    gap: theme.spacing.xxl,
  },

  // Cards
  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.lg,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.lg,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  cardIcon: {
    marginRight: theme.spacing.sm,
  },
  cardContent: {
    gap: theme.spacing.md,
  },

  // Info Section
  infoSection: {
    gap: theme.spacing.sm,
  },
  infoTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  emailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  emailLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: theme.spacing.md,
  },

  // Form
  form: {
    gap: theme.spacing.md,
  },
  formField: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    backgroundColor: '#ffffff',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    backgroundColor: '#ffffff',
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: '#EF4444',
    marginTop: 4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
});