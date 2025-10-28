# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that helps users learn languages through micro-lessons. The app runs on mobile (iOS/Android via Expo Go) and web browsers.

**Status**: Successfully configured for Replit environment
**Last Updated**: October 27, 2025

## Project Architecture

### Tech Stack
- **Framework**: React Native 0.81.4 with Expo SDK 54
- **UI Library**: React Native Web for web compatibility
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: Context API with AsyncStorage
- **Payments**: Stripe (native only, web has mocks)
- **Language**: TypeScript + JavaScript

### Key Features
- Multi-language learning (Italian, Spanish, German, French)
- Adaptive learning levels (Beginner, Intermediate, Expert)
- User onboarding flow
- Course management
- Progress tracking
- Push notifications (native only)
- Subscription management
- Cross-platform support (iOS, Android, Web)

## Project Structure
```
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ui/          # shadcn-style UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation configuration
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API client
│   ├── services/       # Services (Notifications, etc.)
│   ├── data/           # Static data (lessons, etc.)
│   └── types/          # TypeScript type definitions
├── assets/             # Images, fonts, icons
├── App.js             # Main app component
└── index.js           # Entry point
```

## Configuration

### Environment Variables
The app uses Expo Constants for configuration:
- `apiBaseUrl`: Backend API endpoint (configured in app.json)
- `stripePublishableKey`: Stripe public key for payments

### Platform-Specific Code
- **Stripe Integration**: Uses platform-specific imports (.web.js, .native.js)
  - Web version uses mock implementations
  - Native version uses actual Stripe SDK

### Metro Bundler
Custom configuration in `metro.config.js`:
- Video file extensions support (mov, mp4, avi, mkv, webm)
- Alias for attached_assets folder

## Development

### Running the App

**Web Version (Replit)**:
```bash
npm run web
```
Runs on http://localhost:5000

**Mobile Version**:
```bash
npm start
```
Then scan QR code with Expo Go app

### Scripts
- `npm run web` - Start web development server (port 5000)
- `npm start` - Start Expo with tunnel
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run reset-cache` - Clear Metro bundler cache

## Backend Integration

The app connects to a backend API configured in `app.json`:
- API Base URL: Configured via `extra.apiBaseUrl`
- The API client handles authentication tokens
- Uses AsyncStorage for local data persistence

### API Client
Located in `src/lib/apiClient.ts`:
- Handles authentication
- Manages HTTP requests
- Platform-aware credentials handling
- Token management with AsyncStorage

## Known Limitations

1. **Stripe Payments**: Only work on native platforms (iOS/Android). Web has mock implementations.
2. **Push Notifications**: Only supported on native platforms.
3. **Some Expo packages**: May show deprecation warnings (expo-av will be replaced with expo-audio/expo-video in SDK 54+).

## Replit-Specific Setup

### Port Configuration
- Web app runs on port 5000 (required for Replit)
- Configured via `npm run web` script

### Host Binding
- Development server binds to 0.0.0.0 (configured via EXPO_DEVTOOLS_LISTEN_ADDRESS)
- Allows access through Replit's proxy

### Dependencies
All dependencies are installed via npm and tracked in package.json. No additional system packages required beyond Node.js 20.

## Recent Changes

### October 28, 2025
- **Implemented Automatic Push Notification Scheduling**
  - Updated `scheduleLanguageLearningReminders` in `src/lib/notifications.ts` to accept and respect user-selected days (Mon-Sun)
  - Notifications now automatically schedule based on user settings (days, frequency, start/end times) from dashboard
  - Added weekday-based calendar triggers using expo-notifications to schedule on specific days of the week
  - Fixed frequency parameter interpretation - now correctly treats value as "minutes between notifications" (15/30/60) instead of "count per day"
  - Implemented auto-scheduling on app startup when notifications are enabled (checks for duplicates before scheduling)
  - Updated NotificationSettings component to automatically reschedule notifications when any setting changes
  - Removed manual "Start Today's Learning Session" card from DashboardScreenNew - notifications are now fully automatic
  - Users can configure notification preferences in Account settings, and the app will automatically handle scheduling
  - Notification scheduling respects all user preferences: enabled days, frequency interval, time window, and selected language

### October 27, 2025
- **Removed Header Navigation from Authenticated Screens**
  - Removed full header navigation (LingoToday logo, account dropdown, profile button) from all authenticated screens
  - Main tab screens (Dashboard, Account) now have no header - content goes edge-to-edge for maximum screen space
  - Secondary screens (Progress, Analytics) have minimal headers with just a back arrow and screen title
  - Back button properly uses `navigation.goBack()` with fallback to MainTabs for proper stack navigation
  - Minimal headers display in all screen states (loading, error, success) to ensure users can always navigate back
  - Bottom tabs provide primary navigation; screen headers are no longer needed for navigation
  - Screens affected: DashboardScreenNew, AccountScreenNew, ProgressScreenNew, AnalyticsScreen

- **Fixed Bottom Navigation Visibility for Authenticated Users**
  - Removed duplicate Dashboard and Account screens from authenticated stack in `AppNavigator.tsx`
  - Updated all `navigation.navigate('Dashboard')` calls throughout the app to navigate to `'MainTabs'` instead
  - Updated all `navigation.navigate('Account')` calls to navigate to `'MainTabs'` with `{ screen: 'Profile' }` parameter
  - Fixed OnboardingScreenNew navigation reset to go to MainTabs
  - Updated RootStackParamList to support MainTabs with optional screen parameter
  - Bottom tab navigation now properly displays for all authenticated users
  - Navigation structure ensures tabs remain visible: Landing → Login → Onboarding → MainTabs (Home/Profile)
  - Affected screens: SubscribeScreen, OnboardingScreenNew, AccountScreenNew, CoursesScreenNew, LessonScreenNew, ProgressScreenNew, NotFoundScreen, LessonExampleScreen, DashboardScreenNew, AnalyticsScreen, SubscriptionScreen

- **Added Legal Links to Subscription Screen**
  - Added Terms of Service and Privacy Policy links below the Restore Purchases button in `SubscriptionScreenNew.tsx`
  - Links open in native webview using `expo-web-browser` with `WebBrowser.openBrowserAsync()`
  - URLs: https://www.lingotoday.co/terms and https://www.lingotoday.co/privacy
  - Styled with small, muted gray text (#6B7280) and underlines
  - Links separated by bullet point separator
  - Follows consistent pattern with existing legal links implementation

### October 24, 2025
- **Fixed Blank Screen on Step 5+ for Lessons with Steps Object Format**
  - Fixed bug where lessons with `steps` object format (named keys like word_review, typing, etc.) only displayed steps 1-4
  - Replaced hardcoded step mapping with dynamic key-based indexing using `Object.keys()` and `currentStep - 1`
  - Added handlers for all step types (word_review, quick_check, typing, comprehension) in steps object section
  - Added comprehensive debug logging to track step keys, current step number, and step data structure
  - Step 5 and beyond now display correctly for all lesson formats (steps object, steps array, legacy step1-step10)
  - Fixed issue reported for Italian Course 1 Lesson 3 where step 5 showed blank screen

- **Implemented Dynamic Lesson Step Counting**
  - Added `getTotalSteps()` helper function to dynamically calculate the number of steps in any lesson
  - Supports multiple lesson formats: new `steps[]` array, `steps` object, legacy `step1-step10` fields, and IRL video lessons
  - Replaced all hardcoded 4-step limitations throughout `LessonScreenNew.tsx`
  - Fixed lesson completion reporting to send correct `stepNumber` to backend API (was hardcoded to 4, now dynamic)
  - Updated header progress display to show accurate "Step X of Y" for lessons with any number of steps (1-10+)
  - Fixed button text to correctly show "Next" vs "Complete Lesson" based on actual total step count
  - Added division-by-zero guard in score calculation using `Math.max(1, totalSteps - 1)` to handle edge cases
  - Lessons with 5+ steps now display and complete properly; app dynamically adapts to backend lesson data
  - This allows admins to manage lesson step counts via /admin page without requiring app code changes

### October 23, 2025
- **Implemented Mobile-Optimized Bottom Navigation**
  - Created `BottomTabNavigator.tsx` with Home and Profile tabs
  - Home tab (🏠 icon) shows the Dashboard screen
  - Profile tab (👤 icon) shows the Account screen
  - Active tab highlighted in blue (#3B82F6), inactive tabs in gray (#9CA3AF)
  - Platform-optimized spacing for iOS (taller navigation bar) and Android (shorter)
  - Uses Ionicons with filled icons for active state, outlined for inactive
  - Integrated as main navigation for authenticated users in AppNavigator
  - Navigation structure: Landing → Login → Onboarding → Bottom Tabs (Home/Profile)

- **Added Legal Links to Subscription and Registration Screens**
  - Installed `expo-web-browser` package for webview functionality
  - Added Terms of Service and Privacy Policy links to:
    - Subscription screen (below "Delete account" link with small gray text and bullet separator)
    - Create Account registration screen (inline within onboarding flow)
  - Links open in native webview using async `WebBrowser.openBrowserAsync()` handlers
  - URLs point to https://www.lingotoday.co/terms and https://www.lingotoday.co/privacy
  - Both implementations follow consistent patterns with proper error handling

- **Fixed Modal/Sheet Stacking Issues**
  - Created global `SheetManagerProvider` context to enforce single-sheet policy
  - Only one sheet can be open at a time; opening a new sheet automatically closes the previous one
  - Removed modal presentation from Lesson and Checkpoint screens
  - Lessons now use push navigation instead of modal presentation
  - Dashboard↔Lesson navigation uses standard stack push with back button support
  - Notification handlers now dismiss all sheets before navigating to lessons
  - Added Platform.OS checks to prevent web-incompatible notification APIs from running

### October 22, 2025
- Imported project from GitHub
- Configured for Replit environment
- Created platform-specific Stripe wrappers (web vs native)
- Set up workflow to run on port 5000
- Updated npm scripts for Replit compatibility
- Replaced static image with video on LandingScreen
- Migrated from expo-av to expo-video for modern video playback
- Implemented responsive video sizing (max 50% viewport height)
- Added ScrollView for accessibility on all device sizes
- Configured video to autoplay, loop, muted without controls (GIF-like behavior)
- Verified web app functionality with responsive layouts

## Troubleshooting

### Build Issues
If you see bundling errors:
1. Clear Metro cache: `npm run reset-cache`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Platform-Specific Issues
- Some native modules won't work on web (Stripe, Notifications)
- Use platform-specific imports (.web.js, .native.js) for such cases

### Package Warnings
The app may show warnings about package versions being slightly out of sync. These are generally safe to ignore unless you encounter runtime errors.
