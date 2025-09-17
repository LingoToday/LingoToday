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

export default function Landing() {
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');
  
  const prices = {
    GBP: {
      pro: {
        monthly: '£2.49',
        yearly: '£39.99'
      },
      plus: {
        monthly: '£16.99',
        yearly: '£149.99'
      }
    },
    USD: {
      pro: {
        monthly: '$6.99',
        yearly: '$59.99'
      },
      plus: {
        monthly: '$24.99',
        yearly: '$219.99'
      }
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
                className="border-gray-300 text-gray-700 font-medium px-3 sm:px-4 py-2 rounded-full hover:bg-gray-50 text-[13px]"
                onClick={() => window.location.href = "/sign-in"}
              >
                Sign In
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-3 sm:px-6 py-2 rounded-full text-[13px] sm:text-base"
                onClick={() => window.location.href = "/onboarding"}
              >
                <span className="hidden sm:inline text-[13px]">Use For Free</span>
                <span className="sm:hidden">Use For Free</span>
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
            
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">Micro language lessons on your laptop - backed by science.</h1>
            
            <div className="mb-8 max-w-3xl lg:max-w-none">
              <div className="text-xl text-gray-600 space-y-4">
                <p>Text, audio, video, and two way AI character conversations using official CEFR course structures.</p>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
                onClick={() => window.location.href = "/onboarding"}
                data-testid="button-hero-trial"
              >Use For Free</Button>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative lg:order-last lg:-mx-[10%]">
            <img 
              src={heroDevicesImage} 
              alt="LingoToday notifications on desktop and mobile devices showing Italian language learning"
              className="w-full h-auto max-w-lg mx-auto lg:max-w-none lg:w-[108%] lg:mx-0 lg:ml-auto"
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
                    <p className="text-sm text-gray-500">Learn in the Moment</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Step into real-life situations with interactive "in-the-scene" video lessons. Practice language as if you were there — from ordering in a café to asking for directions in the Tuscan countryside.
                </p>
                <div className="relative rounded-lg overflow-hidden max-w-[200px] mx-auto">
                  <video 
                    src={immersionVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: '9/16' }}
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.volume = 0;
                      video.muted = true;
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>

            {/* Micro Learning Science */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Micro Learning</h4>
                    <p className="text-sm text-gray-500">Science-Backed Learning Method</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Research shows learning in small, frequent sessions improves retention by up to 80% compared to cramming. Our micro-lessons work with your brain's natural learning patterns.
                </p>
                <div className="flex justify-center items-center">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg w-full max-w-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">80%</div>
                      <div className="text-xs text-gray-600">Better retention with micro-learning</div>
                    </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift relative">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{currency === 'GBP' ? '£0' : '$0'}</span>
                    <span className="text-gray-500 text-sm">/forever</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Daily notifications & micro-lessons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Streaks, badges & progress charts</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">1 video & scenario based lesson per day</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Referral unlocks</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">1 language</span>
                    </li>
                  </ul>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                    onClick={() => window.location.href = "/onboarding"}
                    data-testid="button-free-plan"
                  >
                    Get Started Free
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan - Popular */}
            <Card className="bg-white border-2 border-primary shadow-card hover-lift relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg text-gray-400 line-through">{currency === 'GBP' ? '£4.99' : '$9.99'}</span>
                      <span className="text-3xl font-bold text-gray-900">{prices[currency].pro.monthly}</span>
                    </div>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Full access to all video & scenario based lessons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Early access to mobile app features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Custom lesson notifications</span>
                    </li>
                    
                  </ul>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                    onClick={() => window.location.href = "/onboarding"}
                    data-testid="button-pro-plan"
                  >
                    Start Pro
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plus Plan */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift relative">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Plus</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{prices[currency].plus.monthly}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Everything in Pro, plus:</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Full multi-language unlock (Italian, Spanish, French, German, etc)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Learn with a interactive AI character</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Early access to new features</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Choose your video learning character</span>
                    </li>
                  </ul>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    onClick={() => window.location.href = "/onboarding"}
                    data-testid="button-plus-plan"
                  >
                    Go Plus
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">No credit card required • Cancel anytime</p>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 border border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Smarter Language Learning,<br />
            <span className="text-primary">Finally on Desktop & Mobile</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">There are thousands of language apps. This isn't one of them. LingoToday is for people who want to learn while they work — not after. Just hit start and micro-learn your way to a new language.</p>
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
