// Import types from shared schema
import type {
  User,
  UserSettings,
  UserProgress,
  UserStats,
  Course,
  Lesson,
  LessonStep,
  Checkpoint,
  CheckpointProgress,
  CheckpointQuestion,
  Language,
  SkillLevel,
  Step1Content,
  Step2Content,
  Step3Content,
  CourseWithRelations,
  LessonWithSteps,
} from '../../../shared/schema';

// Re-export for convenience
export type {
  User,
  UserSettings,
  UserProgress,
  UserStats,
  Course,
  Lesson,
  LessonStep,
  Checkpoint,
  CheckpointProgress,
  CheckpointQuestion,
  Language,
  SkillLevel,
  Step1Content,
  Step2Content,
  Step3Content,
  CourseWithRelations,
  LessonWithSteps,
};

// Mobile-specific types
export interface DashboardData {
  user: User & {
    hasSeenNotificationSetup?: boolean;
  };
  settings: {
    notificationsEnabled: boolean;
    notificationFrequency: number;
    notificationStartTime: string;
    notificationEndTime: string;
    selectedLanguage: string;
  };
  stats: {
    streak: number;
    totalLessons: number;
    wordsLearned: number;
    lessonsCompleted: number;
  };
  progress: UserProgress[];
}

export interface NextLessonData {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  courseTitle?: string;
}

export interface CourseStats {
  totalCourses: number;
  totalLessons: number;
}

// Navigation types
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: undefined;
  Lesson: {
    courseId: string;
    lessonId: string;
    stepNumber?: number;
  };
  Checkpoint: {
    checkpointId: number;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Account: undefined;
  Progress: undefined;
};

// V2 Lesson Engine Types

export interface V2StatusResponse {
  version: string;
  enabled: boolean;
  timestamp: string;
}

// Note: The tracks endpoint returns a raw string array, not a wrapper object
// This type is kept for documentation but the actual response is string[]
export type V2TracksResponse = string[];

export interface V2ContextVariation {
  scenario: string;
  prompt: string;
  expected: string;
}

export interface V2Phrase {
  id: number;
  phraseId: string;
  language: string;
  level: string;
  phrase: string;
  translation: string;
  primaryTrack: string;
  secondaryTrack: string | null;
  difficulty: number;
  phraseKind: string;
  videoSceneId: string | null;
  isActive: boolean;

  // Pattern fields
  patternKey: string | null;
  patternForm: string | null;
  patternMeaning: string | null;
  patternExample1: string | null;
  patternExample2: string | null;

  // Hints
  meaningNote: string | null;
  pronunciationHint: string | null;
  ttsAudioKey: string | null;

  // Recognition MCQ
  recognitionMcqQuestion: string | null;
  recognitionMcqOptions: string[] | null;
  recognitionMcqAnswer: string | null;

  // Audio Recognition MCQ
  recognitionAudioMcqOptions: string[] | null;
  recognitionAudioMcqAnswer: string | null;

  // Gap-Fill Production
  productionGapMask: string | null;
  productionGapAnswers: string[] | null;

  // Translate Back
  translateBackPrompt: string | null;
  translateBackExpected: string[] | null;

  // Speech Practice
  speechPrompt: string | null;
  speechKeywords: string[] | null;

  // Listening
  listeningAudioKey: string | null;
  listeningQuestion: string | null;
  listeningOptions: string[] | null;
  listeningAnswer: string | null;

  // Context Variations
  contextVariations: V2ContextVariation[] | null;

  // Video
  videoPath: string | null;
  videoPrompt: string | null;
  videoExpected: string[] | null;

  // Expand
  expandPrompt: string | null;
  expandOptions: string[] | null;
  expandValidation: string | object | null;

  createdAt: string;
  updatedAt: string;
}