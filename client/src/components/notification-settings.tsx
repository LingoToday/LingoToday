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

export default function NotificationSettings() {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
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
    }
  }, []);

  // Initialize notifications on settings load if already enabled
  useEffect(() => {
    if (settings && settings.notificationsEnabled && notificationPermission === "granted") {
      console.log("Initializing notifications with settings:", {
        language: settings.selectedLanguage,
        frequency: settings.notificationFrequency,
        enabled: settings.notificationsEnabled
      });
      // Schedule notifications if they should be enabled
      scheduleNotification(settings.selectedLanguage, settings.notificationFrequency);
    } else if (settings && !settings.notificationsEnabled) {
      console.log("Stopping notifications - disabled in settings");
      // Stop notifications if disabled
      stopNotifications();
    } else if (settings) {
      console.log("Notification setup check:", {
        notificationsEnabled: settings.notificationsEnabled,
        permission: notificationPermission,
        hasSettings: !!settings
      });
    }
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

    // Schedule or stop notifications based on enabled state
    if (enabled && settings) {
      scheduleNotification(settings.selectedLanguage, settings.notificationFrequency);
    } else {
      stopNotifications();
    }
  };

  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      selectedLanguage: language,
    });
  };

  const handleFrequencyChange = (frequency: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      notificationFrequency: parseInt(frequency),
    });
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

        // Schedule first notification
        if (settings) {
          scheduleNotification(settings.selectedLanguage, settings.notificationFrequency);
        }
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
                <p className="font-medium mb-1">Permission Required</p>
                <p>Click "Allow" when your browser asks for notification permission.</p>
              </div>
            </div>
          </div>
        )}
        
        {notificationPermission !== "granted" ? (
          <Button onClick={requestNotificationPermission} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  console.log("Manual notification trigger");
                  scheduleNotification(settings.selectedLanguage, settings.notificationFrequency);
                }}
              >
                Test Notification
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
