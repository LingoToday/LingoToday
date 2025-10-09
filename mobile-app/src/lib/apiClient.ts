import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
  priceTier?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface ProgressData {
  courseId: string;
  lessonId: string;
  stepNumber: number;
  completed: boolean;
  score: number;
  completedAt: string | null;
  lessonTitle?: string;
  italianPhrase?: string;
  englishTranslation?: string;
  courseTitle?: string;
}


interface NextLessonData {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  courseTitle?: string;
}

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
  progress: ProgressData[];
}

export interface UserSettings {
  userId: string;
  language: string;
  theme: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notificationFrequency: number;
  notificationStartTime: string;
  notificationEndTime: string;
  mobileNotificationsEnabled: boolean;
  mobileNotificationFrequency: number;
  mobileNotificationStartTime: string;
  mobileNotificationEndTime: string;
  mobileNotificationDays: string[];
  desktopNotificationsEnabled: boolean;
  desktopNotificationFrequency: number;
  desktopNotificationStartTime: string;
  desktopNotificationEndTime: string;
  desktopNotificationDays: string[];
  difficultyLevel: string;
}

export interface CourseStats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

export class ApiClient {
  // Platform-aware secure storage
  private async getAuthToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        return localStorage.getItem('authToken');
      } else {
        // Use SecureStore on native platforms
        return await SecureStore.getItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async setAuthToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        localStorage.setItem('authToken', token);
      } else {
        // Use SecureStore on native platforms
        await SecureStore.setItemAsync('authToken', token);
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private async removeAuthToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        localStorage.removeItem('authToken');
      } else {
        // Use SecureStore on native platforms
        await SecureStore.deleteItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authToken = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Platform-aware credentials handling
    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    // Only include credentials on native platforms or when not using wildcards
    if (Platform.OS !== 'web') {
      requestOptions.credentials = 'include';
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          
          // Try to parse as JSON first
          if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // If it's HTML or plain text, use a generic message
            errorMessage = `${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          console.warn('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Handle successful response
      const responseText = await response.text();
      
      // Handle empty response
      if (!responseText || responseText.trim() === '') {
        return {} as T;
      }

      // Try to parse JSON response
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, check if it looks like HTML
        if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
            responseText.trim().toLowerCase().startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. Check your API endpoint.');
        }
        
        // For other non-JSON responses, throw a parse error
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // Authentication - matching web routes exactly
  async register(data: {
    firstName: string;
    lastName?: string ;
    email: string;
    password: string;
    selectedLanguage?: string;
    selectedLevel?: string;
    learningStyle?: string
    notificationsEnabled?: boolean
  }) {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token if provided
    if ((response as any).token) {
      await this.setAuthToken((response as any).token);
    }
    
    return response;
  }

  async logout() {
    try {
      console.log('🚪 Attempting logout...');
      
      // Always remove token first, regardless of API call success
      await this.removeAuthToken();
      console.log('✅ Token removed from storage');
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await this.makeRequest('/api/auth/logout', { method: 'POST' });
        console.log('✅ Server logout successful');
      } catch (apiError) {
        console.warn('⚠️ Server logout failed (but local logout successful):', apiError);
        // Don't throw here - local logout is what matters most
      }
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Always ensure token is removed even if there's an error
      try {
        await this.removeAuthToken();
        console.log('✅ Token removed as fallback');
      } catch (removeError) {
        console.error('❌ Failed to remove token:', removeError);
      }
      
      // Don't throw the error - logout should always succeed locally
      console.log('✅ Logout completed with warnings');
    }
  }

  async getCurrentUser() {
    return this.makeRequest('/api/auth/user');
  }

  // Subscription routes - matching web routes exactly
  async createSubscription() {
    return this.makeRequest('/api/create-subscription', {
      method: 'POST',
    });
  }

  async getSubscriptionStatus() {
    return this.makeRequest('/api/subscription-status');
  }

  async refreshSubscription() {
    return this.makeRequest('/api/refresh-subscription', {
      method: 'POST',
    });
  }

  // Dashboard and user data
  async getDashboardData(): Promise<DashboardData> {
    return this.makeRequest('/api/dashboard');
  }

  async getCourseStats(languageCode?: string, skillLevelCode?: string): Promise<CourseStats> {
    const params = new URLSearchParams();
    if (languageCode) params.append('languageCode', languageCode);
    if (skillLevelCode) params.append('skillLevelCode', skillLevelCode);
    const queryString = params.toString();
    return this.makeRequest(`/api/course-stats${queryString ? `?${queryString}` : ''}`);
  }

  // Courses and lessons
  async getCourses(language: string, skillLevel?: string) {
    const params = new URLSearchParams({ language });
    if (skillLevel) {
      params.append('skillLevel', skillLevel);
    }
    return this.makeRequest(`/api/courses/${language}`);
  }

  async getLesson(language: string, courseId: string, lessonId: string) {
    return this.makeRequest(`/api/courses/${language}/${courseId}/${lessonId}`);
  }

  // NEW: Get lesson data with proper API format - matching web route
  async getLessonData(language: string, courseId: string, lessonId: string) {
    return this.makeRequest(`/api/courses/${language}/${courseId}/${lessonId}`);
  }

  async submitLessonProgress(data: any) {
    return this.makeRequest('/api/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Update progress - matching web format exactly
  async updateProgress(data: {
    language?: string;
    courseId: string;
    lessonId: string;
    stepNumber?: number;
    completed: boolean;
    score?: number;
    completedAt?: Date;
  }) {
    return this.makeRequest('/api/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Progress tracking
  async getUserProgress(language: string) {
    return this.makeRequest(`/api/progress/${language}`);
  }

  async getUserSettings(): Promise<UserSettings> {
    return this.makeRequest('/api/settings');
  }

  async updateUserSettings(settings: any) {
    return this.makeRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Checkpoints
  async getAvailableCheckpoints() {
    return this.makeRequest('/api/available-checkpoints');
  }

  async getCheckpoint(checkpointId: number) {
    return this.makeRequest(`/api/checkpoint/${checkpointId}`);
  }

  async getCheckpointByNumber(checkpointNumber: number) {
    return this.makeRequest(`/api/checkpoint/number/${checkpointNumber}`);
  }

  async submitCheckpointProgress(data: any) {
    return this.makeRequest('/api/checkpoint-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Submit checkpoint answers - matching web checkpoint functionality
  async submitCheckpointAnswers(checkpointId: number, answers: Array<{
    questionId: number;
    selectedAnswer: string;
  }>) {
    return this.makeRequest('/api/checkpoint-progress', {
      method: 'POST',
      body: JSON.stringify({
        checkpointId,
        answers,
        completed: true,
        completedAt: new Date().toISOString()
      }),
    });
  }

  // Next lesson
  async getNextLesson(): Promise<NextLessonData | null> {
    return this.makeRequest('/api/next-lesson');
  }

  async getUpcomingLessons(): Promise<{ lessons: any[], timestamp: number }> {
    return this.makeRequest('/api/upcoming-lessons');
  }

  // Analytics
  async trackPageView(data: {
    page: string;
    referrer?: string;
    userAgent?: string;
  }) {
    return this.makeRequest('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Get analytics data - matching web analytics functionality
  async getAnalytics(queryParams?: string) {
    const endpoint = queryParams ? `/api/analytics${queryParams}` : '/api/analytics';
    return this.makeRequest(endpoint);
  }

  // Notification setup
  async updateNotificationSetupStatus(hasSeenNotificationSetup: boolean) {
    return this.makeRequest('/api/notification-setup-status', {
      method: 'PUT',
      body: JSON.stringify({ hasSeenNotificationSetup }),
    });
  }

  // Languages and skill levels
  async getLanguages() {
    return this.makeRequest('/api/languages');
  }

  async getSkillLevels() {
    return this.makeRequest('/api/skill-levels');
  }

  // NEW: Get courses with relations - matching web course-manager functionality
  async getCoursesWithRelations(queryParams?: string) {
    const endpoint = queryParams ? `/api/db/courses?${queryParams}` : '/api/db/courses';
    return this.makeRequest(endpoint);
  }

  // NEW: Create course - matching web course-manager functionality
  async createCourse(data: {
    title: string;
    description?: string;
    languageId: number;
    skillLevelId: number;
    courseNumber?: number;
    isActive?: boolean;
  }) {
    return this.makeRequest('/api/db/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // NEW: Update course - for future course management functionality
  async updateCourse(courseId: number, data: {
    title?: string;
    description?: string;
    languageId?: number;
    skillLevelId?: number;
    courseNumber?: number;
    isActive?: boolean;
  }) {
    return this.makeRequest(`/api/db/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // NEW: Delete course - for future course management functionality
  async deleteCourse(courseId: number) {
    return this.makeRequest(`/api/db/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  // NEW: Get course mapping - matching web functionality
  async getCourseMapping(languageCode: string) {
    return this.makeRequest(`/api/course-mapping/${languageCode}`);
  }

  // Debug method to check API connectivity
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/languages`);
      return {
        status: response.status,
        baseUrl: API_BASE_URL,
        connected: response.ok
      };
    } catch (error) {
      return {
        status: 'error',
        baseUrl: API_BASE_URL,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  
}

export const apiClient = new ApiClient();