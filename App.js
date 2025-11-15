import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { SheetManagerProvider } from './src/contexts/SheetManagerContext';

let splashPrevented;
if (!splashPrevented) {
  splashPrevented = SplashScreen.preventAutoHideAsync().catch((error) => {
    console.warn('SplashScreen.preventAutoHideAsync error:', error);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    async function hideSplash() {
      if (!isLoading) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('SplashScreen.hideAsync error:', error);
        }
      }
    }
    hideSplash();
  }, [isLoading]);

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('SplashScreen.hideAsync error:', error);
      }
    }
  }, [isLoading]);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {!isLoading && <AppNavigator isAuthenticated={isAuthenticated} user={user} />}
    </View>
  );
}

export default function App() {
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
