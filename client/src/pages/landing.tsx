import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DeskLingo</h1>
            </div>
            
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2 rounded-full"
              onClick={() => window.location.href = "/api/login"}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            4900+ 5 Stars Reviews
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Easy language learning<br />
            <span className="text-primary">for your remote work</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Streamline your language learning, manage micro-lessons, and empower your brain with DeskLingo — the all-in-one language learning solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
              onClick={() => window.location.href = "/api/login"}
            >
              Book a Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-full hover:bg-gray-50"
              onClick={() => window.location.href = "/api/login"}
            >
              Contact Sales
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons Section */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="flex items-center gap-2 text-gray-500">
            <Zap className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Quick Action Buttons</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium">Clean and Minimal Layout</span>
          </div>
        </div>

        {/* Features Cards */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What makes us different</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Simplify language learning, streamline micro-lessons, and boost productivity all with DeskLingo language learning solution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <Bell className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Activity tracking & insights</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                DeskLingo is built to work seamlessly on desktop devices, ensuring you stay connected to your learning goals.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                <BookOpen className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Task prioritization</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Organize your lessons by priority levels to make sure you focus on what matters most for your learning.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                <TrendingUp className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Team collaboration</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Collaborate effortlessly with your learning community, no matter where they are, in real-time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <BookOpen className="w-4 h-4" />
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful features to<br />
            <span className="text-primary">boost your daily workflow</span>
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Simplify language learning, streamline micro-lessons, and boost productivity all with DeskLingo language learning solution
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium mb-4">
                In-app notifications and real-time feedback
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Seamless desktop integration
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Communicate and learn effortlessly with DeskLingo's real-time updates, built-in notifications, and lesson assignments.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-full"
                onClick={() => window.location.href = "/api/login"}
              >
                Book a Demo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white border border-gray-200 shadow-card p-6 rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Desktop Notifications</div>
                    <div className="text-sm text-gray-500">Gentle reminders for lessons</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Micro Learning</div>
                    <div className="text-sm text-gray-500">Quick 2-minute lessons</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 border border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Build a trendy learning habit<br />
            <span className="text-primary">within days, not weeks!</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            DeskLingo is the ultimate language learning platform designed for professionals and fast-growing minds.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started Now
          </Button>
        </div>
      </main>
    </div>
  );
}
