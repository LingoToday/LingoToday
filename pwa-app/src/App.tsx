import React from 'react';
import { Switch, Route } from 'wouter';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl text-white">📚</span>
          </div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LingoToday...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Switch>
        {isAuthenticated ? (
          <>
            <Route path="/" component={DashboardPage} />
            <Route path="/dashboard" component={DashboardPage} />
          </>
        ) : (
          <>
            <Route path="/" component={LoginPage} />
            <Route path="/login" component={LoginPage} />
          </>
        )}
        {/* Fallback to appropriate page based on auth status */}
        <Route>
          {isAuthenticated ? <DashboardPage /> : <LoginPage />}
        </Route>
      </Switch>
    </div>
  );
}

export default App;