import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, BookOpen, TrendingUp, Sparkles, Zap, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
                <Globe className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">DeskLingo</h1>
            </div>
            
            <Button 
              className="btn-gradient-primary text-primary-foreground font-semibold hover-lift"
              onClick={() => window.location.href = "/api/login"}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            4900+ 5 Stars Reviews
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
            Easy language learning<br />
            <span className="text-gradient-primary">for your remote work</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Streamline your language learning, manage micro-lessons, and empower your brain with DeskLingo — the all-in-one language learning solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="btn-gradient-primary text-primary-foreground font-semibold px-8 py-4 text-lg hover-lift shadow-glow"
              onClick={() => window.location.href = "/api/login"}
            >
              Book a Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-secondary/10 border-secondary/20 text-foreground font-semibold px-8 py-4 text-lg hover-lift"
              onClick={() => window.location.href = "/api/login"}
            >
              Contact Sales
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons Section */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-5 h-5 text-secondary-500" />
            <span className="text-sm">Quick Action Buttons</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="text-sm">Clean and Minimal Layout</span>
          </div>
        </div>

        {/* Features Cards */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What makes us different</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Simplify language learning, streamline micro-lessons, and boost productivity all with DeskLingo language learning solution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="glass-card border-border/40 hover-lift group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Bell className="text-primary w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground mb-3 text-lg">Activity tracking & insights</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                DeskLingo is built to work seamlessly on desktop devices, ensuring you stay connected to your learning goals.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40 hover-lift group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="text-secondary-500 w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground mb-3 text-lg">Task prioritization</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Organize your lessons by priority levels to make sure you focus on what matters most for your learning.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40 hover-lift group">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-success-500/20 to-success-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-success-500 w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground mb-3 text-lg">Team collaboration</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Collaborate effortlessly with your learning community, no matter where they are, in real-time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-secondary-500/10 text-secondary-500 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <BookOpen className="w-4 h-4" />
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powerful features to<br />
            <span className="text-gradient-secondary">boost your daily workflow</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
            Simplify language learning, streamline micro-lessons, and boost productivity all with DeskLingo language learning solution
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                In-app notifications and real-time feedback
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Seamless desktop integration
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Communicate and learn effortlessly with DeskLingo's real-time updates, built-in notifications, and lesson assignments.
              </p>
              <Button 
                className="btn-gradient-primary text-primary-foreground font-semibold hover-lift"
                onClick={() => window.location.href = "/api/login"}
              >
                Book a Demo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-card p-8 rounded-3xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Desktop Notifications</div>
                    <div className="text-sm text-muted-foreground">Gentle reminders for lessons</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-500/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Micro Learning</div>
                    <div className="text-sm text-muted-foreground">Quick 2-minute lessons</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-br from-primary/5 to-secondary-500/5 rounded-3xl p-12 border border-border/40">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Build a trendy learning habit<br />
            <span className="text-gradient-primary">within days, not weeks!</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            DeskLingo is the ultimate language learning platform designed for professionals and fast-growing minds.
          </p>
          <Button 
            size="lg" 
            className="btn-gradient-primary text-primary-foreground font-semibold px-12 py-4 text-lg hover-lift shadow-glow"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started Now
          </Button>
        </div>
      </main>
    </div>
  );
}
