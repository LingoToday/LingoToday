import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Temporary placeholder screens for burger menu items
const AboutScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>About LingoToday</Text>
    <Text style={styles.placeholderSubtext}>Learn more about our mission and approach</Text>
  </View>
);

const HelpScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Help & FAQ</Text>
    <Text style={styles.placeholderSubtext}>Find answers to common questions</Text>
  </View>
);

const TermsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Terms & Privacy</Text>
    <Text style={styles.placeholderSubtext}>Review our terms and privacy policy</Text>
  </View>
);

// Custom drawer content
const CustomDrawerContent = ({ navigation }: any) => (
  <View style={styles.drawerContainer}>
    <View style={styles.drawerHeader}>
      <Text style={styles.drawerTitle}>LingoToday</Text>
    </View>
    
    <View style={styles.drawerSection}>
      <Text style={styles.drawerSectionTitle}>About Us</Text>
      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('About')}>
        <Text style={styles.drawerItemText}>Our Mission</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Learning Approach</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Contact Us</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.drawerSection}>
      <Text style={styles.drawerSectionTitle}>Help & Support</Text>
      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('Help')}>
        <Text style={styles.drawerItemText}>FAQ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Support</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.drawerSection}>
      <Text style={styles.drawerSectionTitle}>Legal</Text>
      <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('Terms')}>
        <Text style={styles.drawerItemText}>Terms of Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemText}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Main tab navigator for authenticated users
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#6b7280',
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={[styles.tabIcon, { color }]}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={[styles.tabIcon, { color }]}>👤</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

// Drawer navigator that includes the tabs and burger menu items
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={CustomDrawerContent}
    screenOptions={{
      headerShown: true,
      headerStyle: styles.header,
      headerTintColor: '#fff',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Drawer.Screen name="Main" component={MainTabs} options={{ title: 'LingoToday' }} />
    <Drawer.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    <Drawer.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
    <Drawer.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms' }} />
  </Drawer.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <DrawerNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
  },
  tabIcon: {
    fontSize: 20,
  },
  header: {
    backgroundColor: '#3b82f6',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  drawerContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});