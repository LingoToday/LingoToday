// API service for connecting to the main LingoToday backend
const API_BASE_URL = 'http://localhost:5000'; // Your existing backend

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface DashboardData {
  user: User;
  stats: {
    currentStreak: number;
    totalLessonsCompleted: number;
    wordsLearned: number;
  };
  settings: {
    selectedLanguage: string;
    selectedLevel: string;
  };
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include cookies for session-based auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/user');
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/api/dashboard');
  }

  async logout(): Promise<void> {
    await this.request('/api/logout', { method: 'POST' });
  }
}

export const apiService = new ApiService();