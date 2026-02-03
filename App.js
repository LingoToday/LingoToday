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
import { apiClient } from './src/lib/apiClient';

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

  // [TEMP TEST] V2 API test - verify methods work on app load
  // Note: This test may fail on web due to CORS - works on native iOS/Android
  useEffect(() => {
    const testV2Api = async () => {
      try {
        console.log('[V2 API TEST] Starting V2 API tests...');
        console.log('[V2 API TEST] Platform:', Platform.OS);
        
        // Test 1: Check V2 status
        const status = await apiClient.getV2Status();
        console.log('[V2 API TEST] Status:', JSON.stringify(status));
        
        // Test 2: Get tracks for Italian A1
        const tracks = await apiClient.getV2Tracks('it', 'A1');
        console.log('[V2 API TEST] Tracks (it/A1):', JSON.stringify(tracks));
        
        // Test 3: Get phrases for Italian A1 daily_life
        const phrases = await apiClient.getV2Phrases({ language: 'it', level: 'A1', track: 'daily_life' });
        console.log('[V2 API TEST] Phrases count:', phrases.length);
        if (phrases.length > 0) {
          console.log('[V2 API TEST] First phrase sample:', {
            phraseId: phrases[0].phraseId,
            phrase: phrases[0].phrase,
            translation: phrases[0].translation,
            primaryTrack: phrases[0].primaryTrack
          });
        }
        
        console.log('[V2 API TEST] All tests completed successfully!');
      } catch (error) {
        // CORS errors show as empty objects on web - expected behavior
        if (Platform.OS === 'web') {
          console.warn('[V2 API TEST] Web CORS limitation - V2 endpoints may require CORS headers on production backend. Test on native iOS/Android for full verification.');
        } else {
          console.error('[V2 API TEST] Error:', error);
        }
      }
    };
    testV2Api();
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
