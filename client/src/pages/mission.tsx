import { Globe } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/ui/footer";

export default function Mission() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">LingoToday</h1>
            </Link>
          </div>
        </div>
      </header>

      {/* Mission Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Mission</h1>
          
          <div className="space-y-8">
            <div className="text-gray-600 leading-relaxed text-lg space-y-6">
              <p>
                At LingoToday, our mission is simple: help busy people learn a new language without turning their lives upside down.
              </p>
              <p>
                We know that for many, phone apps and long study sessions just don't fit into the day. You're at your desk, focused on work — but you still want to grow, learn, and achieve your language goals.
              </p>
              <p>
                That's why we bring the lessons to you. In short, engaging bursts that pop up on your computer, LingoToday lets you learn without losing momentum in your day. We're here to make language learning possible for everyone — no matter how packed your schedule.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}