# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that helps users learn languages through micro-lessons. The app provides multi-language learning (Italian, Spanish, German, French), adaptive learning levels, user onboarding, course management, progress tracking, and subscription management. It aims to offer a cross-platform learning experience on iOS, Android, and Web.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### Tech Stack
- **Framework**: React Native 0.81.4 with Expo SDK 54
- **UI Library**: React Native Web for web compatibility, shadcn-style UI components
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: Context API with AsyncStorage
- **Payments**: RevenueCat (Apple IAP & Google Play Billing)
- **Language**: TypeScript + JavaScript

### Key Features
- Multi-language learning
- Adaptive learning levels
- User onboarding flow
- Course management
- Progress tracking
- Push notifications (native only)
- Subscription management
- Cross-platform support (iOS, Android, Web)
- Automatic push notification scheduling based on user preferences (days, frequency, time window)

### UI/UX Decisions
- Minimal headers on main tab screens for edge-to-edge content.
- Bottom tabs for primary navigation with active tab highlighting.
- Platform-optimized spacing for navigation bars.
- Legal links consistently styled and opened in native webview.

### Technical Implementations
- Uses Expo Constants for environment variables (`apiBaseUrl`).
- RevenueCat integrated for in-app purchases and subscription management on native platforms.
- **Dynamic subscription offerings**: Subscription paywall (`IAPPurchaseForm` in onboarding flow) dynamically loads all available packages from RevenueCat's `Purchases.getOfferings()` API with pricing, trial periods, and product metadata - no hardcoded pricing.
- Custom Metro bundler configuration for video file extensions and asset aliases.
- API client in `src/lib/apiClient.ts` handles authentication, HTTP requests, and token management with AsyncStorage.
- Dynamic lesson step counting to support various lesson formats and report accurate progress.
- `SheetManagerProvider` to enforce a single-sheet policy for modals/sheets.
- Lessons use push navigation instead of modal presentation.

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
- **Expo SDK 54**: Core framework for React Native development.
- **React Native Web**: For web platform compatibility.
- **React Navigation**: For app navigation.
- **React Query**: For state management.
- **RevenueCat**: For in-app purchases (Apple In-App Purchase, Google Play Billing) and subscription management.
- **AsyncStorage**: For local data persistence and authentication token management.
- **expo-notifications**: For push notifications (native only).
- **expo-web-browser**: For opening web links in a native webview.
- **expo-video**: For modern video playback.