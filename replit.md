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

## Recent Changes (Jan 04, 2026)
**HeyGen AI Avatar Integration - v1.0.10 (31) Build 23 - Session State Reset Fix**: Fixed issue where avatar only worked in the first session, but subsequent sessions showed no avatar responses:
- **ROOT CAUSE**: State flags (`listeningStarted`, `startListeningSentRef`, `micTrackPublished`) were not being reset when starting a new session, causing the initial `avatar.start_listening` command to be blocked by stale guards
- **FIX**: Added `wasConnectedRef` to detect new session connection (transition from disconnected → connected) and reset all voice loop state
- **State Reset Logic**: When a new session connects, resets: `listeningStarted=false`, `startListeningSentRef=false`, `micTrackPublished=false`, `conversationTurnRef=0`
- **Telemetry Reset**: Also clears telemetry (`startListeningSent`, `trackPublished`, `allServerEvents`, `errors`) for clean slate each session
- **Moved conversationTurnRef**: Relocated to top of VoiceLoopController for proper scoping

## Previous Changes (Jan 03, 2026)
**HeyGen AI Avatar Integration - v1.0.10 (30) Build 22 - Multi-Turn Conversation Fix**: Fixed issue where avatar only responded once and then stopped:
- **ROOT CAUSE**: In FULL mode, the avatar stops listening after speaking. We were only sending `start_listening` once at session start, so subsequent utterances were never processed.
- **FIX**: After receiving `avatar.speak_ended` event, automatically re-send `avatar.start_listening` command to re-arm listening mode for the next conversational turn
- **Conversation Turn Tracking**: Added `conversationTurnRef` to track turn count for telemetry
- **Reusable sendStartListeningCommand**: Extracted into a callback that can be called both at startup and after each avatar response
- **Telemetry Enhancement**: Server Events now show `start_listening (turn N)` for each re-arm

**Previous Build 21**: Fixed command format (`event_type` + `agent-control` topic), made debug panel scrollable

**Previous Build 20**: Added tap-to-copy for LiveKit URL/Token

## Previous Changes (Dec 18, 2025)
**HeyGen AI Avatar Integration - v1.0.10 (27) Build 19g - LiveKit Debug Info for meet.livekit.io Testing**: Added diagnostic info to help debug why HeyGen can't process audio despite successful transmission:
- **Key Finding**: Build 19f proved audio IS being transmitted (273K+ bytes, 1300+ packets sent) but HeyGen shows "unknown" events
- **LiveKit Info Section**: New debug panel section showing LiveKit URL and token for testing at meet.livekit.io
- **Participant Identity**: Shows the local participant identity assigned by LiveKit
- **Audio Codec**: Shows what codec the audio track is using
- **Server Events Log**: Shows last 5 server events received with timestamps (replaces single "Last Event")
- **LiveAvatar FULL Mode Research**: According to LiveAvatar docs, voice chat should work automatically once you join the LiveKit room - no special STT config needed server-side
- **Next Step**: User can copy LiveKit URL/token from debug panel to test at meet.livekit.io - if voice works there but not iOS, confirms iOS-specific issue

**Previous Build 19f - Force Mic Re-Enable + Audio Stats**: Fixed audio transmission issue where LiveKit publishes track but doesn't start sending:
- **Root Cause Found**: Build 19e telemetry showed MediaStream.active=YES, readyState=live, but track.isStarted/isEnabled were undefined - meaning LiveKit published the track but never started transmitting
- **Fix Applied**: Force `setMicrophoneEnabled(true)` AFTER track publication is detected to kick-start audio transmission
- **Re-Enable in Both Paths**: Applied in LocalTrackPublished handler AND 5-second fallback timer
- **New Telemetry - Mic Re-Enabled**: Shows if the force re-enable was successful with timestamp
- **New Telemetry - Mic Level Meter**: Real-time audio amplitude (0.00 → 0.4 when speaking) using AudioContext/AnalyserNode
- **New Telemetry - Outbound Audio Stats**: Shows bytesSent and packetsSent from RTCPeerConnection stats to confirm actual transmission
- **Debug Panel Updated**: New "Audio Stats" section showing Mic Level, Bytes Sent, Packets Sent

**Previous Build 19e - Audio Capture Telemetry**:
- Added deep inspection of LocalAudioTrack capture state
- New telemetry: trackStarted, trackEnabled, mediaStreamActive, mediaTrackReadyState
- Revealed that WebRTC capture was working but LiveKit wasn't transmitting

**Previous Build 19d - Data Channel Fix**:
- Replaced `engine.connected` check with actual data channel readyState polling
- Polls every 250ms for up to 5 seconds waiting for data channel to open
- Only sends start_listening when data channel is confirmed open

## Previous Changes (Dec 17, 2025)
**HeyGen AI Avatar Integration - v1.0.10 (23) Build 19c - UI Debug Telemetry**: Added UI-visible debugging for microphone voice loop issues:
- **Problem**: Avatar cannot hear user despite previous fixes - no way to see logs on TestFlight builds
- **Build 19c Features**:
  1. **DebugPanel component**: Shows real-time telemetry directly on screen
  2. **Timestamps for each step**: AudioSession, Permission, Mic Enable, Track Published, start_listening
  3. **Status indicators**: Checkmarks/X marks for success/failure at each step
  4. **5-second fallback timer**: If LocalTrackPublished event doesn't fire, checks for audio tracks via fallback
  5. **Audio track details**: Shows track count, muted state, and track SID
  6. **Data channel state**: Shows engine connection status before sending command
  7. **Server events**: Displays last received event from HeyGen
  8. **Error log**: Shows last 3 errors in the debug panel
- **Expected Debug Output**: All green checkmarks if mic is working, yellow fallback warning if event didn't fire, red X and error messages if something failed
- **Duplicate Send Prevention**: Added `startListeningSentRef` to prevent race conditions causing multiple start_listening commands
- **Fallback Timer Cleanup**: Timer now properly clears after fallback path succeeds

**Previous Build 19b**: AudioSession → Permissions → Enable Mic → LocalTrackPublished event → send start_listening

**Previous Build 19 Features** (Context Injection):
- Added `buildSessionContext()` function to generate SESSION_CONTEXT JSON
- Context includes: language, level, course, lesson, review phrases
- Added `session_context` field to API request body
- Updated `context_id` to: `36b81552-35ee-40ea-b008-d84cb5ca882c`

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