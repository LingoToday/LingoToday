import Constants from 'expo-constants';

// Configuration for connecting to the existing backend
export const API_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://localhost:5000' // Development - connect to local server
    : 'https://your-production-url.replit.app', // Production - replace with your actual URL
  timeout: 10000,
};

// For development, you may need to use your computer's IP address instead of localhost
// when testing on a physical device. Example: 'http://192.168.1.100:5000'
// You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

export const API_ENDPOINTS = {
  // Authentication endpoints (existing)
  login: '/api/auth/login',
  register: '/api/auth/register',
  user: '/api/auth/user',
  logout: '/api/logout',
  
  // Dashboard and data endpoints (existing)
  dashboard: '/api/dashboard',
  nextLesson: '/api/next-lesson',
  courseStats: '/api/course-stats',
  availableCheckpoints: '/api/available-checkpoints',
  
  // Mobile-specific endpoints (to be added to backend)
  registerPushToken: '/api/mobile/register-push-token',
  updateMobileSettings: '/api/mobile/settings',
};