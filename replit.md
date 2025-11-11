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
- **Lesson Step Headers (Updated Nov 2025)**: Consistent header styling across lesson steps (Quick Check, Type Practice, Listen and Choose) with dynamic step numbers, cyan color titles (#06B6D4), and clean question formatting. Pro Video steps display only the prompt text without a numbered title. Progress bar displays under header for all lesson types.
- **Quick Check Styling (Updated Nov 2025)**: Multiple choice options feature circular letter badges (A, B, C, D), white rounded cards, and cyan submit button (#7DD3FC) for improved visual clarity and user experience.

### Technical Implementations
- **API Configuration**: Both `apiClient.ts` and `queryClient.ts` use `Constants.expoConfig.extra.apiBaseUrl` for consistent API endpoints. Production URL is `https://lingotoday.replit.app`. For EAS builds, set `PRODUCTION_API_URL` environment variable to override.
- **RevenueCat Integration (Updated Nov 2025)**: Full RevenueCat integration for in-app purchases and subscription management on iOS and Android. The `SubscribeScreen` and onboarding flow dynamically fetch all available subscription packages (monthly, annual, etc.) from RevenueCat's `Purchases.getOfferings()` API with real-time pricing, trial periods, and product metadata. No hardcoded prices - all pricing is pulled directly from App Store/Play Store via RevenueCat. The purchase flow uses native IAP (Apple In-App Purchase for iOS, Google Play Billing for Android) and properly attributes purchases to authenticated users. User authentication with RevenueCat is handled automatically by `AuthContext` - it calls `purchaseService.initialize(userId)` after login, registration, and token restoration, ensuring all purchases are linked to the correct user account. When users log out, `purchaseService.logOut()` is called to clear the RevenueCat session. After successful purchase, the app polls the backend subscription status endpoint to detect when RevenueCat webhooks have upgraded the user to Pro. The backend webhook at `https://lingotoday.replit.app/api/webhooks/revenuecat` receives purchase events from RevenueCat and updates the user's `priceTier` field in the database. **priceTier Values**: The app uses 'pro-monthly' and 'pro-yearly' for Pro subscriptions, 'plus-monthly' and 'plus-yearly' for Plus subscriptions (future), 'free-trial' for trial users, and 'n/a' or null for free users. The app checks `priceTier.startsWith('pro-')` to determine if a user has Pro access and should see premium video content.
- Custom Metro bundler configuration for video file extensions and asset aliases.
- API client in `src/lib/apiClient.ts` handles authentication, HTTP requests, and token management with AsyncStorage.
- Dynamic lesson step counting to support various lesson formats and report accurate progress.
- `SheetManagerProvider` to enforce a single-sheet policy for modals/sheets.
- Lessons use push navigation instead of modal presentation.
- **Notification System (Platform-Specific Architecture - Nov 2025)**: Complete platform-specific refactoring to solve iOS notification batching issues while maintaining Android reliability:
  - **Onboarding Integration**: Notification permission requests are properly integrated into the onboarding flow (step 4) using `Notifications.requestPermissionsAsync()` with iOS-specific options. Permissions are only requested after user registration, ensuring explicit opt-in.
  - **iOS Strategy - Weekly Repeating Calendar Triggers**: Uses weekly repeating calendar-based notifications (e.g., "Every Monday at 9:00 AM") instead of hundreds of one-off scheduled notifications. This aligns with iOS's expected notification patterns and prevents the system from batching/delaying notifications. Maximum 64 repeating triggers with auto-adjustment of frequency when user settings exceed this limit. Notifications persist indefinitely until user changes settings.
  - **Android Strategy - 14-Day Horizon Scheduling**: Pre-schedules notifications for the next 14 days using specific date/time triggers. Maximum 100 notifications with automatic refilling when count drops below 10. This horizon-based approach works well with Android's notification system.
  - **Cross-Midnight Window Support**: Both platforms correctly handle notification windows that span midnight (e.g., 6 PM to 9 AM) by calculating day offsets and scheduling post-midnight notifications for the following day.
  - **Auto-Rescheduling**: Platform-specific thresholds - iOS recreates weekly repeaters if count reaches 0, Android refills 14-day horizon if count drops below 10. Dashboard automatically checks and reschedules on app launch and when returning from background.
  - **Settings Integration**: All scheduled notifications are cleared and recreated whenever user changes frequency, time window, or selected days to ensure settings are immediately reflected.
  - **iOS Background Delivery**: Configured with timeSensitive interruption level and notification categories with action buttons ("Start Lesson", "Dismiss"). Uses expo-notifications for reliable delivery across all app states (foreground, background, terminated). Requests allowTimeSensitive permission to enable time-sensitive delivery that can break through Focus modes.
  - **Focus Mode Compatibility**: iOS users must allow LingoToday in Focus modes (Settings > Focus > [Mode] > Apps) for lock screen notifications during Do Not Disturb/Sleep/Work modes.

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