import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Mail, Lock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function SignIn() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Check if Google OAuth is available
      const response = await fetch('/api/auth/google');
      if (response.status === 503) {
        alert('Google authentication is not currently available. Please try email sign in instead.');
        return;
      }
      
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      alert('Unable to connect to Google authentication. Please try email sign in.');
    }
  };

  const handleGitHubAuth = async () => {
    try {
      // Check if GitHub OAuth is available
      const response = await fetch('/api/auth/github');
      if (response.status === 503) {
        alert('GitHub authentication is not currently available. Please try email sign in instead.');
        return;
      }
      
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/github';
    } catch (error) {
      alert('Unable to connect to GitHub authentication. Please try email sign in.');
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setLoginErrors({});
    
    // Validation
    const errors: Record<string, string> = {};
    if (!loginData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) errors.email = 'Please enter a valid email';
    if (!loginData.password) errors.password = 'Password is required';
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email.trim(),
          password: loginData.password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Successful login, redirect to dashboard
        window.location.href = '/';
      } else {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((error: any) => {
            fieldErrors[error.path?.[0] || 'general'] = error.message;
          });
          setLoginErrors(fieldErrors);
        } else {
          setLoginErrors({ general: data.message || 'Login failed. Please check your credentials.' });
        }
      }
    } catch (error) {
      setLoginErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Globe className="text-white text-lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LingoToday</h1>
        </Link>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/onboarding" className="font-medium text-primary hover:text-primary/80">
            start your free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="py-8 px-6">
            {/* OAuth Authentication Options */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-4">Quick Sign In</h3>
              </div>
              
              <Button 
                onClick={handleGoogleAuth}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button 
                onClick={handleGitHubAuth}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Sign in with your existing account from these providers
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <hr className="flex-1 border-gray-200" />
              <span className="text-sm text-gray-500 font-medium">OR</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            {/* Email Sign In Form */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-4">Sign In with Email</h3>
              </div>

              {loginErrors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {loginErrors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${loginErrors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {loginErrors.email && <p className="text-red-500 text-sm mt-1">{loginErrors.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 ${loginErrors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {loginErrors.password && <p className="text-red-500 text-sm mt-1">{loginErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="#" className="font-medium text-primary hover:text-primary/80">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/onboarding" className="font-medium text-primary hover:text-primary/80">
              Start your free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}