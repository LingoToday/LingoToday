import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users, Clock, Brain, Target, CheckCircle } from "lucide-react";

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
            <Clock className="w-4 h-4" />
            Start learning in under 60 seconds
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Learn a Language Without<br />
            <span className="text-primary">Leaving Your Desk</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            DeskLingo is a smarter way to learn languages — built for people who spend their day on a laptop. 
            No long lessons. No phone apps. Just short, well-timed language prompts that show up on your desktop while you work. Backed by science. Built for real life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
              onClick={() => window.location.href = "/api/login"}
            >
              Get your first 5 lessons free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-full hover:bg-gray-50"
              onClick={() => window.location.href = "/api/login"}
            >
              Try It Free
            </Button>
          </div>
        </div>

        {/* Target Audience Section */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="flex items-center gap-2 text-gray-500">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">You work at a desk</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium">You like efficient learning</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">You want steady progress</span>
          </div>
        </div>

        {/* Features Cards */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why This Works?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Traditional language learning expects you to block out 15–60 minutes a day, open an app, and grind through a course. Most people quit in a week. 
            DeskLingo flips that. You stay at your desk. We deliver focused micro-lessons — 2 to 3 minutes each — across your day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <Brain className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Spaced repetition</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                You learn better when content is repeated over time. We deliver lessons when your brain is most likely to retain them.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                <Zap className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Microlearning</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Short, focused lessons mean lower cognitive load and higher engagement. It fits into your day without demanding it.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                <TrendingUp className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">The science backs it</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Studies show people retain up to 80% more when they learn in small bursts with spaced reviews vs. one big session.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Globe className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple Steps to<br />
            <span className="text-primary">Language Mastery</span>
          </h2>
          {/* How It Works Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Step 1 */}
            <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Pick your language and goals
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Choose from Italian, Spanish, German, French, and more to come soon
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Set your notifications frequency for the day
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Each one is quick and focused — a phrase, rule, or word that actually matters
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Click the notifications to complete the micro lesson
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  See the full lesson, hear the translated audio, test your memory, and get cultural context
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="bg-white border border-gray-200 hover-lift group shadow-card">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full text-xl font-bold mb-4">
                  4
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Track your progress
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  See your progress and how far you have to reach your goals. Smart review system brings content back when it's at risk of being forgotten
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-green-600 text-sm font-medium mb-4">
                See Real Progress (Without the Overwhelm)
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Built for your work setup
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Whether you're writing emails, working in Figma, or coding in VS Code — DeskLingo drops in when you've got a moment. 
                You learn without needing to "find time." Most learning platforms are mobile-first. DeskLingo is built for desktop.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-full"
                onClick={() => window.location.href = "/api/login"}
              >
                Try It Now
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white border border-gray-200 shadow-card p-6 rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-900 font-medium">Fits into your day</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-900 font-medium">Builds a daily habit</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-900 font-medium">Keeps your brain engaged</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-900 font-medium">Actually sticks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 border border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Smarter Language Learning,<br />
            <span className="text-primary">Finally on Desktop</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            There are thousands of language apps. This isn't one of them. DeskLingo is for people who want to learn while they work — not after.
            No signup delays. No app stores. Just hit start and learn right in your browser.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
            onClick={() => window.location.href = "/api/login"}
          >
            🎯 Try it now. It takes less time than reading this page.
          </Button>
        </div>
      </main>
    </div>
  );
}
