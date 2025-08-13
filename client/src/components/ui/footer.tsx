import { Globe } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">LingoToday</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Learn languages without leaving your desk. Short, well-timed prompts for busy professionals.
            </p>
          </div>

          {/* About Us */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 mb-4">About Us</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Courses
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Mission
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Approach
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Help and Support */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 mb-4">Help and Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy and Terms */}
          <div className="col-span-1">
            <h4 className="font-semibold text-gray-900 mb-4">Privacy and Terms</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} LingoToday. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}