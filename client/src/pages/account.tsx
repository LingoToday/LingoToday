import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, User, Mail, Calendar, BookOpen, Award, Globe, Crown } from 'lucide-react';
import { format } from 'date-fns';

// Type definitions
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
  authProvider?: string;
  priceTier?: string;
  createdAt?: string;
}

interface DashboardData {
  user: User;
  stats: {
    streak: number;
    lessonsCompleted: number;
    wordsLearned: number;
    totalTimeSpent: number;
  };
}

// Helper function to get language display name
function getLanguageDisplayName(code: string): string {
  const languages: { [key: string]: string } = {
    italian: 'Italian',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    portuguese: 'Portuguese',
    mandarin: 'Mandarin',
    japanese: 'Japanese',
    korean: 'Korean',
  };
  return languages[code.toLowerCase()] || code.charAt(0).toUpperCase() + code.slice(1);
}

// Helper function to get learning tier from price tier
function getLearningTier(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier.startsWith('pro-')) {
    return 'Pro';
  }
  if (priceTier.startsWith('plus-')) {
    return 'Plus';
  }
  return 'Free';
}

export default function Account() {
  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch dashboard data to get progress stats
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your account.</p>
          <Link href="/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.firstName || 'User'}</span>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card data-testid="personal-info-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <div className="text-lg font-medium text-gray-900" data-testid="user-name">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.email || 'Not provided'
                    }
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900" data-testid="user-email">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900" data-testid="member-since">
                      {memberSince 
                        ? format(memberSince, 'MMMM d, yyyy')
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Learning Tier</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <Badge 
                      variant={getLearningTier(user.priceTier) === 'Free' ? 'secondary' : 'default'}
                      className={`${getLearningTier(user.priceTier) === 'Pro' ? 'bg-blue-600 text-white' : 
                        getLearningTier(user.priceTier) === 'Plus' ? 'bg-purple-600 text-white' : ''}`}
                      data-testid="learning-tier"
                    >
                      {getLearningTier(user.priceTier)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Profile */}
          <Card data-testid="learning-profile-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Learning Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Language Course</label>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-medium text-blue-600" data-testid="learning-language">
                      {user.selectedLanguage 
                        ? getLanguageDisplayName(user.selectedLanguage)
                        : 'Not selected'
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Current Level</label>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <Badge className="bg-purple-600 text-white" data-testid="current-level">
                      {user.selectedLevel 
                        ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase()
                        : 'Not selected'
                      }
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Onboarding Status</label>
                  <Badge 
                    variant={user.completedOnboarding ? "default" : "secondary"}
                    className={user.completedOnboarding ? "bg-green-600 text-white hover:bg-green-700" : ""}
                  >
                    {user.completedOnboarding ? 'Completed' : 'Incomplete'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Progress */}
          <Card data-testid="learning-progress-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600" data-testid="lessons-completed">
                    {stats?.lessonsCompleted || 0}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">Lessons Completed</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-600" data-testid="current-streak">
                    {stats?.streak || 0}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Day Streak</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600" data-testid="words-learned">
                    {stats?.wordsLearned || 0}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Words Learned</div>
                </div>
                
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600" data-testid="total-time">
                    {stats?.totalTimeSpent 
                      ? `${Math.round(stats.totalTimeSpent / 60)}m`
                      : '0m'
                    }
                  </div>
                  <div className="text-sm text-amber-800 font-medium">Total Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start" data-testid="go-to-dashboard">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </Link>
              
              <Link href="/courses">
                <Button variant="outline" className="w-full justify-start" data-testid="browse-courses">
                  <Globe className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  if (confirm('Are you sure you want to log out?')) {
                    window.location.href = "/api/logout";
                  }
                }}
                data-testid="logout-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}