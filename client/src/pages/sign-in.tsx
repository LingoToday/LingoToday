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


            {/* Email Sign In Form */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-4">Welcome Back</h3>
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