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
import heroDevicesImage from "@assets/Group 91_1755541972375.png";

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
                <p>Short micro lessons delivered by notifications to your laptop or phone. Using learning methods backed by science.</p>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-full"
                onClick={() => window.location.href = "/onboarding"}
                data-testid="button-hero-trial"
              >Try it Free for 7 Days</Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center lg:text-left">
              No Credit Card Required
            </p>
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

            {/* Speaking Practice */}
            <Card className="bg-white border border-gray-200 shadow-card hover-lift group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Speaking Practice</h4>
                    <p className="text-sm text-gray-500">Real-Time Pronunciation Feedback</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Practice speaking with AI-powered pronunciation analysis that gives instant feedback on your accent, rhythm, and fluency to help you sound more natural.
                </p>
                <div className="flex justify-center items-center">
                  <img 
                    src={speakingPracticeImage} 
                    alt="Woman speaking into a phone for language practice" 
                    className="w-56 h-40 object-cover rounded-lg"
                  />
                </div>
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
                      <span className="text-gray-700">Custom notification frequency</span>
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
                      <span className="text-gray-700">Real World Immersion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Speaking Practice</span>
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
                      <span className="text-gray-700">Custom notification frequency</span>
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
                      <span className="text-gray-700">Real World Immersion</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Speaking Practice</span>
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
            <p className="text-sm text-gray-500">Both plans include a 5-day free trial. No Credit Card Required.</p>
          </div>
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
