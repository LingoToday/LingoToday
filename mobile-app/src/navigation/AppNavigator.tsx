import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreenNew from '../screens/LoginScreenNew';
import OnboardingScreenNew from '../screens/OnboardingScreenNew';
import DashboardScreenNew from '../screens/DashboardScreenNew';
import CoursesScreenNew from '../screens/CoursesScreenNew';
import AccountScreenNew from '../screens/AccountScreenNew';
import ProgressScreenNew from '../screens/ProgressScreenNew';
import LessonScreenNew from '../screens/LessonScreenNew';
import CheckpointScreen from '../screens/CheckpointScreen';
import SubscribeScreen from '../screens/SubscribeScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ContactScreen from '../screens/ContactScreen';
import MissionScreen from '../screens/MissionScreen';
import ApproachScreen from '../screens/ApproachScreen';
import FAQScreen from '../screens/FAQScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import DesktopScreen from '../screens/DesktopScreen';
import AdminScreen from '../screens/AdminScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CourseManagerScreen from '../screens/CourseManagerScreen';
import CourseTestScreen from '../screens/CourseTestScreen';
import LessonExampleScreen from '../screens/LessonExampleScreen';

import { theme } from '../lib/theme';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  Account: undefined;
  Courses: { language?: string } | undefined; // Fixed: Made language optional and allowed undefined
  Progress: undefined;
  Lesson: { lessonId: string; language?: string; courseId?: string };
  Checkpoint: { courseId: string; checkpointId: string };
  Subscribe: undefined;
  Terms: undefined;
  Privacy: undefined;
  Contact: undefined;
  Mission: undefined;
  Approach: undefined;
  FAQ: undefined;
  NotFound: undefined;
  Desktop: undefined;
  Admin: undefined;
  Analytics: undefined;
  CourseManager: undefined;
  CourseTest: undefined;
  LessonExample: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();

// Sign-in Screen for unauthenticated users (matches client)
function SignInScreen() {
  return <LoginScreenNew />;
}

// Main App Navigator
interface AppNavigatorProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: {
    completedOnboarding?: boolean;
  } | null;
}

export default function AppNavigator({ isAuthenticated, isLoading, user }: AppNavigatorProps) {
  // Show loading screen during authentication check - matching web exactly
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Landing" 
            component={() => (
              <div style={{ 
                minHeight: '100vh', 
                backgroundColor: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    border: '4px solid #3b82f6', 
                    borderTop: '4px solid transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{ color: '#6b7280' }}>Loading...</p>
                </div>
              </div>
            )} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Unauthenticated flow - matches client exactly: Landing → Sign-in → Onboarding
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Desktop" component={DesktopScreen} />
            <Stack.Screen name="Login" component={SignInScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreenNew} />
            
            {/* Course screens - available for unauthenticated users */}
            <Stack.Screen name="Courses" component={CoursesScreenNew} />
            <Stack.Screen name="CourseTest" component={CourseTestScreen} />
            <Stack.Screen name="LessonExample" component={LessonExampleScreen} />
            
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreenNew}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="Checkpoint" 
              component={CheckpointScreen as any}
              options={{ presentation: 'modal' }}
            />
            
            {/* Static pages */}
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Mission" component={MissionScreen} />
            <Stack.Screen name="Approach" component={ApproachScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
          </>
        ) : (
          // Main app screens for authenticated users (Dashboard as home exactly like client)
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreenNew} />
            <Stack.Screen name="Account" component={AccountScreenNew} />
            <Stack.Screen name="Progress" component={ProgressScreenNew} />
            
            {/* Course screens - available for authenticated users too */}
            <Stack.Screen name="Courses" component={CoursesScreenNew} />
            <Stack.Screen name="CourseTest" component={CourseTestScreen} />
            <Stack.Screen name="LessonExample" component={LessonExampleScreen} />
            
            <Stack.Screen name="Desktop" component={DesktopScreen} />
            <Stack.Screen name="Subscribe" component={SubscribeScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="CourseManager" component={CourseManagerScreen} />
            
            <Stack.Screen 
              name="Lesson" 
              component={LessonScreenNew}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="Checkpoint" 
              component={CheckpointScreen as any}
              options={{ presentation: 'modal' }}
            />
            
            {/* Static pages */}
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Mission" component={MissionScreen} />
            <Stack.Screen name="Approach" component={ApproachScreen} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}