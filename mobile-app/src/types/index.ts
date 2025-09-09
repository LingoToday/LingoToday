// Shared types from the main app
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
}

export interface UserProgress {
  id: number;
  userId: string;
  language: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
}

export interface DashboardData {
  user: User;
  progress: UserProgress[];
  stats: {
    currentStreak: number;
    totalLessonsCompleted: number;
    wordsLearned: number;
  };
  settings: {
    selectedLanguage: string;
    selectedLevel: string;
    notificationFrequency: number;
    notificationStartTime: string;
    notificationEndTime: string;
  };
}