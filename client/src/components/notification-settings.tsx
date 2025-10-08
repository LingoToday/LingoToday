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
import { Bell, Smartphone, Monitor } from "lucide-react";
import type { UserSettings } from "@shared/schema";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

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
    }
    
    const permissionCheck = setInterval(() => {
      if ("Notification" in window && Notification.permission !== notificationPermission) {
        setNotificationPermission(Notification.permission);
      }
    }, 1000);
    
    return () => clearInterval(permissionCheck);
  }, [notificationPermission]);

  const toggleDay = (type: 'mobile' | 'desktop', day: string) => {
    if (!settings) return;
    
    const currentDays = type === 'mobile' 
      ? settings.mobileNotificationDays || []
      : settings.desktopNotificationDays || [];
    
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    updateSettingsMutation.mutate({
      ...settings,
      [type === 'mobile' ? 'mobileNotificationDays' : 'desktopNotificationDays']: newDays,
    });
  };

  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      language: language,
    });
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
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Language</Label>
          <Select value={settings.language} onValueChange={handleLanguageChange}>
            <SelectTrigger data-testid="select-language">
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

        {/* Mobile Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Mobile</h3>
          </div>

          {/* Days Circles for Mobile */}
          <div className="flex justify-center space-x-2">
            {DAYS.map((day, index) => {
              const isSelected = (settings.mobileNotificationDays || []).includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay('mobile', day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  data-testid={`mobile-day-${day.toLowerCase()}`}
                >
                  {DAY_INITIALS[index]}
                </button>
              );
            })}
          </div>

          {/* Mobile Controls */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Enable</Label>
              <Switch
                checked={settings.mobileNotificationsEnabled}
                onCheckedChange={(enabled) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationsEnabled: enabled,
                  });
                }}
                data-testid="toggle-mobile-notifications"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</Label>
              <Select 
                value={settings.mobileNotificationFrequency?.toString() || "60"} 
                onValueChange={(value) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationFrequency: parseInt(value),
                  });
                }}
              >
                <SelectTrigger data-testid="select-mobile-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</Label>
                <Select 
                  value={settings.mobileNotificationStartTime || "09:00"} 
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      mobileNotificationStartTime: value,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-mobile-start-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">End Time</Label>
                <Select 
                  value={settings.mobileNotificationEndTime || "18:00"} 
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      mobileNotificationEndTime: value,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-mobile-end-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Notifications Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Desktop</h3>
          </div>

          {/* Days Circles for Desktop */}
          <div className="flex justify-center space-x-2">
            {DAYS.map((day, index) => {
              const isSelected = (settings.desktopNotificationDays || []).includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay('desktop', day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  data-testid={`desktop-day-${day.toLowerCase()}`}
                >
                  {DAY_INITIALS[index]}
                </button>
              );
            })}
          </div>

          {/* Desktop Controls */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Enable</Label>
              <Switch
                checked={settings.desktopNotificationsEnabled}
                onCheckedChange={(enabled) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    desktopNotificationsEnabled: enabled,
                  });
                }}
                data-testid="toggle-desktop-notifications"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</Label>
              <Select 
                value={settings.desktopNotificationFrequency?.toString() || "60"} 
                onValueChange={(value) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    desktopNotificationFrequency: parseInt(value),
                  });
                }}
              >
                <SelectTrigger data-testid="select-desktop-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</Label>
                <Select 
                  value={settings.desktopNotificationStartTime || "09:00"} 
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      desktopNotificationStartTime: value,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-desktop-start-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">End Time</Label>
                <Select 
                  value={settings.desktopNotificationEndTime || "18:00"} 
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      desktopNotificationEndTime: value,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-desktop-end-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {notificationPermission !== "granted" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Browser notifications are blocked. Click "Test Now" to enable them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
