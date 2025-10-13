// Authentication utilities for React Native app

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message) || 
         error.message.includes('Unauthorized') ||
         error.message.includes('401');
}

export function isForbiddenError(error: Error): boolean {
  return /^403: .*Forbidden/.test(error.message) ||
         error.message.includes('Forbidden') ||
         error.message.includes('403');
}

export function isNetworkError(error: Error): boolean {
  return error.message.includes('Network Error') ||
         error.message.includes('Network request failed') ||
         error.message.includes('fetch');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  if (isValidPassword(password)) return 'strong';
  return 'medium';
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}