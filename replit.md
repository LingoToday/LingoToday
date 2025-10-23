# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54 that helps users learn languages through micro-lessons. The app runs on mobile (iOS/Android via Expo Go) and web browsers.

**Status**: Successfully configured for Replit environment
**Last Updated**: October 23, 2025

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
