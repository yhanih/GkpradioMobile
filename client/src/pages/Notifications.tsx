import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Settings, Filter, MoreVertical, Check, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  // Get notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications", { 
      type: activeTab === "all" ? undefined : activeTab,
      unreadOnly: showUnreadOnly 
    }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("type", activeTab);
      if (showUnreadOnly) params.set("unreadOnly", "true");
      params.set("limit", "50");
      
      return apiRequest(`/api/notifications?${params}`).then(res => res.json());
    },
  });

  // Get unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/notifications/read-all", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "prayer_reply":
        return "🙏";
      case "prayer_joined":
        return "💝";
      case "mention":
        return "💬";
      case "encouragement":
        return "✨";
      case "health_update":
        return "🌿";
      case "event_reminder":
        return "📅";
      case "event_changed":
        return "📅";
      case "content_follow":
        return "👀";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "prayer_reply":
      case "prayer_joined":
        return "bg-faith-green/10 text-faith-green";
      case "mention":
        return "bg-blue-500/10 text-blue-600";
      case "encouragement":
        return "bg-faith-gold/10 text-faith-gold";
      case "health_update":
        return "bg-green-500/10 text-green-600";
      case "event_reminder":
      case "event_changed":
        return "bg-purple-500/10 text-purple-600";
      case "system":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const { type, metadata } = notification;
    
    if (type === "prayer_reply" && metadata?.threadId) {
      return `/community?thread=${metadata.threadId}`;
    }
    if (type === "mention" && metadata?.threadId) {
      return `/community?thread=${metadata.threadId}`;
    }
    if (type === "encouragement" && metadata?.threadId) {
      return `/community?thread=${metadata.threadId}`;
    }
    if (type === "event_reminder" && metadata?.eventId) {
      return `/events/${metadata.eventId}`;
    }
    
    return "/community";
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
  };

  const notificationTabs = [
    { id: "all", label: "All", count: notifications.length },
    { id: "mention", label: "Mentions", count: notifications.filter((n: Notification) => n.type === "mention").length },
    { id: "prayer_reply", label: "Prayer", count: notifications.filter((n: Notification) => n.type.includes("prayer")).length },
    { id: "direct_message", label: "Messages", count: notifications.filter((n: Notification) => n.type === "direct_message").length },
    { id: "event_reminder", label: "Calendar", count: notifications.filter((n: Notification) => n.type.includes("event")).length },
    { id: "system", label: "System", count: notifications.filter((n: Notification) => n.type === "system").length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif font-bold text-3xl mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your community interactions
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={showUnreadOnly ? "bg-blue-50 border-blue-200" : ""}
                data-testid="filter-unread"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showUnreadOnly ? "Showing unread" : "Show unread only"}
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="mark-all-read"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
              
              <Link href="/notifications/settings">
                <Button variant="outline" size="sm" data-testid="notification-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          {unreadCount > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stay connected with your faith community
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              {notificationTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="relative"
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {tab.count > 99 ? "99+" : tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="animate-pulse space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4" />
                              <div className="h-3 bg-muted rounded w-full" />
                              <div className="h-3 bg-muted rounded w-1/4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-medium mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        {showUnreadOnly 
                          ? "You're all caught up! No unread notifications."
                          : "We'll notify you when something happens in your community."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification: Notification) => (
                    <Card 
                      key={notification.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        !notification.readAt ? "ring-2 ring-blue-100 dark:ring-blue-900/50" : ""
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <CardContent className="pt-6">
                        <Link href={getNotificationLink(notification)}>
                          <div 
                            className="flex items-start gap-4"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                              <span className="text-lg">
                                {getNotificationIcon(notification.type)}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-sm">
                                      {notification.title}
                                    </h3>
                                    {!notification.readAt && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  
                                  <p className="text-muted-foreground text-sm mb-2">
                                    {notification.body}
                                  </p>
                                  
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { 
                                      addSuffix: true 
                                    })}
                                  </p>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.readAt && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markReadMutation.mutate(notification.id);
                                        }}
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}