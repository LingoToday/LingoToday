# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that facilitates multi-language learning (Italian, Spanish, German, French) through micro-lessons. It features adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to deliver a unified learning experience across iOS, Android, and Web platforms, with a future vision for AI-powered language partners.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### UI/UX Decisions
The application utilizes a comprehensive dark mode theme with a lime green (#A3E635) accent color, ensuring WCAG AA compliant contrast. Key UI/UX decisions include centralized color management, dynamic content display for lesson steps (e.g., multiple-choice options from quizzes), intuitive navigation with minimal headers and bottom tabs, accessible interaction feedback (e.g., thicker borders for selected options), and enhanced lesson experiences with progress bars and styled quick check options.

### Technical Implementations
The app is built with React Native 0.81.4, Expo SDK 54, React Native Web, React Navigation, React Query for state management, Context API with AsyncStorage for authentication, and TypeScript.
Core features include:
- **Splash Screen Management**: Synchronized handling to ensure a smooth loading experience on native platforms.
- **API Configuration**: Uses `Constants.expoConfig.extra.apiBaseUrl` for consistent API endpoints, with `https://lingotoday.replit.app` as the production API.
- **Course Intro Videos**: Language-aware handling with `LANGUAGE_CODES` mapping for backend API integration and proper display.
- **Video Content & Backend Integration**: All lesson video content is fetched from the backend API, with `normalizeAssetUrl()` managing asset routing and authentication.
- **RevenueCat Integration**: Fully integrated for in-app purchases and subscription management, linking transactions to user `priceTier` via webhooks.
- **Metro Bundler Configuration**: Custom configuration optimizes file watching by excluding `.cache` directories to prevent ENOSPC errors.
- **Backend-Driven Push Notifications**: Migrated to backend-orchestrated remote push notifications via Expo Push Notification Service, allowing the mobile app to register/unregister push tokens with the backend for scheduled notifications.
- **AI Avatar Integration**: Uses HeyGen's Streaming API with LiveKit for an interactive AI Avatar, managing session creation, streaming, and two-way audio/video. It features context-aware prompts and secure API key storage.
- **Authenticated Video Playback**: Robust mechanism for loading authenticated videos with Authorization headers, including a `tokenStatus` pattern to manage asynchronous token fetching and a three-state rendering logic to prevent video mounting without proper authentication.
- **Level-Appropriate Lesson Content**: Ensures users receive content matching their registered skill level by passing `skillLevel` query parameters to the backend when fetching lessons.

### Project Structure
- `src/components/`: Reusable UI components.
- `src/screens/`: Screen components.
- `src/navigation/`: Navigation configuration.
- `src/contexts/`: React contexts (Auth, etc.).
- `src/hooks/`: Custom React hooks.
- `src/lib/`: Utilities and API client.
- `src/services/`: Services (Notifications, etc.).
- `src/data/`: Static data (lessons, etc.).
- `src/types/`: TypeScript type definitions.

## Recent Changes (Dec 17, 2025)
**HeyGen AI Avatar Integration - v1.0.10 (19) Build 18a - Direct Audio via Room Events**: Alternative approach to avoid useTracks crash:
- **Build 17b PASSED**: Data channel commands work without remote audio
- **Root Cause Confirmed**: `useTracks([Track.Source.Microphone])` causes Hermes SIGSEGV crash
- **Build 18a Strategy**: Use room events instead of useTracks for audio
  - Created `DirectAudioController` component using `trackSubscribed`/`trackUnsubscribed` events
  - Stores audio track in ref (not state) to prevent re-render loops
  - Only handles remote participant's audio tracks
  - **Log only for 18a**: No AudioTrack render yet, just logging track events
- **Test Goal**: Confirm room event listeners for audio tracks are stable
- **If Stable**: Build 18b will add AudioTrack rendering for stored track

## Previous Phase Results
- **Phase 1 PASSED (Build 13)**: Pure LiveKit room connection works
- **Phase 2 PASSED (Build 14)**: Remote video track subscription works
- **Phase 3 PASSED (Build 15)**: Local microphone publishing works
- **Phase 4 FAILED (Build 16)**: Full voice loop crashed (WebRTC SIGABRT in setLocalDescription)
- **Build 17a FAILED**: Remote audio subscription via useTracks crashed (Hermes SIGSEGV)
- **Build 17b PASSED**: Data channel commands work without remote audio

## Previous Changes (Dec 15, 2025)
**HeyGen AI Avatar Integration - v1.0.10 (12) Force Source Build Fix**: SDK 54's precompiled XCFrameworks ignore legacy arch flags:
- **Root Cause**: Build 11 still crashed because Expo SDK 54 uses precompiled React Native XCFrameworks that have New Architecture symbols baked in, ignoring `newArchEnabled: false`
- **Fix**: Added `buildReactNativeFromSource: true` to expo-build-properties to force React Native to compile from source instead of using precompiled binaries
- **Why This Works**: Source builds respect `RCT_NEW_ARCH_ENABLED=0` flag properly, ensuring TurboModules are actually disabled
- **Build 12 Configuration**: Source build + legacy arch env var + root-level newArchEnabled flag

**HeyGen AI Avatar Integration - v1.0.10 (10) Complete Architecture Fix**: Removed all remaining sources of native WebRTC crashes:
- **Removed useFrameworks: static**: Static framework linkage causes memory corruption with RN 0.81 TurboModules and WebRTC. LiveKit's Expo plugin doesn't require it.
- **Added EAS build env override**: Set `EXPO_USE_NEW_ARCH=0` in eas.json for preview and production profiles to force legacy architecture during EAS builds (Expo 54 defaults to New Arch)
- **Kept newArchEnabled: false**: Still at expo root level as a belt-and-suspenders approach
- **registerGlobals() verified**: Already correctly placed in index.js, called once before React renders
- **Build 10 Configuration**: Clean configuration with no static frameworks, explicit legacy arch, and correct LiveKit packages

## External Dependencies
- **Expo SDK 54**: Core framework.
- **React Native Web**: Web platform compatibility.
- **React Navigation**: App navigation.
- **React Query**: State management.
- **RevenueCat**: In-app purchases and subscription management.
- **AsyncStorage**: Local data persistence.
- **expo-notifications**: Push notifications.
- **expo-web-browser**: In-app webview.
- **expo-video**: Modern video playback.
- **@livekit/react-native**: WebRTC streaming for AI Avatar.
- **expo-secure-store**: Secure credential storage.