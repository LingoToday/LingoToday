import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users, Clock, Brain, Target, CheckCircle, Smartphone, Video, MessageSquare, Crown } from "lucide-react";
import Footer from "@/components/ui/footer";
import tuscanyImage from "@assets/ChatGPT Image Aug 11, 2025, 04_07_30 PM_1754921402519.png";

export default function Landing() {
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');
  
  const prices = {
    GBP: {
      monthly: '£3.99',
      yearly: '£14.99',
      savings: '£33'
    },
    USD: {
      monthly: '$6.99',
      yearly: '$20.99',
      savings: '$46'
    }
  };

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
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">LingoToday</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-3 sm:px-6 py-2 rounded-full text-sm sm:text-base"
                onClick={() => window.location.href = "/onboarding"}
              >
                <span className="hidden sm:inline">Try it Free for 7 Days</span>
                <span className="sm:hidden">Free Trial</span>
              </Button>
              <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-3 sm:px-6 py-2 rounded-full text-sm sm:text-base"
                onClick={() => window.location.href = "/sign-in"}
              >
                Sign In
              </Button>
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
            <span className="text-primary">Whilst You Work</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">LingoToday is a smarter way to learn languages — built for people who spend their day on a laptop. No long lessons. No phone apps. Just short, frequent lesson prompts that show up as desktop notifications whilst you work. </p>
          
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-12">
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
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the plan that works for you. Both include all current features and a 5-day free trial.
            </p>
            
            {/* Currency Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-full p-1 flex">
                <Button
                  onClick={() => setCurrency('GBP')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    currency === 'GBP'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  variant="ghost"
                >
                  £ GBP
                </Button>
                <Button
                  onClick={() => setCurrency('USD')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  variant="ghost"
                >
                  $ USD
                </Button>
              </div>
            </div>
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
                    <span className="text-4xl font-bold text-gray-900">{prices[currency].monthly}</span>
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
                    <span className="text-4xl font-bold text-gray-900">{prices[currency].yearly}</span>
                    <span className="text-gray-600 text-lg">/year</span>
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save {prices[currency].savings} per year
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
            className="bg-primary hover:bg-primary/90 text-white font-medium px-4 sm:px-8 py-3 rounded-full text-sm sm:text-base max-w-full"
            onClick={() => window.location.href = "/onboarding"}
          >
            <span className="hidden sm:inline">🎯 Try it now. It takes less time than reading this page.</span>
            <span className="sm:hidden">🎯 Try it now</span>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
