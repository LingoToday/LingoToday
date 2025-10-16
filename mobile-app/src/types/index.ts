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