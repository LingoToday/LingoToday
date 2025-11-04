import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext'; // Import from AuthContext
import { useAuth } from './src/hooks/useAuth'; // Import from useAuth hook
import { SheetManagerProvider } from './src/contexts/SheetManagerContext';

// Background notification task name
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// Define the background task for handling notifications
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Background notification task error:', error);
    return;
  }
  if (data) {
    console.log('Background notification received:', data);
  }
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  
  return <AppNavigator isAuthenticated={isAuthenticated} user={user} />;
}

export default function App() {
  useEffect(() => {
    // Register for background notifications on app start
    const registerBackgroundTask = async () => {
      try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
        console.log('Background notification task registered');
      } catch (error) {
        console.error('Failed to register background notification task:', error);
      }
    };

    registerBackgroundTask();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SheetManagerProvider>
              <AppContent />
              <StatusBar style="auto" />
            </SheetManagerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
