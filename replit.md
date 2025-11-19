# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that facilitates language learning through micro-lessons. It supports multi-language learning (Italian, Spanish, German, French), adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to deliver a unified learning experience across iOS, Android, and Web platforms, with a vision to integrate AI-powered language partners in the near future.

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
- **Course Intro Videos**: Language-aware intro video logic that dynamically fetches or skips intro videos based on the selected language and backend availability, preventing display of incorrect language content.
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