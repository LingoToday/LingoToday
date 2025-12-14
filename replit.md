# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that facilitates language learning through micro-lessons. It supports multi-language learning (Italian, Spanish, German, French), adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to deliver a unified learning experience across iOS, Android, and Web platforms, with a vision to integrate AI-powered language partners in the near future.

## Recent Changes (Dec 14, 2025)
**HeyGen AI Avatar Integration - v1.0.10 Fixes**: Fixed SIGABRT crash by removing registerGlobals() call and adding defensive error handling for LiveKit module imports.

**HeyGen AI Avatar Integration - v1.0.9 Fixes**: Fixed native crash caused by response.headers.entries() in React Native. Removed incompatible headers logging.

**HeyGen AI Avatar Integration - v1.0.8 Fixes**: Enhanced API error handling and response parsing for LiveAvatar API:
- **API Key Validation**: Added pre-request validation for null, empty, and malformed API keys with user-friendly error messages
- **Robust Error Handling**: New `parseApiError()` function handles JSON error responses (message/error/detail fields) and HTTP status codes with clear, actionable user messages
- **Multi-Format Response Parsing**: `extractSessionData()` and `extractLiveKitData()` now handle multiple API response formats including:
  - Direct top-level fields (`session_id`, `session_token`)
  - Data-wrapped responses (`data.session_id`, `data.session_token`)
  - Legacy HeyGen streaming.new format (`session_id`, `access_token`, `url`)
- **Comprehensive Logging**: All API requests/responses logged with `[AIAvatar]` prefix for TestFlight debugging
- **User-Friendly Errors**: Specific messages for invalid API key, access denied, rate limiting, and server errors

**Previous HeyGen AI Avatar Integration**: Implemented interactive AI Avatar for Course Reviews using HeyGen's Streaming API with LiveKit for React Native:
- **AIAvatarScreen.tsx**: Full-screen modal with HeyGen session management (token creation, session creation, streaming start/stop)
- **LiveKit Integration**: Full two-way audio/video with remote avatar track rendering (VideoTrack + AudioTrack) and local microphone control
- **Session Timer**: 90-second soft warning and 120-second hard limit with auto-disconnect
- **Context-Aware Prompts**: Dynamic knowledge base prompt built from language, level, course title, lesson title, and review phrases
- **5-Tap Secret Gesture**: Hidden activation on top-right AI partner image in AIChatScreen to unlock feature for testing
- **Secure API Key Storage**: HeyGen API key stored securely via Expo SecureStore (no hardcoded keys)
- **Fallback UI**: Graceful degradation when LiveKit native modules aren't available (Expo Go)
- **Requirements**: Full functionality requires development build with native modules (`expo prebuild && expo run:ios/android`)

## Previous Changes (Nov 29, 2025)
**Authenticated Video Playback Fix - Complete Resolution**: Completely fixed AVPlayer -11829 error with comprehensive race condition solution:
- **tokenStatus Pattern**: Introduced `tokenStatus` state ('pending' | 'resolved') to track async token fetch completion independently from token presence
- **Three-State Rendering Logic**: All videos (intro, IRL, video_choice, pro_video) now follow strict gating pattern:
  - State 1: tokenStatus === 'pending' → Show loading spinner ("Preparing video...")
  - State 2: tokenStatus === 'resolved' && needsAuth && !authToken → Show authentication error with user guidance
  - State 3: tokenStatus === 'resolved' && (!needsAuth || authToken) → Render VideoPlayer with proper headers
- **Immediate Token Loading**: Auth token loads from AsyncStorage/SecureStore immediately on LessonScreenNew mount, not waiting for user object
- **Same-Origin Authentication Detection**: `isAuthenticatedVideo()` uses origin-based detection comparing video URL hostname with API base URL, ensuring ALL same-origin videos (including `/attached_assets/`, `/api/videos/`, and object storage) receive Authorization headers. Checks both original and preloaded URLs with graceful fallback handling.
- **Authorization Headers**: `getVideoSourceWithAuth()` attaches Bearer token to all authenticated video sources
- **Video Preload Service Fix**: Handles undefined language gracefully by checking both `user.selectedLanguage` and `settings.selectedLanguage`
- **Enhanced Error Handling**: VideoPlayer component provides detailed error logging and user-friendly error UI
- **Result**: Zero authenticated videos can mount without Authorization headers; AVPlayer -11829 error completely eliminated

**Level-Appropriate Lesson Content Fix**: Implemented explicit skill level parameter passing to ensure users receive content matching their registered skill level:
- Backend added authentication middleware to `/api/courses/` endpoint to read user's skill level from session
- Updated `apiClient.getLesson()` to accept optional `skillLevel` query parameter as mobile workaround
- Modified `LessonScreenNew` to pass user's `selectedLevel` when fetching lessons
- Added query dependency on `userData` to ensure user level loads before lesson fetch
- Enhanced logging to track requested skillLevel and returned content for debugging
- Expert users now correctly receive expert content ("Ayer hice...") instead of beginner content ("Hola")
- All skill levels (beginner, intermediate, expert) now receive appropriate video content

## Previous Changes (Nov 19, 2025)
**Video Loading Improvements**: Implemented comprehensive video loading enhancements to eliminate the blank screen issue when videos load:
- Created `VideoPlayer` component with loading states, spinners, and smooth fade-in transitions
- Enhanced `VideoPreloadService` to support web platform using link prefetch with automatic cleanup
- Integrated preloaded video consumption so users benefit from background caching
- Added intelligent video source selection that prioritizes cached videos over remote URLs
- Implemented web-specific prefetch strategy with deduplication and 60-second cleanup timeout

**Video Display Fixes**: Fixed videos to display in their natural portrait aspect ratio across all platforms:
- Updated `VideoPlayer` component to default to portrait aspect ratio (9/16 instead of 16/9)
- Added optional `aspectRatio` prop to VideoPlayer for future customization if needed
- All lesson videos (intro, IRL, video choice, pro video) now display in portrait format without letterboxing
- Videos properly fill their container height while maintaining natural portrait dimensions
- Changed video styling from fixed pixel width to responsive width (100% of container)
- Added `overflow: 'hidden'` to videoContainer to prevent content spillover

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### UI/UX Decisions
The application features a comprehensive dark mode theme with a lime green (#A3E635) accent color, ensuring WCAG AA compliant contrast ratios across all elements. Key UI/UX decisions include:
- **Consistent Theming**: Centralized color management in `src/lib/theme.ts` with no hardcoded hex values, covering all screens and components from login to lessons.
- **Dynamic Content Display**: Video choice and pro_video lesson steps now display relevant multiple-choice options from earlier quick_check quizzes for learner assistance, using `getQuickCheckData()` for data extraction and normalization.
- **Intuitive Navigation**: Minimal headers on main tab screens for immersive content, bottom tabs for primary navigation with active state highlighting, and platform-optimized spacing.
- **Accessible Interactions**: Selected onboarding options are indicated by a thicker lime green border, and subscription toggles use lime green for active states, maintaining readability and contrast.
- **Enhanced Lesson Experience**: Consistent lesson step headers with dynamic numbering, a prominent lime green progress bar, and styled quick check options with circular letter badges.

### Technical Implementations
- **Tech Stack**: React Native 0.81.4 with Expo SDK 54, React Native Web, React Navigation, React Query for state management, Context API with AsyncStorage for authentication, and TypeScript.
- **Splash Screen Management**: Robust synchronized splash screen handling prevents auto-hide issues on native platforms, ensuring a smooth loading experience.
- **API Configuration**: Utilizes `Constants.expoConfig.extra.apiBaseUrl` for consistent API endpoints, with production API being `https://lingotoday.replit.app`.
- **Course Intro Videos (Updated Nov 19, 2025)**: Language-aware intro video handling with proper language code mapping. The app uses a shared `LANGUAGE_CODES` constant to map between two-letter codes (it, es, de, fr) used by the backend API and full language names (italian, spanish, german, french) used internally. The `getLanguageCode()` helper converts full names to codes before calling `/api/external/courses/{languageCode}/beginner/{courseNumber}`. Fallback videos only exist for Italian; other languages skip the intro if the backend doesn't provide a video. **When adding new languages**: Update `LANGUAGE_CODES` in `LessonScreenNew.tsx`.
- **Video Content & Backend Integration**: All lesson video content is fetched from the backend API, with `normalizeAssetUrl()` handling asset routing and authentication for object storage URLs.
- **RevenueCat Integration**: Full integration for in-app purchases and subscription management, dynamically fetching package details and linking purchases to authenticated users. Backend webhooks update user `priceTier` upon successful transactions.
- **Metro Bundler Configuration**: Custom Metro configuration optimizes file watching by excluding `.cache` directories, resolving ENOSPC errors.
- **Backend-Driven Push Notification System**: Migrated from local to backend-orchestrated remote push notifications via Expo Push Notification Service for improved reliability. The mobile app registers/unregisters push tokens with the backend, which then schedules and sends notifications based on user preferences. Notification taps navigate directly to the specified lesson.

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

## External Dependencies
- **Expo SDK 54**: Core framework.
- **React Native Web**: Web platform compatibility.
- **React Navigation**: App navigation.
- **React Query**: State management.
- **RevenueCat**: In-app purchases and subscription management.
- **AsyncStorage**: Local data persistence and authentication token management.
- **expo-notifications**: Push notifications.
- **expo-web-browser**: In-app webview.
- **expo-video**: Modern video playback.
- **@livekit/react-native**: WebRTC streaming for AI Avatar (requires development build).
- **expo-secure-store**: Secure credential storage.