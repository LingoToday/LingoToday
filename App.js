import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { SheetManagerProvider } from './src/contexts/SheetManagerContext';

// Prevent splash from auto-hiding on native platforms
// Keep promise reference to synchronize with completion before calling hideAsync
const splashPromise = Platform.OS !== 'web' 
  ? SplashScreen.preventAutoHideAsync().catch(() => {})
  : Promise.resolve();

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
  const { isAuthenticated, user, isLoading } = useAuth();
  const [splashReady, setSplashReady] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const splashHiddenRef = useRef(false);
  
  // Wait for the splash promise to settle before proceeding
  useEffect(() => {
    splashPromise.then(() => setSplashReady(true));
  }, []);
  
  useEffect(() => {
    if (!isLoading && splashReady) {
      setAppIsReady(true);
    }
  }, [isLoading, splashReady]);
  
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && Platform.OS !== 'web' && !splashHiddenRef.current) {
      try {
        await SplashScreen.hideAsync();
        splashHiddenRef.current = true;
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
        // Don't set ref on error so we can retry
      }
    }
  }, [appIsReady]);
  
  // On web, render immediately without splash screen handling
  if (Platform.OS === 'web') {
    return <AppNavigator isAuthenticated={isAuthenticated} isLoading={isLoading} user={user} />;
  }
  
  // On native, wait for both splash and app to be ready before rendering
  if (!appIsReady) {
    return null;
  }
  
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppNavigator isAuthenticated={isAuthenticated} isLoading={isLoading} user={user} />
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
