import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService, DashboardData } from '../services/api';
import { BottomNavigation } from '../components/BottomNavigation';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await apiService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-6 py-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Settings</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>🔔 Notifications</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>🌍 Language Preferences</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>🎯 Learning Goals</span>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Support</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>❓ Help & FAQ</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>💬 Contact Support</span>
                <span className="text-gray-400">›</span>
              </button>
              <button className="w-full px-4 py-4 text-left flex items-center justify-between">
                <span>ℹ️ About LingoToday</span>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-4 rounded-xl font-semibold"
          >
            Sign Out
          </button>
        </div>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Home Tab
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl text-white">📚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LingoToday</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {dashboardData?.stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {dashboardData.stats.currentStreak}
              </div>
              <div className="text-xs text-gray-500">Day Streak</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {dashboardData.stats.totalLessonsCompleted}
              </div>
              <div className="text-xs text-gray-500">Lessons</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {dashboardData.stats.wordsLearned}
              </div>
              <div className="text-xs text-gray-500">Words</div>
            </div>
          </div>
        )}

        {/* Today's Goal */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start">
            <div className="text-3xl mr-4">🎯</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Goal</h3>
              <p className="text-gray-600 mb-4">Complete your next lesson in {dashboardData?.settings.selectedLanguage}</p>
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
                Start Lesson
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button className="w-full px-4 py-4 text-left flex items-center">
              <span className="text-xl mr-3">📚</span>
              <span>Review Checkpoints</span>
            </button>
            <button className="w-full px-4 py-4 text-left flex items-center">
              <span className="text-xl mr-3">🗂️</span>
              <span>View All Courses</span>
            </button>
            <button className="w-full px-4 py-4 text-left flex items-center">
              <span className="text-xl mr-3">💬</span>
              <span>Practice Vocabulary</span>
            </button>
            <button className="w-full px-4 py-4 text-left flex items-center">
              <span className="text-xl mr-3">🔔</span>
              <span>Notification Settings</span>
            </button>
          </div>
        </div>

        {/* PWA Info */}
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-800 mb-2">📱 Progressive Web App</p>
          <p className="text-xs text-blue-600">
            Add to home screen for the best experience
          </p>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}