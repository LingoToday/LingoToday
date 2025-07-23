import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">DeskLingo</h1>
            </div>
            
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Learn Languages<br />
            <span className="text-primary-500">While You Work</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            DeskLingo delivers micro-lessons through gentle desktop notifications at your chosen intervals. 
            No apps to open, no active study time required.
          </p>
          <Button 
            size="lg" 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started Free
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="shadow-material">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Notifications</h3>
              <p className="text-gray-600 text-sm">
                Gentle desktop alerts at intervals you choose - 15, 30, or 60 minutes.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-secondary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Micro Lessons</h3>
              <p className="text-gray-600 text-sm">
                Quick, focused lessons designed for busy professionals and students.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-success-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">
                Keep track of your learning streak and completed lessons automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="text-warning-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multiple Languages</h3>
              <p className="text-gray-600 text-sm">
                Choose from Spanish, Italian, French, and German with more coming soon.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl shadow-material p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Your Language</h3>
              <p className="text-gray-600">
                Select from Spanish, Italian, French, or German and set your notification frequency.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Gentle Reminders</h3>
              <p className="text-gray-600">
                Receive desktop notifications with quick language prompts while you work.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Learn & Track Progress</h3>
              <p className="text-gray-600">
                Click notifications for quick lessons and watch your progress grow over time.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of learners who are building language skills while they work.
          </p>
          <Button 
            size="lg" 
            className="bg-primary-500 hover:bg-primary-600 text-white"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign Up Now - It's Free
          </Button>
        </div>
      </main>
    </div>
  );
}
