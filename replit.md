# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that facilitates language learning through micro-lessons. It supports multi-language learning (Italian, Spanish, German, French), adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to deliver a unified learning experience across iOS, Android, and Web platforms, with a vision to integrate AI-powered language partners in the near future.

## Recent Changes (Nov 19, 2025)
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