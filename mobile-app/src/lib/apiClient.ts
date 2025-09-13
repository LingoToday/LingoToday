import AsyncStorage from '@react-native-async-storage/async-storage';
import { DashboardData, CourseStats } from '../types';

// Use the backend API URL - in development this would be localhost
const API_BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://your-production-url.com';

export class ApiClient {
  private async getSessionCookie(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('sessionCookie');
    } catch (error) {
      console.error('Error getting session cookie:', error);
      return null;
    }
  }

  private async setSessionCookie(cookie: string): Promise<void> {
    try {
      await AsyncStorage.setItem('sessionCookie', cookie);
    } catch (error) {
      console.error('Error setting session cookie:', error);
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const sessionCookie = await this.getSessionCookie();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Store session cookie if provided in response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      await this.setSessionCookie(setCookie);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async logout() {
    await this.makeRequest('/api/auth/logout', { method: 'POST' });
    await AsyncStorage.removeItem('sessionCookie');
  }

  async getCurrentUser() {
    return this.makeRequest('/api/auth/user');
  }

  // Dashboard and user data
  async getDashboardData(): Promise<DashboardData> {
    return this.makeRequest('/api/dashboard');
  }

  async getCourseStats(languageCode: string, skillLevelCode?: string): Promise<CourseStats> {
    const params = new URLSearchParams({ languageCode });
    if (skillLevelCode) {
      params.append('skillLevelCode', skillLevelCode);
    }
    return this.makeRequest(`/api/course-stats?${params.toString()}`);
  }

  // Courses and lessons
  async getCourses(language: string, skillLevel?: string) {
    const params = new URLSearchParams({ language });
    if (skillLevel) {
      params.append('skillLevel', skillLevel);
    }
    return this.makeRequest(`/api/courses?${params.toString()}`);
  }

  async getLesson(courseId: string, lessonId: string) {
    return this.makeRequest(`/api/lesson/${courseId}/${lessonId}`);
  }

  async submitLessonStep(data: any) {
    return this.makeRequest('/api/lesson-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Progress tracking
  async getUserProgress(language: string) {
    return this.makeRequest(`/api/progress/${language}`);
  }

  async updateUserSettings(settings: any) {
    return this.makeRequest('/api/user/settings', {
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

  async submitCheckpointAnswers(checkpointId: number, answers: any) {
    return this.makeRequest(`/api/checkpoint/${checkpointId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Onboarding
  async completeOnboarding(data: {
    selectedLanguage: string;
    selectedLevel: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.makeRequest('/api/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();