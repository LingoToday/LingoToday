import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Info } from "lucide-react";
import { setupNotifications, scheduleNotification, stopNotifications } from "@/lib/notifications";
import type { UserSettings } from "@shared/schema";

export default function NotificationSettings() {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      await apiRequest("PUT", "/api/settings", updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      console.log("Initial notification permission:", Notification.permission);
    }
    
    // Check permission periodically in case user changed it
    const permissionCheck = setInterval(() => {
      if ("Notification" in window && Notification.permission !== notificationPermission) {
        console.log("Permission changed from", notificationPermission, "to", Notification.permission);
        setNotificationPermission(Notification.permission);
      }
    }, 1000);
    
    return () => clearInterval(permissionCheck);
  }, [notificationPermission]);

  // Add a permission refresh function
  const refreshPermission = () => {
    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      console.log("Refreshed notification permission:", currentPermission);
      return currentPermission;
    }
    return "default";
  };

  // Check settings but don't auto-start notifications (requires manual daily session start)
  useEffect(() => {
    console.log("🔄 Settings/permission changed:", {
      hasSettings: !!settings,
      enabled: settings?.notificationsEnabled,
      permission: notificationPermission,
      language: settings?.selectedLanguage,
      frequency: settings?.notificationFrequency
    });

    // Only stop notifications if explicitly disabled
    if (settings && !settings.notificationsEnabled) {
      console.log("🔇 Stopping notifications - disabled in settings");
      stopNotifications();
    } else if (settings && settings.notificationsEnabled && notificationPermission !== "granted") {
      console.log("⚠️ Notifications enabled but permission not granted:", {
        permission: notificationPermission,
        enabled: settings.notificationsEnabled
      });
    }
    
    // Note: Notifications now require manual session start via dashboard button
  }, [settings, notificationPermission]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && notificationPermission !== "granted") {
      try {
        const permission = await setupNotifications();
        setNotificationPermission(permission);
        
        if (permission !== "granted") {
          toast({
            title: "Notification permission denied",
            description: "Please enable notifications in your browser settings to receive learning reminders.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to request notification permission.",
          variant: "destructive",
        });
        return;
      }
    }

    updateSettingsMutation.mutate({
      ...settings,
      notificationsEnabled: enabled,
    });

    // Stop notifications if disabled, but don't auto-start when enabled
    if (!enabled) {
      console.log("🛑 Stopping notifications - disabled by user");
      stopNotifications();
    } else {
      console.log("✅ Notifications enabled - user must start daily session on dashboard");
    }
  };

  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      selectedLanguage: language,
    });
  };

  const handleFrequencyChange = (frequency: string) => {
    const newFrequency = parseInt(frequency);
    updateSettingsMutation.mutate({
      ...settings,
      notificationFrequency: newFrequency,
    });

    // Frequency change saved - will apply when user starts next daily session
    console.log("✅ Notification frequency updated - will apply to next daily session");
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await setupNotifications();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        updateSettingsMutation.mutate({
          ...settings,
          notificationsEnabled: true,
        });
        
        toast({
          title: "Notifications enabled!",
          description: "You'll now receive learning reminders at your chosen frequency.",
        });

        // Permission granted - user can now start daily session on dashboard
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!settings) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Language</Label>
          <Select value={settings.selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</Label>
          <Select value={settings.notificationFrequency.toString()} onValueChange={handleFrequencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Every 15 minutes</SelectItem>
              <SelectItem value="30">Every 30 minutes</SelectItem>
              <SelectItem value="60">Every 60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {notificationPermission !== "granted" && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-warning-800">
                <p className="font-medium mb-1">
                  {notificationPermission === "denied" ? "Permission Blocked" : "Permission Required"}
                </p>
                {notificationPermission === "denied" ? (
                  <div>
                    <p className="mb-2">Notifications are blocked. To enable:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Click the lock/info icon in your browser's address bar</li>
                      <li>Set Notifications to "Allow"</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                ) : (
                  <p>Click "Allow" when your browser asks for notification permission.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {notificationPermission !== "granted" ? (
          <div className="space-y-2">
            <Button 
              onClick={requestNotificationPermission} 
              className="w-full"
              disabled={notificationPermission === "denied"}
            >
              <Bell className="h-4 w-4 mr-2" />
              {notificationPermission === "denied" ? "Permission Blocked - See Instructions Above" : "Enable Notifications"}
            </Button>
            
            {/* Debug info even when permission not granted */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
              <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
              <div className="space-y-1 text-gray-600">
                <div>Permission: <span className="font-mono">{notificationPermission}</span></div>
                <div>Actual: <span className="font-mono">{typeof window !== 'undefined' && "Notification" in window ? Notification.permission : 'unknown'}</span></div>
                <div>API Support: <span className="font-mono">{"Notification" in window ? 'yes' : 'no'}</span></div>
                <div>Browser: <span className="font-mono">{navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}</span></div>
              </div>
              
              <Button 
                size="sm"
                variant="outline"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  console.log("🔄 Refreshing permission status");
                  const actualPermission = Notification.permission;
                  setNotificationPermission(actualPermission);
                  console.log("Permission updated to:", actualPermission);
                }}
              >
                Refresh Permission
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  console.log("🧪 Testing API endpoint directly");
                  console.log(`🌐 Current window context: ${window.location.origin}`);
                  
                  const apiUrl = `/api/notification-lesson/italian`;
                  console.log("Testing URL:", apiUrl, "(relative URL)");
                  fetch(apiUrl, { credentials: 'same-origin' })
                    .then(response => response.json())
                    .then(data => {
                      console.log("✅ API test successful:", data);
                    })
                    .catch(error => {
                      console.error("❌ API test failed:", error);
                    });
                }}
              >
                Test API Endpoint
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-success-50 border border-success-200 rounded-lg p-3">
              <div className="flex items-center">
                <Bell className="h-4 w-4 text-success-600 mr-2" />
                <span className="text-sm text-success-800 font-medium">
                  Notifications {settings.notificationsEnabled ? 'Enabled' : 'Available'}
                </span>
              </div>
            </div>
            {settings.notificationsEnabled && (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    console.log("Manual notification trigger");
                    // Test with a simple notification first
                    if (Notification.permission === "granted") {
                      try {
                        console.log("🧪 Creating simple test notification...");
                        const testNotification = new Notification("🔔 LingoToday Test", {
                          body: "This is a test notification. If you see this in Mac Notification Center, notifications are working!",
                          icon: "/favicon.ico",
                          tag: "lingotoday-test-" + Date.now(),
                          requireInteraction: false
                        });
                        
                        testNotification.onshow = () => {
                          console.log("✅ Simple test notification showed successfully!");
                        };
                        
                        testNotification.onerror = (error) => {
                          console.error("❌ Simple test notification error:", error);
                        };
                        
                        console.log("✅ Simple test notification object created");
                        const closeTestNotification = () => {
                          console.log("Auto-closing simple test notification");
                          testNotification.close();
                        };
                        setTimeout(closeTestNotification, 8000);
                      } catch (error) {
                        console.error("❌ Simple notification creation failed:", error);
                      }
                    } else {
                      console.log("❌ Permission not granted for test notification:", Notification.permission);
                      toast({
                        title: "Permission Issue",
                        description: "Browser permission is not granted. Check your browser and macOS System Preferences.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Simple Test
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    console.log("🔔 Full notification test trigger");
                    import("@/lib/notifications").then(({ showLearningNotification }) => {
                      // Call the actual showLearningNotification function
                      showLearningNotification(settings.selectedLanguage);
                    }).catch(error => {
                      console.error("❌ Failed to import notifications:", error);
                    });
                  }}
                >
                  Full Test
                </Button>
                
                {/* Debug Panel for notifications */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                  <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
                  <div className="space-y-1 text-gray-600">
                    <div>Permission: <span className="font-mono">{notificationPermission}</span></div>
                    <div>Enabled: <span className="font-mono">{settings.notificationsEnabled ? 'true' : 'false'}</span></div>
                    <div>Language: <span className="font-mono">{settings.selectedLanguage}</span></div>
                    <div>Frequency: <span className="font-mono">{settings.notificationFrequency} min</span></div>
                    <div>API Support: <span className="font-mono">{"Notification" in window ? 'yes' : 'no'}</span></div>
                  </div>
                  
                  <Button 
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() => {
                      console.log("🔄 Manual scheduling trigger");
                      if (notificationPermission === "granted") {
                        import("@/lib/notifications").then(({ scheduleNotification }) => {
                          console.log("🚀 Manually triggering scheduleNotification");
                          scheduleNotification(settings.selectedLanguage, 1); // 1 minute for testing
                        });
                      } else {
                        console.log("❌ Cannot schedule - permission not granted");
                      }
                    }}
                  >
                    Force Schedule (1min test)
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="outline"
                    className="mt-1 w-full text-xs"
                    onClick={() => {
                      console.log("🕐 Checking notification timing status");
                      const lastScheduleTime = localStorage.getItem('lastScheduleTime');
                      const lastNotificationTime = localStorage.getItem('lastNotificationTime');
                      const scheduledLanguage = localStorage.getItem('scheduledLanguage');
                      const scheduledInterval = localStorage.getItem('scheduledInterval');
                      
                      const now = Date.now();
                      
                      console.log("📊 Current Notification Status:", {
                        currentTime: new Date().toLocaleTimeString(),
                        lastScheduled: lastScheduleTime ? new Date(parseInt(lastScheduleTime)).toLocaleTimeString() : 'Never',
                        lastNotification: lastNotificationTime ? new Date(parseInt(lastNotificationTime)).toLocaleTimeString() : 'Never',
                        scheduledLanguage: scheduledLanguage || 'None',
                        scheduledInterval: (scheduledInterval || 'None') + ' minutes',
                        timeSinceLastSchedule: lastScheduleTime ? Math.round((now - parseInt(lastScheduleTime)) / 1000 / 60) + ' minutes ago' : 'N/A',
                        timeSinceLastNotification: lastNotificationTime ? Math.round((now - parseInt(lastNotificationTime)) / 1000 / 60) + ' minutes ago' : 'N/A',
                        nextExpectedNotification: lastNotificationTime && scheduledInterval ? 
                          new Date(parseInt(lastNotificationTime) + (parseInt(scheduledInterval) * 60 * 1000)).toLocaleTimeString() : 'Unknown'
                      });
                    }}
                  >
                    Check Timing Status
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="outline"
                    className="mt-1 w-full text-xs"
                    onClick={() => {
                      console.log("🧪 Simple notification test");
                      const actualPermission = Notification.permission;
                      console.log("Actual browser permission:", actualPermission);
                      console.log("State permission:", notificationPermission);
                      
                      if (actualPermission === "granted") {
                        try {
                          const testNotification = new Notification("LingoToday Test", {
                            body: "Testing simple notification without API call",
                            icon: "/favicon.ico",
                            tag: "test-" + Date.now()
                          });
                          console.log("✅ Simple notification created successfully");
                          // Update state if needed
                          if (notificationPermission !== actualPermission) {
                            setNotificationPermission(actualPermission);
                          }
                        } catch (error) {
                          console.error("❌ Simple notification failed:", error);
                        }
                      } else {
                        console.log("❌ Permission not granted - actual:", actualPermission);
                      }
                    }}
                  >
                    Simple Notification Test
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
