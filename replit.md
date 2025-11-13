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
- **AI Chat (Coming Soon - Nov 2025)**: Teaser screen for upcoming AI language partner feature, showcasing 6 partner avatars in a responsive 3×2 grid layout (3 rows, 2 columns) within a card border. Accessible via center bottom tab with chatbubbles icon.

### UI/UX Decisions
- **Dark Mode Theme (Updated Nov 2025)**: Complete dark mode implementation across the entire app with lime green (#A3E635) primary accent color.
  - Dark backgrounds (#2B2D3A for main, #3A3C4A for cards)
  - Colorful gradient stat cards (lime green, indigo, purple) with white text for >6:1 contrast (WCAG AA compliant)
  - Lime green primary buttons and Pro badges
  - All colors centralized in `src/lib/theme.ts` with zero hardcoded hex values in components
  - Accessible contrast ratios across all text and interactive elements
  - **Comprehensive Screen Coverage**: All screens updated to use centralized theme references including LoginScreenNew, AIChatScreen, ProgressScreenNew, CoursesScreenNew, and MissionScreen. No light theme artifacts remain - all backgrounds, text colors, borders, and icon colors reference theme tokens.
  - **Learning Path Section**: Dark card background with white course titles, lime green progress indicators (1/17 format), distinct visual states for completed (olive green background), unlocked (gray), and locked (dark gray) courses, lime green "More" button, and dark course summary card with lime green stats
  - **Landing Screen**: Dark background (#2B2D3A), white logo and tagline text, dark video container, lime green "Join" button, and dark "Log in" button with proper contrast
  - **Bottom Navigation Bar**: Dark background matching main app theme, lime green active tab icons and labels, gray inactive tabs, subtle border separator. All colors use centralized theme references (no hardcoded values).
  - **Onboarding Selection States**: Dark card backgrounds maintained across all selection states. Selected options indicated by thicker lime green border (3px vs 2px) instead of background color change, ensuring white text remains readable and meets WCAG AA contrast standards.
  - **Subscription Screen Toggle**: Monthly/Annual toggle uses dark card background with lime green active state. Only the selected plan interval highlights in lime green with white text, while the inactive option remains dark with gray text. All styling uses centralized theme tokens.
- Minimal headers on main tab screens for edge-to-edge content.
- Bottom tabs for primary navigation with active tab highlighting.
- Platform-optimized spacing for navigation bars.
- Legal links consistently styled and opened in native webview.
- **Lesson Step Headers (Updated Nov 2025)**: Consistent header styling across lesson steps with dynamic step numbers and clean question formatting. Pro Video steps display only the prompt text without a numbered title. Progress bar displays under header with lime green fill for all lesson types.
- **Quick Check Styling (Updated Nov 2025)**: Multiple choice options feature circular letter badges (A, B, C, D), dark cards (#3A3C4A), and lime green submit button for improved visual clarity.

### Technical Implementations
- **API Configuration**: Both `apiClient.ts` and `queryClient.ts` use `Constants.expoConfig.extra.apiBaseUrl` for consistent API endpoints. Production URL is `https://lingotoday.replit.app`. For EAS builds, set `PRODUCTION_API_URL` environment variable to override.
- **RevenueCat Integration (Updated Nov 2025)**: Full RevenueCat integration for in-app purchases and subscription management on iOS and Android. The `SubscribeScreen` and onboarding flow dynamically fetch all available subscription packages (monthly, annual, etc.) from RevenueCat's `Purchases.getOfferings()` API with real-time pricing, trial periods, and product metadata. No hardcoded prices - all pricing is pulled directly from App Store/Play Store via RevenueCat. The purchase flow uses native IAP (Apple In-App Purchase for iOS, Google Play Billing for Android) and properly attributes purchases to authenticated users. User authentication with RevenueCat is handled automatically by `AuthContext` - it calls `purchaseService.initialize(userId)` after login, registration, and token restoration, ensuring all purchases are linked to the correct user account. When users log out, `purchaseService.logOut()` is called to clear the RevenueCat session. After successful purchase, the app polls the backend subscription status endpoint to detect when RevenueCat webhooks have upgraded the user to Pro. The backend webhook at `https://lingotoday.replit.app/api/webhooks/revenuecat` receives purchase events from RevenueCat and updates the user's `priceTier` field in the database. **priceTier Values**: The app uses 'pro-monthly' and 'pro-yearly' for Pro subscriptions, 'plus-monthly' and 'plus-yearly' for Plus subscriptions (future), 'free-trial' for trial users, and 'n/a' or null for free users. The app checks `priceTier.startsWith('pro-')` to determine if a user has Pro access and should see premium video content.
- Custom Metro bundler configuration for video file extensions and asset aliases.
- API client in `src/lib/apiClient.ts` handles authentication, HTTP requests, and token management with AsyncStorage.
- Dynamic lesson step counting to support various lesson formats and report accurate progress.
- `SheetManagerProvider` to enforce a single-sheet policy for modals/sheets.
- Lessons use push navigation instead of modal presentation.
- **Notification System (Backend-Driven Architecture - Nov 2025)**: **MIGRATED from local scheduling to backend push notifications** to solve iOS notification batching and reliability issues:
  - **Architecture**: Backend-orchestrated remote push notifications using Expo Push Notification Service. Backend cron job reads user preferences from `user_settings` table and sends push notifications at appropriate times. This is the industry-standard approach for reliable background notification delivery.
  - **Push Token Management**: Mobile app registers Expo push tokens with backend on login/registration/token restoration and unregisters on logout. Token registration uses 24-hour caching to avoid redundant API calls. Registration happens in parallel with RevenueCat initialization.
  - **API Integration**: `apiClient.ts` provides `registerPushToken()` and `unregisterPushToken()` endpoints. `notifications.ts` provides `registerPushTokenWithBackend()` and `unregisterPushToken()` helper functions with caching and error handling.
  - **Notification Flow**: User enables notifications → preferences saved to backend → backend scheduler sends push notifications via Expo Push Service → user receives notification → tapping opens lesson.
  - **Notification Tap Handling**: `AppNavigator.tsx` handles notification taps using expo-notifications listeners. When notification is tapped, app navigates to the lesson specified in notification data payload (lessonId, language, courseId).
  - **Onboarding Integration**: Notification permission requests integrated into onboarding flow (step 4) using `Notifications.requestPermissionsAsync()`. Permissions requested after user registration for explicit opt-in.
  - **Settings Management**: `NotificationSettings.tsx` syncs user preferences to backend. Backend handles all scheduling logic - mobile app no longer schedules local notifications.
  - **Deprecated Functions**: Old local scheduling functions (`scheduleLanguageLearningReminders`, `stopLanguageLearningReminders`, `checkAndRescheduleIfNeeded`, iOS weekly repeating, Android horizon scheduling) marked as deprecated but kept temporarily for backward compatibility. These will be removed once confirmed unused.

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
- **expo-notifications**: For local scheduled push notifications (native only).
- **expo-task-manager**: For background notification task handling.
- **expo-web-browser**: For opening web links in a native webview.
- **expo-video**: For modern video playback.