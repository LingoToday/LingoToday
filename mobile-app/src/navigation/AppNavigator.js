import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LessonScreen from '../screens/LessonScreen';

// Create navigators
const Tab = createBottomTabNavigator();

// Tab Icons
const TabIcon = ({ name, focused }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return focused ? '🏠' : '🏠';
      case 'Profile':
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

export default function AppNavigator({ user }) {
  return (
    <NavigationContainer>
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
          name="Home" 
          component={HomeScreen}
          initialParams={{ user }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          initialParams={{ user }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}