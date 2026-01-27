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
The app is built using React Native 0.81.4, Expo SDK 54, React Native Web, React Navigation, React Query for state management, and Context API with AsyncStorage for authentication, all implemented in TypeScript. Core features include synchronized splash screen management, consistent API configuration using `Constants.expoConfig.extra.apiBaseUrl` (with `https://lingotoday.replit.app` as production API), language-aware course intro videos, and backend-fetched video content with authenticated asset routing. RevenueCat is integrated for in-app purchases. The system supports backend-driven push notifications via Expo Push Notification Service. An interactive AI Avatar is integrated using HeyGen's Streaming API with LiveKit, featuring context-aware prompts and secure API key storage. Authenticated video playback is managed with robust token handling, and lesson content is tailored to user skill levels by passing `skillLevel` query parameters to the backend.

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

## Recent Changes (Jan 27, 2026)
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