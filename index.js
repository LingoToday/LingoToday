import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { registerGlobals } from '@livekit/react-native';

import App from './App';

// Initialize WebRTC globals for LiveKit - must be called before any React components render
// This is required for LiveKit to work properly on React Native
registerGlobals();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
