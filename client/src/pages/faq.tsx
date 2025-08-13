import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Bell, Settings, Clock, Volume2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqData = [
    {
      category: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      questions: [
        {
          question: "How do I enable notifications?",
          answer: "To enable notifications, go to your dashboard and look for the Notifications section. Toggle the 'Notifications Enabled' switch to turn them on. You'll also need to allow browser notifications when prompted."
        },
        {
          question: "How can I change my notification frequency?",
          answer: "In your dashboard's Notifications section, you can adjust the frequency using the dropdown menu. Choose from 5 minutes, 15 minutes, 30 minutes, or 1 hour intervals."
        },
        {
          question: "Can I set specific times for notifications?",
          answer: "Yes! You can set both start and end times for your notifications in the dashboard. This ensures you only receive learning reminders during your preferred hours."
        },
        {
          question: "Why am I not receiving notifications?",
          answer: "Check these common issues: 1) Make sure notifications are enabled in your dashboard settings, 2) Ensure your browser allows notifications for LingoToday, 3) Check that your notification times are set correctly, 4) Try clicking 'Test Now' in the dashboard to verify your setup."
        },
        {
          question: "Can I disable notifications temporarily?",
          answer: "Yes, simply toggle off the 'Notifications Enabled' switch in your dashboard. You can turn them back on anytime without losing your other settings."
        }
      ]
    },
    {
      category: "Learning",
      icon: <Volume2 className="w-5 h-5" />,
      questions: [
        {
          question: "How do the micro-lessons work?",
          answer: "Our micro-lessons are short, focused learning sessions designed to fit into your busy schedule. Each lesson typically takes 2-3 minutes and covers specific language concepts."
        },
        {
          question: "Can I change my learning language?",
          answer: "Currently, you can change your learning language in your profile settings. Note that this will reset your progress as different languages have different course structures."
        },
        {
          question: "How is my progress tracked?",
          answer: "We track your completed lessons, current streak, and words learned. You can view detailed progress in your dashboard and course sections."
        }
      ]
    },
    {
      category: "Account & Settings",
      icon: <Settings className="w-5 h-5" />,
      questions: [
        {
          question: "How do I change my account settings?",
          answer: "Visit your dashboard where you can update notification preferences, learning language, and other personal settings."
        },
        {
          question: "Can I reset my progress?",
          answer: "If you need to reset your progress, please contact our support team. We can help you start fresh while keeping your account intact."
        },
        {
          question: "How do I delete my account?",
          answer: "To delete your account, please contact our support team through the Contact Us link in the footer. We'll process your request within 48 hours."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
              <p className="text-gray-600 mt-2">Find answers to common questions about LingoToday</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {faqData.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {category.icon}
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const globalIndex = categoryIndex * 100 + itemIndex;
                  const isOpen = openItems.includes(globalIndex);
                  
                  return (
                    <div key={itemIndex} className="border rounded-lg">
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        data-testid={`faq-question-${globalIndex}`}
                      >
                        <span className="font-medium text-gray-900">{item.question}</span>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="text-gray-700 leading-relaxed">
                            {item.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <p className="text-gray-600 mb-4">
              Email us at: <a href="mailto:hello@lingotoday.co" className="text-primary hover:underline font-medium">hello@lingotoday.co</a>
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:hello@lingotoday.co" data-testid="contact-support-button">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}