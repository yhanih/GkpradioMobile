import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Mail, Smartphone, Clock, Volume, VolumeX } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface NotificationPreference {
  id: number;
  userId: number;
  type: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
  digest: string;
  quietHours: any;
}

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get notification preferences
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ["/api/notification-preferences"],
    queryFn: () => apiRequest("/api/notification-preferences").then(res => res.json()),
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: ({ type, preferences }: { type: string; preferences: any }) =>
      apiRequest("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, preferences }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const notificationTypes = [
    {
      type: "prayer_reply",
      title: "Prayer Request Replies",
      description: "When someone replies to your prayer requests",
      category: "Community",
      icon: "🙏",
    },
    {
      type: "prayer_joined",
      title: "Prayer Support",
      description: "When someone prays for you or joins your prayer chain",
      category: "Community",
      icon: "💝",
    },
    {
      type: "mention",
      title: "Mentions",
      description: "When someone mentions you in a discussion",
      category: "Community",
      icon: "💬",
    },
    {
      type: "encouragement",
      title: "Words of Encouragement",
      description: "New encouragement in threads you follow",
      category: "Community",
      icon: "✨",
    },
    {
      type: "health_update",
      title: "Health & Wellness",
      description: "Updates in Physical & Mental Health category",
      category: "Content",
      icon: "🌿",
    },
    {
      type: "event_reminder",
      title: "Event Reminders",
      description: "Reminders for events you're attending",
      category: "Calendar",
      icon: "📅",
    },
    {
      type: "event_changed",
      title: "Event Changes",
      description: "When event details are updated",
      category: "Calendar",
      icon: "📅",
    },
    {
      type: "content_follow",
      title: "Followed Content",
      description: "New content in topics you follow",
      category: "Content",
      icon: "👀",
    },
    {
      type: "system",
      title: "System Notifications",
      description: "Important updates and announcements",
      category: "System",
      icon: "⚙️",
    },
  ];

  const getPreference = (type: string): NotificationPreference => {
    const pref = preferences.find((p: NotificationPreference) => p.type === type);
    return pref || {
      id: 0,
      userId: 0,
      type,
      inApp: true,
      email: false,
      push: false,
      digest: "none",
      quietHours: null,
    };
  };

  const updatePreference = (type: string, field: string, value: any) => {
    const currentPref = getPreference(type);
    const updatedPref = { ...currentPref, [field]: value };
    
    updatePreferenceMutation.mutate({
      type,
      preferences: {
        inApp: updatedPref.inApp,
        email: updatedPref.email,
        push: updatedPref.push,
        digest: updatedPref.digest,
        quietHours: updatedPref.quietHours,
      },
    });
  };

  const groupedNotifications = notificationTypes.reduce((groups, notif) => {
    const category = notif.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(notif);
    return groups;
  }, {} as Record<string, typeof notificationTypes>);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/notifications">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-bold text-3xl mb-2">Notification Settings</h1>
              <p className="text-muted-foreground">
                Customize how and when you receive notifications
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Quick Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">All Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn all notifications on or off
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      notificationTypes.forEach(({ type }) => {
                        updatePreference(type, "inApp", true);
                        updatePreference(type, "email", false);
                        updatePreference(type, "push", false);
                      });
                    }}
                  >
                    <Volume className="w-4 h-4 mr-2" />
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      notificationTypes.forEach(({ type }) => {
                        updatePreference(type, "inApp", false);
                        updatePreference(type, "email", false);
                        updatePreference(type, "push", false);
                      });
                    }}
                  >
                    <VolumeX className="w-4 h-4 mr-2" />
                    Disable All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {notifications.map((notification) => {
                    const pref = getPreference(notification.type);
                    
                    return (
                      <div key={notification.type} className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{notification.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Label className="text-base font-medium">
                                {notification.title}
                              </Label>
                              {pref.inApp && (
                                <Badge variant="secondary" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              {notification.description}
                            </p>
                            
                            {/* Delivery Channels */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Bell className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">In-App</span>
                                </div>
                                <Switch
                                  checked={pref.inApp}
                                  onCheckedChange={(checked) => 
                                    updatePreference(notification.type, "inApp", checked)
                                  }
                                  data-testid={`${notification.type}-in-app`}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Email</span>
                                </div>
                                <Switch
                                  checked={pref.email}
                                  onCheckedChange={(checked) => 
                                    updatePreference(notification.type, "email", checked)
                                  }
                                  data-testid={`${notification.type}-email`}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Push</span>
                                </div>
                                <Switch
                                  checked={pref.push}
                                  onCheckedChange={(checked) => 
                                    updatePreference(notification.type, "push", checked)
                                  }
                                  data-testid={`${notification.type}-push`}
                                />
                              </div>
                            </div>
                            
                            {/* Digest Settings */}
                            {(pref.email || pref.push) && (
                              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Digest Frequency</span>
                                  </div>
                                  <Select
                                    value={pref.digest}
                                    onValueChange={(value) => 
                                      updatePreference(notification.type, "digest", value)
                                    }
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Immediate</SelectItem>
                                      <SelectItem value="daily">Daily</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {notification !== notifications[notifications.length - 1] && (
                          <Separator />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Settings */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Set hours when you don't want to receive email or push notifications
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label htmlFor="quiet-start" className="text-sm">From</Label>
                    <Select defaultValue="22:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0");
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quiet-end" className="text-sm">To</Label>
                    <Select defaultValue="08:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0");
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}