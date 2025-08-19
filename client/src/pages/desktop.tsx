import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users, Clock, Brain, Target, CheckCircle, MessageSquare, Crown, Volume2, Headphones, Smartphone, Video, Mic } from "lucide-react";
import { SiSlack, SiWhatsapp } from "react-icons/si";
import Footer from "@/components/ui/footer";
import desktopImage from "@assets/Group 97_1755526583226.png";
import mobileAppImage from "@assets/Group 77_1755208831106.png";
import immersionVideo from "@assets/Grok-Video-32DC88E3-42B1-46FE-BBEA-8BDFB1F94C59 copy_1755209004432.mov";
import speakingPracticeImage from "@assets/speaking-practice-image.png";
import heroDevicesImage from "@assets/Group 85 (1)_1755545239041.png";

export default function Desktop() {
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
                variant="outline"
                className="border-gray-300 text-gray-700 font-medium px-3 sm:px-4 py-2 rounded-full hover:bg-gray-50 text-sm sm:text-base"
                onClick={() => window.location.href = "/sign-in"}
              >
                Sign In
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-3 sm:px-6 py-2 rounded-full text-sm sm:text-base"
                onClick={() => window.location.href = "/onboarding"}
              >
                <span className="hidden sm:inline">Try it Free for 7 Days</span>
                <span className="sm:hidden">Free Trial</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          {/* Left side - Content */}
          <div className="text-center lg:text-left">
            
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The Most Effective Way to Learn a Language
            </h1>
            
            <div className="mb-8 max-w-3xl lg:max-w-none">
              <div className="text-xl text-gray-600 space-y-4">
                <p>Short micro lessons delivered by browser notifications to your laptop. Using learning methods backed by science.</p>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
                onClick={() => window.location.href = "/onboarding"}
                data-testid="button-hero-trial"
              >Join For Free</Button>
            </div>
            
            
          </div>

          {/* Right side - Image */}
          <div className="relative lg:order-last">
            <img 
              src={heroDevicesImage} 
              alt="LingoToday notifications on desktop and mobile devices showing Italian language learning"
              className="w-full h-auto max-w-lg mx-auto lg:mx-0 lg:ml-auto"
            />
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

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          <div className="flex flex-col space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Spaced repetition</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You learn better when content is repeated over time. We deliver lessons when your brain is most likely to retain them.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Microlearning</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Short, focused lessons mean lower cognitive load and higher engagement. It fits into your day without demanding it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-purple-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">The science backs it</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Studies show people retain up to 80% more when they learn in small bursts with spaced reviews vs. one big session.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src={desktopImage} 
              alt="LingoToday desktop notification showing Italian lesson with analytics dashboard in background"
              className="w-full h-auto rounded-lg"
            />
          </div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Set notifications frequency for the day</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Set your notifications for every 30 minutes, 1 hour, or custom. Each one is quick and focused — a phrase, rule, or word that actually matters</p>
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

        {/* Coming Soon Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
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
                <p className="text-gray-600 text-sm leading-relaxed mb-4">Take LingoToday beyond your desk. Our mobile app keeps your learning streak alive so your progress never pauses.</p>
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={mobileAppImage} 
                    alt="Mobile phone showing LingoToday notification on lock screen for Italian lesson"
                    className="w-full h-auto object-contain"
                  />
                </div>
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
                    <p className="text-sm text-gray-500">See It, Speak It, Live It</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">Learn phrases in context with immersive video scenarios. Watch real conversations from native speakers in everyday situations.</p>
                <div className="relative rounded-lg overflow-hidden">
                  <video 
                    src={immersionVideo}
                    className="w-full h-auto object-contain"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' fill='%236b7280'%3EReal-World Video%3C/text%3E%3C/svg%3E"
                    controls
                    muted
                    preload="metadata"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Speaking Practice */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Speaking Practice</h4>
                    <p className="text-sm text-gray-500">Build Confidence Through Conversation</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">Practice pronunciation and conversation with AI-powered speech recognition. Get instant feedback on your accent and fluency.</p>
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={speakingPracticeImage} 
                    alt="Speaking practice interface with waveform visualization"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Loved by language learners worldwide
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">See what our community says about their learning journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-4 h-4 text-yellow-400 fill-current">★</div>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  "The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday. I've learned more Italian in 3 months than I did in 2 years of trying other apps."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">SM</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Sarah Martinez</p>
                    <p className="text-gray-500 text-xs">Product Manager, San Francisco</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-4 h-4 text-yellow-400 fill-current">★</div>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  "As a busy parent, finding time to learn French seemed impossible. LingoToday changed that completely. 30 seconds here and there, and I'm actually having conversations with my French neighbors!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">JK</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">James Kim</p>
                    <p className="text-gray-500 text-xs">Teacher, Toronto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-4 h-4 text-yellow-400 fill-current">★</div>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  "I tried Duolingo, Babbel, everything. But LingoToday's spaced repetition actually works. I remember words months later without trying. My German colleagues are impressed!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">AL</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Anna Liu</p>
                    <p className="text-gray-500 text-xs">Software Engineer, Berlin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Crown className="w-4 h-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Your Language Journey Today
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Choose the plan that fits your learning style. No hidden fees, cancel anytime.
            </p>

            {/* Currency Toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className={`text-sm font-medium ${currency === 'GBP' ? 'text-primary' : 'text-gray-500'}`}>GBP</span>
              <button 
                onClick={() => setCurrency(currency === 'GBP' ? 'USD' : 'GBP')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currency === 'USD' ? 'translate-x-6' : 'translate-x-1'
                  }`} 
                />
              </button>
              <span className={`text-sm font-medium ${currency === 'USD' ? 'text-primary' : 'text-gray-500'}`}>USD</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift relative">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Monthly</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{prices[currency].monthly}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Unlimited micro-lessons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Smart notification timing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Progress tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Spaced repetition system</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Multiple languages</span>
                    </li>
                  </ul>

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
            <Card className="bg-white border-2 border-primary shadow-card hover-lift relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Yearly</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">{prices[currency].yearly}</span>
                    <span className="text-gray-500 text-sm">/year</span>
                  </div>
                  <p className="text-green-600 text-sm font-medium mb-6">Save {prices[currency].savings} per year!</p>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Everything in Monthly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Priority customer support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Early access to new features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Custom learning goals</span>
                    </li>
                  </ul>

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

          <p className="text-center text-gray-500 text-sm mt-8">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about LingoToday
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">How do the notifications work?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  LingoToday sends you smart micro-lessons throughout your day via browser notifications. Each lesson takes 30-60 seconds and appears at optimal intervals using spaced repetition science. You can customize the frequency and timing to match your schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">What languages are available?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Currently, we offer Italian, Spanish, French, and German with more languages coming soon. Each course is designed by native speakers and linguists to ensure authentic, practical learning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Can I use LingoToday on mobile?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Yes! LingoToday works on any device with a web browser. Our mobile app is coming soon and will sync seamlessly with your desktop progress, so you never miss a lesson.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">What makes LingoToday different from other apps?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Unlike traditional language apps that require dedicated study time, LingoToday integrates learning into your existing routine through intelligent notifications. Our spaced repetition system and micro-learning approach are scientifically proven to improve retention by up to 80%.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Is there really no credit card required for the free trial?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Absolutely! Start your 7-day free trial with just an email address. No credit card, no hidden fees. If you love LingoToday, you can upgrade to a paid plan after your trial ends.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll retain access to your courses until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-3xl p-12 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Language Learning?
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands who are already learning smarter, not harder. Start your journey today with a free trial.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-4 rounded-full text-lg"
                onClick={() => window.location.href = "/onboarding"}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 font-medium px-8 py-4 rounded-full text-lg hover:bg-gray-50"
                onClick={() => window.location.href = "/sign-in"}
              >
                Sign In
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}