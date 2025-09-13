import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DashboardData, CourseStats } from '../types';

// Dynamic API base URL detection for different device types
function getApiBaseUrl(): string {
  if (!__DEV__) {
    return 'https://your-production-url.com';
  }
  
  // Development environment - detect device type
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  
  // For React Native apps in development
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // For real Android devices, you'll need your computer's IP address
    // You can find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
    return 'http://10.0.2.2:5000';
  }
  
  if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    // For real iOS devices, you'll need your computer's IP address
    return 'http://localhost:5000';
  }
  
  return 'http://localhost:5000';
}

const API_BASE_URL = getApiBaseUrl();

export class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private async removeAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store the JWT token if login was successful
    if (response.token) {
      await this.setAuthToken(response.token);
    }
    
    return response;
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    
    // Store the JWT token if registration was successful
    if (response.token) {
      await this.setAuthToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      // Don't call server logout for token-based auth, just remove the token
      await this.removeAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
      // Always remove token even if there's an error
      await this.removeAuthToken();
    }
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