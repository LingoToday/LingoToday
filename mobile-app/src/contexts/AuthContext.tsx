import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../lib/apiClient';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
    selectedLanguage?: string,
    selectedLevel?: string,
    learningStyle?: string,
    notificationsEnabled?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  refreshAuth?: () => Promise<void>; // Add this method
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Platform-aware token checking
      let token: string | null = null;
      
      if (Platform.OS === 'web') {
        token = localStorage.getItem('authToken');
      } else {
        token = await SecureStore.getItemAsync('authToken');
      }
      
      if (!token) {
        setUser(null);
        return;
      }

      // Verify token with server
      const userData = await apiClient.getCurrentUser();
      
      if (userData && typeof userData === 'object' && !(userData as any).error) {
        // Handle different response formats
        const userObj = (userData as any).data || userData;
        setUser(userObj as User);
      } else {
        // Token is invalid, remove it
        if (Platform.OS === 'web') {
          localStorage.removeItem('authToken');
        } else {
          await SecureStore.deleteItemAsync('authToken');
        }
        setUser(null);
      }
    } catch (error) {
      console.log('No authenticated user found or token invalid:', error);
      // Clean up invalid token
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem('authToken');
        } else {
          await SecureStore.deleteItemAsync('authToken');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up auth token:', cleanupError);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);

      // Handle different response formats
      const responseData = (response as any).data || response;
      const userObj = responseData?.user || responseData;

      if (userObj && !(response as any).error) {
        setUser(userObj as User);
      } else {
        throw new Error((response as any).error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
    selectedLanguage?: string,
    selectedLevel?: string,
    learningStyle?: string,
    notificationsEnabled?: boolean
  ) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register({
        email,
        password,
        firstName,
        lastName,
        selectedLanguage,
        selectedLevel,
        learningStyle,
        notificationsEnabled,
      });

      // Handle different response formats
      const responseData = (response as any).data || response;
      const userObj = responseData?.user || responseData;

      if (userObj && !(response as any).error) {
        setUser(userObj as User);
      } else {
        throw new Error((response as any).error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Try to logout from server first
      await apiClient.logout();
    } catch (error) {
      console.error('Server logout error (continuing with local cleanup):', error);
      // Continue with local cleanup even if server request fails
    } finally {
      // Always clean up local state and token
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem('authToken');
        } else {
          await SecureStore.deleteItemAsync('authToken');
        }
      } catch (tokenError) {
        console.error('Error removing auth token:', tokenError);
      }
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Optionally persist updated user data
      // This could be useful for offline scenarios
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      
      if (userData && typeof userData === 'object' && !(userData as any).error) {
        const userObj = (userData as any).data || userData;
        setUser(userObj as User);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Don't throw - this is often called silently
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await apiClient.getCurrentUser();
      
      if (userData && typeof userData === 'object' && !(userData as any).error) {
        const userObj = (userData as any).data || userData;
        setUser(userObj as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('User not authenticated during refresh');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}