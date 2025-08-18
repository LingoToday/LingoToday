import { Globe } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/ui/footer";

export default function Approach() {
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

      {/* Approach Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Approach</h1>
          
          <div className="space-y-8">
            <div className="text-gray-600 leading-relaxed text-lg space-y-6">
              <p>
                We believe small, regular steps add up to big results.
              </p>
              <p>
                Our approach is built on proven learning science, combining micro-learning with spaced repetition and retrieval practice. Instead of cramming or setting aside big blocks of time, you get a series of quick 1–2 minute lessons spaced throughout your workday.
              </p>
              <p>This means:</p>
              
              <div className="space-y-4 ml-4">
                <div>
                  <p><strong>Minimum disruption</strong> – You can keep your workflow intact while still progressing.</p>
                </div>
                <div>
                  <p><strong>Better retention</strong> – Revisiting concepts at spaced intervals locks them into long-term memory.</p>
                </div>
                <div>
                  <p><strong>Lower effort, higher consistency</strong> – Because each lesson is so short, it's easier to stick with it.</p>
                </div>
                <div>
                  <p><strong>Real skills, built daily</strong> – Small doses of focused practice compound over time into real conversational ability.</p>
                </div>
              </div>
              
              <p>
                LingoToday turns your desk into your classroom — without the overwhelm, without the guilt, and without the need to find "extra time."
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}