import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export interface FooterProps {
  style?: any;
}

export const Footer: React.FC<FooterProps> = ({ style }) => {
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

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

  const navigateToScreen = (screenName: string) => {
    try {
      navigation.navigate(screenName as never);
    } catch (error) {
      console.warn(`Navigation to ${screenName} failed:`, error);
    }
  };

  return (
    <View style={[styles.footer, style]}>
      <View style={styles.container}>
        <View style={styles.grid}>
          {/* Brand Section - matching web exactly */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="globe" size={16} color="#ffffff" />
              </View>
              <Text style={styles.logoText}>LingoToday</Text>
            </View>
            
            <Text style={styles.brandDescription}>
              Learn languages without leaving your desk. Short, well-timed prompts for busy professionals.
            </Text>
            
            <View style={styles.contactContainer}>
              <Text style={styles.contactLabel}>Contact us: </Text>
              <TouchableOpacity onPress={handleEmailPress}>
                <Text style={styles.contactLink}>hello@lingotoday.co</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About Us Section - using correct screen names */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Us</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity onPress={() => navigateToScreen('Courses')}>
                <Text style={styles.link}>Courses</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToScreen('Mission')}>
                <Text style={styles.link}>Mission</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToScreen('Approach')}>
                <Text style={styles.link}>Approach</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToScreen('Contact')}>
                <Text style={styles.link}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help and Support Section - using correct screen names */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help and Support</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity onPress={() => navigateToScreen('FAQ')}>
                <Text style={styles.link}>FAQs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy and Terms Section - using correct screen names */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy and Terms</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity onPress={() => navigateToScreen('Terms')}>
                <Text style={styles.link}>Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToScreen('Privacy')}>
                <Text style={styles.link}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Copyright Section - matching web exactly */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © {currentYear} LingoToday. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
};

// Keep the additional components for backward compatibility
export interface FooterLinkProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const FooterLink: React.FC<FooterLinkProps> = ({
  children,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.link, style]}>{children}</Text>
    </TouchableOpacity>
  );
};

export interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
  style?: any;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#FFFFFF', // bg-white
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // border-gray-200
    marginTop: 64, // mt-16 = 64px
  },
  container: {
    maxWidth: 1280, // max-w-7xl
    alignSelf: 'center',
    paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
    paddingVertical: 48, // py-12 = 48px
    width: '100%',
  },
  grid: {
    // Mobile: single column, larger screens: 4 columns
    flexDirection: 'column',
    gap: 32, // gap-8 = 32px
    marginBottom: 32, // mb-8
  },
  
  // Brand Section - col-span-1
  brandSection: {
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // mb-4 = 16px
  },
  logoIcon: {
    width: 32, // w-8 = 32px
    height: 32, // h-8 = 32px
    backgroundColor: theme.colors.primary, // bg-primary
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // space-x-3 = 12px
  },
  logoText: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
  },
  brandDescription: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-600
    lineHeight: 20,
    marginBottom: 12, // mt-3 = 12px (converted to mb for better mobile layout)
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contactLabel: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-600
  },
  contactLink: {
    fontSize: 14, // text-sm
    color: theme.colors.primary, // text-primary
    textDecorationLine: 'underline', // hover:underline
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: '#111827', // text-gray-900
    marginBottom: 16, // mb-4 = 16px
  },
  sectionContent: {
    gap: 8, // space-y-2 = 8px
  },
  link: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-600
    lineHeight: 20,
    paddingVertical: 4, // For better touch targets on mobile
  },

  // Copyright Section
  copyrightSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // border-gray-200
    paddingTop: 32, // pt-8 = 32px
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
    textAlign: 'center',
  },
});