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

## Recent Changes (Feb 12, 2026)

**Onboarding Flow Expansion (11 screens)**:
- **Age Selection (Screen 2)**: 2x2 grid with age ranges (18-24, 25-34, 35-44, 45+), inserted after language selection.
- **Gender Selection (Screen 3)**: Vertical list with emoji icons (Female, Male, Rather not to say).
- **Current Language Level (Screen 4)**: Staggered 2-column grid with 7 proficiency levels (Total Beginner through Proficient), includes its own fixed-bottom Continue button.
- **Screen flow**: Language → Age → Gender → Current Level → Level → Learning Style → Registration → Notifications → Testimonials → Learning Plan → Payment (11 total).
- New state variables (`selectedAge`, `selectedGender`, `selectedCurrentLevel`) added to onboarding persistence.
- New styles in `src/styles/OnboardingStyles.ts`: `ageCard`, `genderCard`, `currentLevelGrid` families.

## Changes (Feb 10, 2026)

**JWT-Based User Resolution (userId removal)**:
- **Upcoming Lessons**: `GET /api/v2/upcoming-lessons` — no query params needed, backend resolves user from JWT. Progress (mastered count) now reflects actual phrase attempts.
- **Session API**: `GET /api/v2/session?userId=X&language=it&level=A1&track=basics` — still requires userId query param.
- **Attempt Reporting**: `POST /api/v2/attempts` — body still includes `userId`, backend has not yet migrated this endpoint to JWT resolution.
- **Dashboard label**: Changed "Your Tracks" to "Your learning journey".

## Changes (Feb 09, 2026)

**V2 Track-Based Dashboard**:
- **Dashboard Redesign**: Replaced V1 "Coming Up Next" (individual phrases/lessons) with V2 "Your learning journey" section showing track cards (Basics, Daily Life, Holiday, Social) with progress bars, phrase counts, and status badges (new/in_progress/completed).
- **Track-Based Navigation**: Tapping a track navigates with `language`, `level`, and `track` only. Dropped `lessonId` and `courseId` (V1 concepts) from all navigation paths.
- **Level Mapping**: ChatLessonScreen converts human-readable levels (Beginner→A1, etc.) to CEFR codes as safety net.
- **Chat History Persistence**: Chat messages are persisted to AsyncStorage per track (keyed by `chat_history_{language}_{level}_{track}`). When reopening a track, previous session messages load at the top with a "New Session" divider, and new content appears below. Historical interactive cards (MCQ, gap fill, etc.) render as read-only. Service: `src/services/chatHistoryService.ts`. Max 500 messages per track.

## Changes (Feb 06, 2026)

**V2 Lesson Engine Full Integration**: All users now use the V2 chat-based lesson experience:
- **Session API**: `GET /api/v2/session?language=it&level=A1&track=daily_life` fetches 4-5 phrases per session with server-assigned methods (new/weak/review categorization, SM-2 spaced repetition)
- **Attempt Reporting**: `POST /api/v2/attempts` reports each exercise result (exerciseType, isCorrect, responseTimeMs, userAnswer, expectedAnswer) for mastery tracking
- **Multi-Phrase Sessions**: ChatLessonScreen loops through multiple phrases in a session, showing phrase type indicators (new/weak/review) and progress counters
- **Navigation**: Dashboard lesson taps now route to ChatLessonScreen (replaced LessonScreenNew). "Try V2" test tab removed from bottom navigation.
- **API Client**: New methods `getV2Session()`, `postV2Attempt()`, `getV2Review()`, `getV2Progress()` in `src/lib/apiClient.ts`
- **Types**: New types `V2Session`, `V2SessionPhrase`, `V2PhraseProgress`, `V2AttemptRequest`, `V2AttemptResponse` in `src/types/index.ts`

**V2 Chat Lesson Screen** (`src/screens/ChatLessonScreen.tsx`):
- **Chat Components**: CoachBubble, UserBubble, MCQCard, GapCard, FreeInputCard (defaults to speech mode), ExpandCard, VideoCard, PronunciationBubble, ContinueButton
- **All 7 Learning Methods**: Recognition MCQ, Production Gap, Translate Back, Speech Practice, Context Variations, Expand (multi-select), Video Response
- **Video Method**: VideoCard with JWT-authenticated streaming via `${API_BASE_URL}/api/videos/${videoPath}`. Shows "Can you respond to this?" immediately with video; Type/Speak input appears after user presses play.
- **Route Params**: Accepts language, level, track, courseId, lessonId from navigation; maps language names to codes and courseId to track