import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play } from "lucide-react";
import { Link } from "wouter";
import LessonModal from "@/components/lesson-modal";

export default function LessonExample() {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  // Sample lesson data for demonstration
  const sampleLessons = [
    {
      id: "course1_lesson2",
      title: "Salve! (Hello - Polite)",
      category: "Greetings",
      emoji: "👋",
      content: {
        word: "Salve",
        translation: "Hello",
        example: "Salve, come sta?",
        exampleTranslation: "Hello, how are you?",
        note: "Polite but still friendly. Good for strangers or when you want to be respectful without being too formal."
      },
      quiz: {
        question: "Which phrase means 'Hello' (polite)?",
        options: ["Ciao", "Salve", "Buongiorno", "Buonanotte"],
        correct: 1
      }
    },
    {
      id: "course1_lesson3",
      title: "Buongiorno (Good Morning)",
      category: "Greetings",
      emoji: "🌅",
      content: {
        word: "Buongiorno",
        translation: "Good morning",
        example: "Buongiorno, signora!",
        exampleTranslation: "Good morning, madam!",
        note: "Formal greeting used from morning until early afternoon. Shows respect and politeness."
      },
      quiz: {
        question: "When would you use 'Buongiorno'?",
        options: ["Evening", "Morning/Early afternoon", "Night", "Anytime"],
        correct: 1
      }
    },
    {
      id: "course2_lesson1",
      title: "Mi chiamo... (My name is...)",
      category: "Introducing Yourself",
      emoji: "🙋‍♂️",
      content: {
        word: "Mi chiamo",
        translation: "My name is",
        example: "Mi chiamo Marco, piacere!",
        exampleTranslation: "My name is Marco, nice to meet you!",
        note: "Standard way to introduce yourself. Very common and universally understood."
      },
      quiz: {
        question: "How do you say 'My name is' in Italian?",
        options: ["Io sono", "Mi chiamo", "Il mio nome", "Sono"],
        correct: 1
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">3-Phase Lesson Preview</h1>
                <p className="text-sm text-gray-600">Try out the new lesson structure</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Interactive 3-Phase Lesson System</h2>
                <p className="text-white/90 mb-4">
                  Experience our new learning methodology with three progressive phases:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-semibold mb-1">Phase 1: Introduction & Recognition</div>
                    <div className="text-white/80">Learn the word with audio and context</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-semibold mb-1">Phase 2: Retrieval & Practice</div>
                    <div className="text-white/80">Practice typing and matching exercises</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-semibold mb-1">Phase 3: Listening & Context</div>
                    <div className="text-white/80">Apply knowledge in real conversations</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Lessons */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Try These Sample Lessons</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleLessons.map((lesson) => (
              <Card key={lesson.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">{lesson.emoji}</div>
                    <h4 className="font-bold text-gray-900 mb-2">{lesson.title}</h4>
                    <p className="text-gray-600 text-sm mb-3">{lesson.category}</p>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-lg font-bold text-primary">{lesson.content.word}</div>
                      <div className="text-gray-600">{lesson.content.translation}</div>
                    </div>

                    <Button 
                      onClick={() => setSelectedLesson(lesson)}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start 3-Phase Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12">
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What You'll Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Progressive Learning</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Must complete each phase to advance</li>
                    <li>• Navigate back to review completed phases</li>
                    <li>• Visual progress indicators with checkmarks</li>
                    <li>• Color-coded phases for easy recognition</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Interactive Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Audio pronunciation with text-to-speech</li>
                    <li>• Fill-in-the-blank typing exercises</li>
                    <li>• Multiple choice with immediate feedback</li>
                    <li>• Contextual listening comprehension</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal 
          lesson={selectedLesson}
          language="italian"
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  );
}