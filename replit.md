# LingoToday Mobile App

## Overview
LingoToday is a cross-platform React Native mobile application built with Expo SDK 54, designed to facilitate language learning through micro-lessons. It supports multiple languages (Italian, Spanish, German, French), offers adaptive learning paths, user onboarding, course management, and progress tracking. The application also includes subscription management and aims to provide a consistent learning experience across iOS, Android, and Web platforms. A future AI Chat feature with an AI language partner is planned.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### Tech Stack
- **Framework**: React Native 0.81.4 with Expo SDK 54, TypeScript
- **UI**: React Native Web (for web), shadcn-style UI components
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **State Management**: React Query
- **Authentication**: Context API with AsyncStorage
- **Payments**: RevenueCat (Apple IAP & Google Play Billing)

### Key Features
- Multi-language learning with adaptive levels
- Comprehensive user onboarding and course management
- Progress tracking and subscription management
- Cross-platform support (iOS, Android, Web)
- Backend-driven push notifications for reliable delivery and scheduling
- Upcoming AI Chat feature with interactive language partners

### UI/UX Decisions
- **Dark Mode Theme**: Full dark mode implementation with lime green (#A3E635) as the primary accent color. Features dark backgrounds, colorful gradient stat cards, and accessible contrast ratios across all elements. All colors are centralized in `src/lib/theme.ts`.
- **Lesson Enhancements**:
    - `video_choice` and `pro_video` lesson steps now display multiple-choice options from earlier quick-check quizzes for reference, using a memoized `getQuickCheckData()` helper.
    - Consistent header styling across lesson steps with dynamic numbering and a lime green progress bar.
    - Quick Check styling includes circular letter badges for options and a lime green submit button.
- **Navigation**: Minimal headers on main tab screens for edge-to-edge content, with bottom tabs for primary navigation featuring active tab highlighting.
- **Accessibility**: WCAG AA compliant contrast for text and interactive elements.
- **Theming**: Consistent dark card backgrounds and lime green accents for selection states and subscription toggles, ensuring readability and contrast.

### Technical Implementations
- **Splash Screen Management**: Synchronized splash screen handling using `SplashScreen.preventAutoHideAsync()` and `hideAsync()` to prevent issues on iOS/Android, with web platform bypassing this logic.
- **API Configuration**: Uses `Constants.expoConfig.extra.apiBaseUrl` for consistent API endpoints, with a production URL of `https://lingotoday.replit.app`.
- **EAS Updates**: The `expo-updates` package was removed (Nov 17, 2025) to resolve iOS build compilation errors related to SDK 54 native code incompatibilities. The app currently does not support over-the-air updates and requires full App Store submissions for all updates. OTA update capability can be restored later by regenerating the `ios/` directory with `expo prebuild --clean` and reinstalling `expo-updates`.
- **Video Content & Backend Integration**: All lesson video content is fetched from the backend API, with `normalizeAssetUrl()` handling asset transformation and routing via a `/api/videos/*` streaming endpoint for authenticated access.
- **RevenueCat Integration**: Full integration for in-app purchases and subscription management. Dynamically fetches subscription packages, handles native IAP, and links purchases to authenticated users via `purchaseService`. Backend webhooks update user `priceTier` (e.g., 'pro-monthly', 'free-trial').
- **Metro Bundler Configuration**: Custom Metro configuration excludes `.cache` directories from file watching (`resolver.blockList`) to prevent ENOSPC errors.
- **API Client**: `src/lib/apiClient.ts` manages authentication, HTTP requests, and token management with AsyncStorage.
- **Notification System (Backend-Driven)**: Migrated from local scheduling to backend-orchestrated remote push notifications via Expo Push Notification Service. Mobile app registers/unregisters Expo push tokens with the backend. Notification preferences are synced to the backend, which handles scheduling and delivery. Notification tap handling in `AppNavigator.tsx` navigates to specific lessons. Onboarding integrates notification permission requests, and `NotificationSettings.tsx` manages user preferences.

## External Dependencies
- **Expo SDK 54**: Core framework.
- **React Native Web**: For web compatibility.
- **React Navigation**: Navigation library.
- **React Query**: State management.
- **RevenueCat**: In-app purchases and subscription management.
- **AsyncStorage**: Local data persistence.
- **expo-notifications**: Push notification handling.
- **expo-web-browser**: For opening web links.
- **expo-video**: For modern video playback.