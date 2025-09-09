import React from 'react';

interface BottomNavigationProps {
  activeTab: 'home' | 'profile';
  onTabChange: (tab: 'home' | 'profile') => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex">
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 py-3 text-center transition-colors ${
            activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <div className="text-2xl mb-1">🏠</div>
          <div className="text-xs font-medium">Home</div>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex-1 py-3 text-center transition-colors ${
            activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <div className="text-2xl mb-1">👤</div>
          <div className="text-xs font-medium">Profile</div>
        </button>
      </div>
    </div>
  );
}