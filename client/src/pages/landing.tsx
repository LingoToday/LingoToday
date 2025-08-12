import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users, Clock, Brain, Target, CheckCircle, Smartphone, Video, MessageSquare, Crown } from "lucide-react";
import Footer from "@/components/ui/footer";
import tuscanyImage from "@assets/ChatGPT Image Aug 11, 2025, 04_07_30 PM_1754921402519.png";

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
              <h1 className="text-xl font-bold text-gray-900">LingoToday</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-full"
                onClick={() => window.location.href = "/onboarding"}
              >
                Try it Free for 7 Days
              </Button>
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2 rounded-full flex items-center gap-2"
                  >
                    Sign In
                  </Button>
                    <div className="flex items-center gap-3 w-full">
                      <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>Continue with GitHub</span>
                    </div>
            </div>
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
            LingoToday is a smarter way to learn languages — built for people who spend their day on a laptop. 
            No long lessons. No phone apps. Just short, well-timed language prompts that show up on your desktop while you work. Backed by science. Built for real life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
              onClick={() => window.location.href = "/onboarding"}
            >Try it Free for 7 Days</Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-full hover:bg-gray-50"
              onClick={() => window.location.href = "/sign-in"}
            >
              Sign In
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

        {/* Language Selection Section */}
        <div className="text-center mb-16">
          <h2 className="md:text-3xl font-bold text-gray-900 mb-12 text-[36px]">I Want To Learn</h2>
          
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {/* French */}
            <div 
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/onboarding"}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors mb-3 relative">
                <div className="w-full h-full flex">
                  <div className="w-1/3 bg-blue-600"></div>
                  <div className="w-1/3 bg-white"></div>
                  <div className="w-1/3 bg-red-600"></div>
                </div>
              </div>
              <span className="text-gray-700 font-medium text-sm">French</span>
            </div>

            {/* Spanish */}
            <div 
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/onboarding"}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors mb-3 relative">
                <div className="w-full h-full flex flex-col">
                  <div className="h-1/3 bg-red-600"></div>
                  <div className="h-1/3 bg-yellow-400"></div>
                  <div className="h-1/3 bg-red-600"></div>
                </div>
              </div>
              <span className="text-gray-700 font-medium text-sm">Spanish</span>
            </div>

            {/* German */}
            <div 
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/onboarding"}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors mb-3 relative">
                <div className="w-full h-full flex flex-col">
                  <div className="h-1/3 bg-black"></div>
                  <div className="h-1/3 bg-red-600"></div>
                  <div className="h-1/3 bg-yellow-400"></div>
                </div>
              </div>
              <span className="text-gray-700 font-medium text-sm">German</span>
            </div>

            {/* Italian */}
            <div 
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/onboarding"}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors mb-3 relative">
                <div className="w-full h-full flex">
                  <div className="w-1/3 bg-green-600"></div>
                  <div className="w-1/3 bg-white"></div>
                  <div className="w-1/3 bg-red-600"></div>
                </div>
              </div>
              <span className="text-gray-700 font-medium text-sm">Italian</span>
            </div>
          </div>
        </div>

        {/* Features Cards */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why This Works?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Traditional language learning expects you to block out 15–60 minutes a day, open an app, and grind through a course. Most people quit in a week. 
            LingoToday flips that. You stay at your desk. We deliver focused micro-lessons — 2 to 3 minutes each — across your day.
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
                Whether you're writing emails, working in Figma, or coding in VS Code — LingoToday drops in when you've got a moment. 
                You learn without needing to "find time." Most learning platforms are mobile-first. LingoToday is built for desktop.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-full"
                onClick={() => window.location.href = "/onboarding"}
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

        {/* Coming Soon Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-purple-600 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Coming Soon
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              The Future of Language Learning
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mobile App */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Mobile App</h4>
                    <p className="text-sm text-gray-500">Continuous Learning Anywhere</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Take LingoToday beyond your desk. Our upcoming mobile app keeps your learning streak alive when you're away from your laptop, so your progress never pauses.
                </p>
              </CardContent>
            </Card>

            {/* Real-World Immersion */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Real-World Immersion</h4>
                    <p className="text-sm text-gray-500">Learn in the Moment</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Step into real-life situations with interactive "in-the-scene" video lessons. Practice language as if you were there — from ordering in a café to asking for directions in the Tuscan countryside.
                </p>
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={tuscanyImage} 
                    alt="Interactive scene in Tuscan countryside with tourists getting directions from a local"
                    className="w-full h-32 object-cover"
                  />
                  
                </div>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Integrations</h4>
                    <p className="text-sm text-gray-500">Learn Where You Already Work & Chat</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  LingoToday will soon connect directly to your favourite tools — Slack, Microsoft Teams, WhatsApp, and more — so language learning meets you where you are.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Simple, Fair Pricing
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works for you. Both include all current features and a 5-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group relative">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">£3.99</span>
                    <span className="text-gray-600 text-lg">/month</span>
                  </div>
                  
                  <div className="space-y-4 mb-8 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">All current features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Desktop notifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Progress tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Multiple languages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">5-day free trial</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-full"
                    onClick={() => window.location.href = "/onboarding"}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="bg-white border-2 border-primary shadow-card hover-lift group relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Best Value
                </div>
              </div>
              <CardContent className="p-8 pt-10">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Introduction Offer</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">£14.99</span>
                    <span className="text-gray-600 text-lg">/year</span>
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save £33 per year
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">All current features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">All future features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Desktop notifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Progress tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Multiple languages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">5-day free trial</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-full"
                    onClick={() => window.location.href = "/onboarding"}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Both plans include a 5-day free trial. Cancel anytime, no questions asked.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 border border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Smarter Language Learning,<br />
            <span className="text-primary">Finally on Desktop</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            There are thousands of language apps. This isn't one of them. LingoToday is for people who want to learn while they work — not after.
            No signup delays. No app stores. Just hit start and learn right in your browser.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
            onClick={() => window.location.href = "/onboarding"}
          >
            🎯 Try it now. It takes less time than reading this page.
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
