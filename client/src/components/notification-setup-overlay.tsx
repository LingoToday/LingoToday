import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Bell, Clock, Settings, ArrowDown, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { requestNotificationPermission } from "@/lib/notifications";

interface NotificationSetupOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function NotificationSetupOverlay({ 
  isVisible, 
  onClose 
}: NotificationSetupOverlayProps) {
  const [step, setStep] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
      // Focus overlay for accessibility
      overlayRef.current?.focus();
      // Check current notification permission
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
        setNotificationsEnabled(Notification.permission === "granted");
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const steps = [
    {
      title: "Enable Notifications",
      content: "Turn on browser notifications to receive gentle reminders for your language lessons throughout the day.",
      icon: <Bell className="w-8 h-8 text-green-600" />
    },
    {
      title: "Set Your Schedule",
      content: "Choose how often you'd like to be reminded and set your preferred learning hours that work with your daily routine.",
      icon: <Clock className="w-8 h-8 text-purple-600" />
    }
  ];

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      try {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
          setNotificationsEnabled(true);
        } else {
          setNotificationsEnabled(false);
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        setNotificationsEnabled(false);
      }
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Scroll to notification settings section
      scrollToNotificationSettings();
      onClose();
    }
  };

  const scrollToNotificationSettings = () => {
    // Wait a bit for overlay to close, then scroll
    setTimeout(() => {
      const notificationSection = document.querySelector('[data-testid="notification-settings-card"]');
      if (notificationSection) {
        notificationSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add a subtle highlight animation
        notificationSection.classList.add('ring-4', 'ring-blue-200', 'ring-opacity-75');
        setTimeout(() => {
          notificationSection.classList.remove('ring-4', 'ring-blue-200', 'ring-opacity-75');
        }, 3000);
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="notification-setup-overlay"
    >
      <div 
        ref={overlayRef}
        className="relative max-w-md w-full"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="overlay-title"
        aria-describedby="overlay-description"
      >
        <Card className="w-full animate-in fade-in-0 zoom-in-95 duration-300">
          <CardHeader className="text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-overlay-button"
              aria-label="Close overlay"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex justify-center mb-4">
              {steps[step].icon}
            </div>
            
            <CardTitle id="overlay-title" className="text-xl font-semibold text-gray-900">
              {steps[step].title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p id="overlay-description" className="text-gray-600 leading-relaxed">
              {steps[step].content}
            </p>

            {/* Enable Notifications Toggle - Show only on first step */}
            {step === 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="notification-toggle" className="text-sm font-medium text-blue-800">
                    Enable Notifications
                  </Label>
                  <Switch
                    id="notification-toggle"
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                    data-testid="notification-toggle-switch"
                  />
                </div>
                
                <div className="text-xs text-blue-700">
                  {notificationPermission === "granted" ? (
                    <span className="text-green-700">✓ Browser notifications are enabled</span>
                  ) : notificationPermission === "denied" ? (
                    <span className="text-red-700">⚠ Browser notifications are blocked. Check your browser settings.</span>
                  ) : (
                    <span>Toggle to request browser notification permission</span>
                  )}
                </div>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Special content for last step */}
            {step === steps.length - 1 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <ArrowDown className="w-5 h-5 text-blue-600 animate-bounce" />
                </div>
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Look for the Notifications section below
                </p>
                <p className="text-xs text-blue-600">
                  We'll highlight it for you after you close this dialog
                </p>
              </div>
            )}

            {/* FAQ link */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">
                For more information on how to enable notifications, visit our FAQ page
              </p>
              <Link href="/faq">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 text-xs p-1 h-auto"
                  data-testid="faq-link-button"
                >
                  FAQ Page <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                data-testid="skip-setup-button"
                className="text-gray-500"
              >
                Skip Setup
              </Button>
              
              <Button
                onClick={handleNext}
                data-testid="next-step-button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}