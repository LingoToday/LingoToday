# LingoToday Mobile App

## Overview
LingoToday is a React Native mobile application built with Expo SDK 54, designed for multi-language learning (Italian, Spanish, German, French) through micro-lessons. It offers adaptive learning paths, user onboarding, course administration, progress monitoring, and subscription services. The app aims to provide a unified learning experience across iOS, Android, and Web platforms, with a strategic vision to integrate AI-powered language partners in the future.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `node_modules`.
Do not make changes to the file `package-lock.json`.

## System Architecture

### UI/UX Decisions
The application features a comprehensive dark mode theme with a lime green (#A3E635) accent color, ensuring WCAG AA compliance. Key UI/UX elements include centralized color management, dynamic content display for lesson steps, intuitive navigation with minimal headers and bottom tabs, accessible interaction feedback, and enhanced lesson experiences with progress bars.

### Technical Implementations
The app is built using React Native 0.81.4, Expo SDK 54, React Native Web, React Navigation, React Query for state management, and Context API with AsyncStorage for authentication, all implemented in TypeScript. Core features include synchronized splash screen management, consistent API configuration using `Constants.expoConfig.extra.apiBaseUrl` (with `https://www.lingotoday.co` as production API), language-aware course intro videos, and backend-fetched video content with authenticated asset routing. RevenueCat is integrated for in-app purchases. The system supports backend-driven push notifications via Expo Push Notification Service. An interactive AI Avatar is integrated using HeyGen's Streaming API with LiveKit, featuring context-aware prompts and secure API key storage. Authenticated video playback is managed with robust token handling, and lesson content is tailored to user skill levels by passing `skillLevel` query parameters to the backend.

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

## Recent Changes (Feb 03, 2026)
**V2 Lesson Engine API Integration - Phase 1**: Added frontend API client methods to fetch data from the new V2 phrase-based lesson system:
- **New Types Added** (`src/types/index.ts`):
  - `V2StatusResponse`: Check if V2 engine is enabled
  - `V2TracksResponse`: Available learning tracks (raw string array)
  - `V2Phrase`: Complete phrase object with all method fields (MCQ, gap, speech, context, etc.)
  - `V2ContextVariation`: Context variation scenario structure
- **New API Methods Added** (`src/lib/apiClient.ts`):
  - `getV2Status()`: GET /api/v2/status - check if V2 is enabled
  - `getV2Tracks(language, level)`: GET /api/v2/tracks?language=it&level=A1 - get available tracks
  - `getV2Phrases(options)`: GET /api/v2/phrases?language=it&level=A1&track=daily_life - get phrases
  - `getV2PhraseById(phraseId)`: GET /api/v2/phrases/:phraseId - get single phrase
- **Temporary Test**: Added console test in App.js that runs on app start (shows CORS warning on web, works on native)
- **CORS Note**: Web preview blocked by CORS (backend needs Access-Control-Allow-Origin headers for web); native iOS/Android works correctly
- **Next Steps (Phase 2+)**: Update onboarding to use V2 tracks, create phrase feed/list view, build lesson UI from phrase method fields

## Previous Changes (Feb 02, 2026)
**Removed Fill-the-Gap Step from Lessons**: Simplified lesson flow by completely hiding/skipping the typing practice step:
- **Step Removed**: The "Complete the word" / fill-in-the-gap step is now completely hidden from all lessons
- **Implementation Approach**: Multi-layered filtering in `LessonScreenNew.tsx`:
  - **getTotalSteps()**: Filters typing steps for array format (`stepType !== 'typing'`), object format (key name and stepType check), and legacy format (`type_prompt`/`expectedAnswer` detection)
  - **Step Data Access**: Object and array format step access filters out typing steps before selection
  - **Legacy Normalization**: Typing steps filtered after normalizing legacy step format
  - **Auto-Advance Safety**: useEffect auto-advances past any typing step that slips through (`stepData?.type === 'type'`)
- **Updated Flow**: Lessons now show only non-typing steps (typically 3 steps instead of 4)
- **Files Modified**: `src/screens/LessonScreenNew.tsx`

**Video Playback Fix - Play Once**: Fixed video auto-looping on lesson steps:
- **Change**: Set `isLooping={false}` for all video players in lesson steps
- **Behavior**: Videos now play once and stop; users can replay using native controls if needed
- **Pro Videos**: Set `shouldPlay={false}` so pro videos do NOT auto-play; user must tap play button to start
- **Files Modified**: `src/screens/LessonScreenNew.tsx`

## Previous Changes (Jan 31, 2026)
**AI-Enhanced "How to Use" - UX Improvement**: Removed loading spinner to improve user experience:
- **No More "Generating tips..." Spinner**: Users now see the original note immediately instead of a loading spinner
- **Silent Enhancement**: Enhanced content loads in the background and replaces original note when ready
- **Pre-fetch On Lesson Load**: Content is fetched when lesson screen mounts (step 1), not when user reaches "How to use" screen
- **Fallback**: If enhanced content isn't ready, original note displays; content upgrades seamlessly when available
- **Backend Database Caching Required**: For instant tips across all users, the backend at www.lingotoday.co needs to implement database storage for enhanced content (check cache first, generate with OpenAI if not found, store for reuse)

## Previous Changes (Jan 30, 2026)
**AI-Enhanced "How to Use" Content**: Enhanced the "When to Use" screen with AI-generated content via backend API:
- **Backend Endpoint**: New `POST /api/lessons/enhance` endpoint required - accepts `{ language, lessonId, word, translation, example?, exampleTranslation?, note }`, returns `{ success, enhancedContent: { pronunciation, genderNote, dailyLifeUsage } }` using OpenAI GPT
- **Enhanced Content Sections**: Pronunciation (phonetic spelling for English speakers), Male/Female forms (gender/formal variants), Daily Life Usage (practical examples)
- **Client-Side Caching**: Uses AsyncStorage to cache enhanced content per language+lessonId to avoid repeated API calls
- **Pre-fetch Strategy**: Content is fetched when lesson modal opens, so it's ready before user reaches the "How to use" screen
- **UI Changes**: Title changed from "When to Use" to "How to Use", sections displayed with labeled headers
- **Fallback**: Shows original note if API fails or returns no content
- **Files Modified**: `src/services/lessonEnhancementService.ts` (new), `src/components/LessonModal.tsx`, `src/lib/apiClient.ts`

**Lesson Step 1 Screen Split**: Split Phase 1 (Word Review) into two separate screens for better UX in `LessonScreenNew.tsx`:
- **Screen 1 - Word/Phrase Introduction**: Shows the lesson word/phrase, translation label, and pronunciation button only
- **Screen 2 - When to Use**: Displays usage notes in a nicely formatted card with header, divider, and readable text styling
- **Conditional Skip**: If `stepData.note` is empty/undefined, the "When to use" screen is skipped and user proceeds directly to Step 2 (Quick Check)
- **Navigation**: Added back button on "When to use" screen to return to word intro; state resets when navigating between steps via useEffect on currentStep
- **State Management**: `phase1SubStep` state manages sub-step navigation ('word' | 'usage') with proper reset on step changes
- **Fallback Guard**: If usage screen is selected but no note exists, word intro is shown instead

## Previous Changes (Jan 27, 2026)
**OpenAI TTS Pronunciation Integration**: Upgraded pronunciation feature to use OpenAI's TTS API for more natural-sounding audio:
- **Backend Endpoint**: New `POST /api/lessons/pronounce` endpoint required - accepts `{ text, language }`, returns `{ success, audioBase64 }` using OpenAI TTS (`tts-1-hd` model with natural voice)
- **Step 1 Pronunciation Button**: Now uses OpenAI TTS via `playOpenAIPronunciation()` with automatic fallback to expo-speech if backend unavailable
- **Review Steps Pronunciation**: Added "Pronunciation" button to SpeakBackComponent (under "tap to record") with `showPronunciationButton` prop
- **Audio Playback**: Uses expo-av Audio.Sound for base64 audio playback with proper cleanup on completion and unmount
- **Loading States**: Button shows "Playing..." state while audio is playing

**Speak-Back Feature Extended to Review Steps**: Added the same microphone-based speak-back option to review lesson steps:
- **Review MCQ Support**: Speak-back mode is now the default for `review_mcq` step types in course reviews
- **Consistent UX**: Same UI pattern as video steps - speak-back mode default, with "Use text mode" toggle and "Use the speech option" button in text mode
- **State Management**: Proper state reset (selectedAnswer, showResult, isCorrect) when entering review steps to prevent stale selections
- **Audio Level Visualization**: 5 animated bars that react to voice volume while recording
- **Processing Indicator**: "Transcribing audio" spinner shown during processing
- **Error Handling**: User-friendly error messages for network/server errors

## Previous Changes (Jan 26, 2026)
**Speak-Back Feature for Video Steps (Step 4)**: Added microphone-based speak-back option for video lesson steps:
- **SpeakBackComponent**: New component at `src/components/SpeakBackComponent.tsx` that records user audio, sends to backend for transcription via OpenAI Whisper API, and validates answers
- **Video Steps Support**: Speak-back mode is the default for both `video_choice` AND `pro_video` step types (step 4 video questions); users speak their answer after watching the video
- **Text Mode Fallback**: Users can switch to text input mode if they can't talk, which shows the existing multiple choice options
- **Answer Validation**: Fuzzy matching with Levenshtein distance for pronunciation variations (80% similarity threshold)
- **Mode Toggle**: Users can switch between speak and text modes at any time
- **API Integration**: Added `transcribeAudio` method to apiClient.ts for calling backend `/api/lessons/transcribe` endpoint
- **Backend Requirements**: Backend needs new POST `/api/lessons/transcribe` endpoint that accepts audio file + language, uses OpenAI Whisper for transcription, returns `{ success, transcription, confidence }`

## Previous Changes (Jan 05, 2026)
**HeyGen AI Avatar Integration - v1.0.10 (33) Build 25 - Transcription-Based Stop Listening Fix**: Fixed avatar not responding at all by correcting stop_listening timing:
- **ROOT CAUSE**: Build 24 sent `stop_listening` immediately on `user.speak_ended`, which aborted transcript delivery before it was complete. HeyGen never transitioned to response generation.
- **FIX**: Moved `stop_listening` trigger from `user.speak_ended` to `user.transcription_ended` event
- **Fallback Timer**: Added 3-second fallback after `user.speak_ended` - if `user.transcription_ended` doesn't arrive, sends `stop_listening` anyway to prevent deadlock
- **Guard Logic**: Added `stopListeningSentRef` to prevent duplicate `stop_listening` sends; reset on `avatar.speak_ended` for next turn
- **Protocol Flow**: `user.speak_started` → `user.speak_ended` (UI + start 3s timer) → `user.transcription_ended` → send `stop_listening` → avatar processes → `avatar.speak_started` → `avatar.speak_ended` → reset guards + send `start_listening` → ready for next turn
- **Telemetry**: Added `stop_listening (transcription_finished)` and `stop_listening (fallback_timeout)` events to Server Events log