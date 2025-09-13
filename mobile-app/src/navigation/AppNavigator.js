import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CoursesScreen from '../screens/CoursesScreen';
import AccountScreen from '../screens/AccountScreen';
import ProgressScreen from '../screens/ProgressScreen';
import LessonScreen from '../screens/LessonScreen';
import CheckpointScreen from '../screens/CheckpointScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icons
const TabIcon = ({ name, focused }) => {
  const getIcon = () => {
    switch (name) {
      case 'Dashboard':
        return focused ? '🏠' : '🏠';
      case 'Courses':
        return focused ? '📚' : '📚';
      case 'Progress':
        return focused ? '📊' : '📊';
      case 'Account':
        return focused ? '👤' : '👤';
      default:
        return '📱';
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24 }}>{getIcon()}</Text>
      <Text style={{ 
        fontSize: 12, 
        color: focused ? '#3b82f6' : '#6b7280',
        marginTop: 2
      }}>
        {name}
      </Text>
    </View>
  );
};

// Main Tab Navigator for authenticated users
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
      />
      <Tab.Screen 
        name="Courses" 
        component={CoursesScreen}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator for unauthenticated users
function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator({ isAuthenticated, user }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth screens for unauthenticated users
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        ) : !user?.completedOnboarding ? (
          // Onboarding for new users
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Main app screens for authenticated users
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="Checkpoint" 
              component={CheckpointScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}