import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

// Initialize WebRTC globals for LiveKit - must be called before any React components render
// This is required for LiveKit to work properly on React Native
// Wrapped in try-catch to allow app to run in Expo Go (where native modules aren't available)
try {
  const { registerGlobals } = require('@livekit/react-native');
  registerGlobals();
  console.log('[LiveKit] WebRTC globals registered successfully');
} catch (error) {
  console.warn('[LiveKit] Could not initialize - native module not available (Expo Go mode). AI Avatar feature will be disabled.');
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
