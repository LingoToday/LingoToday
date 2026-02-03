# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54, designed for multi-language learning (Italian, Spanish, German, French) through micro-lessons. It offers adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to provide a unified learning experience across iOS, Android, and Web platforms, with a strategic vision to integrate AI-powered language partners in the future.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### UI/UX Decisions
The application features a comprehensive dark mode theme with a lime green (#A3E635) accent color, ensuring WCAG AA compliance. Key UI/UX elements include centralized color management, dynamic content display for lesson steps, intuitive navigation with minimal headers and bottom tabs, accessible interaction feedback, and enhanced lesson experiences with progress bars. A WhatsApp/iMessage-style chat interface is implemented for V2 lessons, including coach bubbles, user bubbles, and interactive cards for various learning methods.

### Technical Implementations
The app is built using React Native 0.81.4, Expo SDK 54, React Native Web, React Navigation, React Query for state management, and Context API with AsyncStorage for authentication, all implemented in TypeScript. Core features include synchronized splash screen management, consistent API configuration using `Constants.expoConfig.extra.apiBaseUrl`, language-aware course intro videos, backend-fetched video content with authenticated asset routing, and backend-driven push notifications via Expo Push Notification Service. An interactive AI Avatar is integrated using HeyGen's Streaming API with LiveKit, featuring context-aware prompts and secure API key storage. Authenticated video playback is managed with robust token handling, and lesson content is tailored to user skill levels. OpenAI's TTS API is used for natural-sounding pronunciation, and OpenAI Whisper API is used for transcribing user speech for speak-back features with fuzzy matching validation. Lessons now support a V2 lesson engine with phrase-based learning, incorporating multiple choice, gap fill, translate back, speech practice, and context variation methods. The "How to Use" screen content is enhanced with AI-generated tips (pronunciation, gender notes, daily life usage).

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
- **AsyncStorage**: Local data persistence.
- **expo-notifications**: Push notifications.
- **expo-web-browser**: In-app webview.
- **expo-video**: Modern video playback.
- **@livekit/react-native**: WebRTC streaming for AI Avatar.
- **expo-secure-store**: Secure credential storage.
- **HeyGen's Streaming API**: For AI Avatar integration.
- **OpenAI TTS API**: For enhanced pronunciation.
- **OpenAI Whisper API**: For speech-to-text transcription.

## Recent Changes (Feb 03, 2026)

**V2 Chat Lesson Screen**: Created WhatsApp/iMessage-style chat interface for V2 lessons:
- **Screen**: `src/screens/ChatLessonScreen.tsx` - Full chat-based lesson experience
- **Chat Components**:
  - `CoachBubble`: Left-aligned speech bubbles (no avatar), supports prompts and feedback
  - `UserBubble`: Right-aligned user responses with correct/incorrect color states
  - `MCQCard`: Interactive multiple choice with answer validation
  - `GapCard`: Fill-the-blank with text input
  - `FreeInputCard`: Unified component for translateBack, speech, and context with text/mic toggle
  - `ContinueButton`: Tap-to-continue between lesson steps
- **Step-by-Step Flow**: 
  - Intro messages (phrase, translation, meaning, pronunciation) → "Tap to continue" button
  - User taps → First method card (MCQ) → User answers → Feedback
  - Next method → User answers → And so on through all 5 methods
- **All 5 Learning Methods**: Recognition MCQ, Production Gap, Translate Back, Speech Practice, Context Variations
- **V2 API Integration**: Fetches phrases from V2 API (e.g., `it_a1_shopping_001`) and builds lesson flow from phrase method fields
- **Navigation**: "Try V2" tab in bottom navigation for testing