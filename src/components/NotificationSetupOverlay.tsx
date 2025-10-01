import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { theme } from '../lib/theme';

const { width, height } = Dimensions.get('window');

interface NotificationSetupOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function NotificationSetupOverlay({ 
  isVisible, 
  onClose 
}: NotificationSetupOverlayProps) {
  const [step, setStep] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    if (isVisible) {
      checkNotificationPermission();
      setStep(0); // Reset to first step when opening
    }
  }, [isVisible]);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermission(status);
    setNotificationsEnabled(status === 'granted');
  };

  // Simplified steps for mobile
  const steps = [
    {
      title: "Welcome to LingoToday!",
      content: "Get personalized language learning reminders to help you stay consistent with your Italian studies.",
      icon: "🎯"
    },
    {
      title: "Enable Notifications", 
      content: "Turn on gentle push notifications to receive lesson reminders throughout your day.",
      icon: "🔔"
    },
    {
      title: "You're All Set!",
      content: "Start your language learning journey with smart reminders and personalized lessons!",
      icon: "🚀"
    }
  ];

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status);
        setNotificationsEnabled(status === 'granted');
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        setNotificationsEnabled(false);
      }
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    console.log('👆 User skipped notification setup');
    onClose();
  };

  const handleComplete = () => {
    console.log('✅ User completed notification setup');
    onClose();
  };

  const getPermissionStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return '✓ Notifications enabled';
      case 'denied':
        return '⚠ Enable in device settings';
      default:
        return 'Tap toggle to enable';
    }
  };

  const getPermissionStatusColor = () => {
    switch (notificationPermission) {
      case 'granted':
        return '#059669';
      case 'denied':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={handleSkip}
          activeOpacity={1}
        />
        
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: index <= step 
                          ? theme.colors.primary 
                          : '#E5E7EB'
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.stepIcon}>{steps[step].icon}</Text>
              </View>
              
              {/* Title */}
              <Text style={styles.title}>
                {steps[step].title}
              </Text>
              
              {/* Description */}
              <Text style={styles.description}>
                {steps[step].content}
              </Text>

              {/* Notification Toggle - Show only on step 1 */}
              {step === 1 && (
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleHeader}>
                    <Text style={styles.toggleLabel}>Push Notifications</Text>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={handleNotificationToggle}
                    />
                  </View>
                  
                  <Text style={[styles.statusText, { color: getPermissionStatusColor() }]}>
                    {getPermissionStatusText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleNext}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>
                  {step === steps.length - 1 ? 'Get Started' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Modal Overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minHeight: 400,
    maxHeight: height * 0.75,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 32, // Account for close button
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  
  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
  },
  stepIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 16,
  },
  
  // Toggle Container
  toggleContainer: {
    width: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});