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

**Onboarding Flow Expansion (28 screens)**:
- **Screen flow**: Language (0) → Age (1) → Gender (2) → Current Level (3) → Learning Motivation (4) → Use Case Scenarios (5) → Learning Goals (6) → Previous Experience (7) → Previous Learning Methods (8) → Past Experience Feedback (9) → Flexibility Messaging (10) → Challenge 1 (11) → Challenge 2 (12) → Challenge 3 (13) → Improvement Areas (14) → Vocab A1-A2 (15) → Vocab B1-B2 (16) → Vocab C1-C2 (17) → Personal Interests (18) → Upcoming Events (19) → Loading & Plan Creation (20) → Level (21) → Learning Style (22) → Registration (23) → Notifications (24) → Testimonials (25) → Learning Plan (26) → Payment (27).
- **Age Selection (Screen 1)**: 2x2 grid with age ranges (18-24, 25-34, 35-44, 45+).
- **Gender Selection (Screen 2)**: Vertical list with emoji icons (Female, Male, Rather not to say).
- **Current Language Level (Screen 3)**: Single-column list with 7 proficiency levels, includes its own fixed-bottom Continue button.
- **Learning Motivation (Screen 4)**: Multi-select vertical list with emojis and checkmarks (career, travel, study abroad, living abroad, personal development).
- **Use Case Scenarios (Screen 5)**: Multi-select scrollable vertical list with emojis and checkmarks (hotel booking, emergencies, food, navigation, health, transport, culture, shopping, problem solving).
- **Learning Goals (Screen 6)**: 2x2 grid, multi-select with checkmarks (speak confidently, watch movies, understand conversations, read fluently).
- **Previous Experience (Screen 7)**: Single-select vertical list (recently, a year ago, more than a year ago, never).
- **Previous Learning Methods (Screen 8)**: File `OnboardingMethodsScreen.tsx`. Multi-select scrollable vertical list (school, language school, college/university, tutor, self education, abroad, never learned). Uses checkmark indicators.
- **Past Experience Feedback (Screen 9)**: File `OnboardingBarriersScreen.tsx`. Multi-select scrollable list of full text blocks describing barriers (cost, speaking practice, time, discomfort, no tailored program, scheduling, eager to enhance). Custom `barrierCard` styling.
- **Flexibility Messaging (Screen 10)**: File `OnboardingFlexibilityScreen.tsx`. Informational screen with rounded-edge image and motivational text about flexible learning. No user input required.
- **Challenge Assessment (Screens 11-13)**: File `OnboardingChallengeScreen.tsx`. Reusable component with statement header, "Is this statement true for you?" subheader, and 3 single-select options (True, Partially true, That's not true for me). Three instances with different statements about fluency comprehension, vocabulary limitations, and sentence formation.
- **Improvement Areas (Screen 14)**: File `OnboardingImprovementAreasScreen.tsx`. 2x4 grid multi-select with emojis (Speaking, Listening, Vocabulary, Grammar, Reading, Travel, Interesting Facts, Pronunciation).
- **Vocabulary Assessment (Screens 15-17)**: File `OnboardingVocabularyScreen.tsx`. Reusable component with language-aware word grids (Italian, Spanish, German, French). Pill-shaped buttons in flowing layout with multi-select. Three levels: A1-A2 Beginner (15), B1-B2 Intermediate (16), C1-C2 Advanced (17). Words adapt based on language selected on Screen 0.
- **Personal Interests (Screen 18)**: File `OnboardingInterestsScreen.tsx`. 3-column scrollable grid with emoji+text, multi-select with checkmarks (Podcasts, Cooking, Shopping, Music, Travelling, Art, Gaming, Sports, Finance, Tech, Cinema, Dancing, History, Social media, Gardening, Photography, Fitness, Politics, Fashion).
- **Upcoming Events (Screen 19)**: File `OnboardingEventsScreen.tsx`. Vertical list with emoji+text, single-select (Starting a new job, Moving to a different country, Attending a job interview, Exams ahead, Travel abroad, No events upcoming).
- **Loading & Plan Creation (Screen 20)**: File `OnboardingLoadingScreen.tsx`. Circular SVG progress ring (0-100%) with attached image inside, organic non-smooth animation over ~15 seconds. Header "Creating your personal experience..." with 4-item checklist that transitions from "Loading" (grey) to "Done" (green) at progress thresholds (25%, 50%, 75%, 95%). At ~40% progress, a daily practice goal overlay fades in with 4 options (5/10/15/30 min/day); dismisses on selection. Auto-advances to next screen on completion. No continue button shown.
- New state variables: `selectedAge`, `selectedGender`, `selectedCurrentLevel`, `selectedMotivations[]`, `selectedUseCases[]`, `selectedGoals[]`, `selectedExperience`, `selectedMethods[]`, `selectedBarriers[]`, `challengeAnswer1`, `challengeAnswer2`, `challengeAnswer3`, `selectedImprovementAreas[]`, `vocabKnown1[]`, `vocabKnown2[]`, `vocabKnown3[]`, `selectedInterests[]`, `selectedEvent`, `selectedGoal`.
- `toggleMultiSelect` helper for array-based selections.
- New styles in `src/styles/OnboardingStyles.ts`: `ageCard`, `genderCard`, `currentLevelGrid`, `multiSelectCardSelected`, `multiSelectCheck`, `goalsGrid`, `goalCard`, `barrierCard`, `flexibilityImage`, `flexibilityText`, `challengeStatement`, `challengeSubheader`, `improvementGrid`, `improvementCard`, `vocabLevelIndicator`, `vocabWordGrid`, `vocabPill`, `interestsGrid`, `interestCard`, `eventCard`, `loadingHeader`, `loadingProgressContainer`, `loadingImage`, `loadingChecklist`, `goalOverlay` families.

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