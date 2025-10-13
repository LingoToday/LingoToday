import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';

import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
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
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isVisible) {
      // Check current notification permission
      checkNotificationPermission();
      setStep(0); // Reset to first step when opening
    }
  }, [isVisible]);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermission(status);
    setNotificationsEnabled(status === 'granted');
  };

  // Steps matching web version exactly
  const steps = [
    {
      title: "Enable Notifications",
      content: "Turn on browser notifications to receive gentle reminders for your language lessons throughout the day.",
      icon: "notifications",
      iconColor: "#059669"
    },
    {
      title: "Set Your Schedule", 
      content: "Choose how often you'd like to be reminded and set your preferred learning hours that work with your daily routine.",
      icon: "time",
      iconColor: "#7C3AED"
    },
    {
      title: "Welcome to LingoToday!",
      content: "",
      icon: "play",
      iconColor: "#2563EB"
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
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getPermissionStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return '✓ Browser notifications are enabled';
      case 'denied':
        return '⚠ Browser notifications are blocked. Check your browser settings.';
      default:
        return 'Toggle to request browser notification permission';
    }
  };

  const getPermissionStatusColor = () => {
    switch (notificationPermission) {
      case 'granted':
        return '#059669';
      case 'denied':
        return '#DC2626';
      default:
        return '#1E40AF';
    }
  };

  const handleFAQPress = () => {
    Linking.openURL('https://linguotoday.com/faq');
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <TouchableOpacity 
        style={styles.overlay}
        onPress={handleSkip}
        activeOpacity={1}
      >
        <TouchableOpacity 
          style={[
            styles.container,
            step === 2 && styles.containerWide
          ]}
          activeOpacity={1}
        >
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* Show icon only if not the video step */}
              {step !== 2 && (
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={steps[step].icon as any} 
                    size={32} 
                    color={steps[step].iconColor} 
                  />
                </View>
              )}
              
              <CardTitle style={styles.cardTitle}>
                {steps[step].title}
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              {/* Show content text only if it's not empty (not the video step) */}
              {steps[step].content && (
                <Text style={styles.description}>
                  {steps[step].content}
                </Text>
              )}

              {/* Video - Show only on third step */}
              {step === 2 && (
                <View style={styles.videoContainer}>
                  <Video
                    ref={videoRef}
                    style={styles.video}
                    source={require(
                      '../attached_assets/copy_1EC8BCF0-0552-45EA-94D0-8EAACB53AF04_1757075689342.MOV'
                    )}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={step === 2}
                    isMuted={false}
                  />
                </View>
              )}

              {/* Enable Notifications Toggle - Show only on first step */}
              {step === 0 && (
                <View style={styles.notificationToggleContainer}>
                  <View style={styles.toggleHeader}>
                    <Text style={styles.toggleLabel}>Enable Notifications</Text>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={handleNotificationToggle}
                    />
                  </View>
                  
                  <Text style={[styles.permissionStatus, { color: getPermissionStatusColor() }]}>
                    {getPermissionStatusText()}
                  </Text>
                </View>
              )}

              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: index === step 
                          ? '#2563EB' 
                          : '#D1D5DB'
                      }
                    ]}
                  />
                ))}
              </View>

              {/* FAQ link - Show only on notification steps, not on video step */}
              {step !== 2 && (
                <View style={styles.faqSection}>
                  <Text style={styles.faqText}>
                    For more information on how to enable notifications, visit our FAQ page
                  </Text>
                  <TouchableOpacity 
                    onPress={handleFAQPress}
                    style={styles.faqButton}
                  >
                    <Text style={styles.faqButtonText}>FAQ Page</Text>
                    <Ionicons name="open-outline" size={12} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.skipButton}
                >
                  <Text style={styles.skipButtonText}>Skip Setup</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleNext}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {step === steps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 384, // max-w-md
  },
  containerWide: {
    maxWidth: 512, // max-w-lg for video step
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 24,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: 224, // w-56
    height: 320, // h-80
    borderRadius: 8,
  },
  notificationToggleContainer: {
    width: '100%',
    backgroundColor: '#EFF6FF', // blue-50
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE', // blue-200
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF', // blue-800
  },
  permissionStatus: {
    fontSize: 12,
    textAlign: 'left',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  faqSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  faqText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  faqButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    gap: 16,
    width: '100%',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});