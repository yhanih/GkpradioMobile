import { useState, useEffect } from "react";
import { Bell, Settings, Check, MoreHorizontal } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { NotificationManager } from "./InAppNotification";
import { FallbackMessage, NotificationSkeleton, InlineLoader } from "./FallbackUI";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showInAppNotifications, setShowInAppNotifications] = useState(true);
  const queryClient = useQueryClient();

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Get recent notifications for dropdown
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["/api/notifications", { limit: 10 }],
    queryFn: () => 
      apiRequest("/api/notifications?limit=10").then(res => res.json()),
    enabled: isOpen,
    retry: 2,
    retryDelay: 1000,
  });

  // Get real-time notifications for in-app display
  const { data: realtimeNotifications = [] } = useQuery({
    queryKey: ["/api/notifications", { limit: 5, unread: true }],
    queryFn: () => 
      apiRequest("/api/notifications?limit=5&unread=true").then(res => res.json()),
    refetchInterval: showInAppNotifications ? 15000 : false, // Poll every 15 seconds
    retry: false,
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

  const unreadCount = (unreadData as { count?: number })?.count || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const handleInAppNotificationAction = (notification: Notification) => {
    // Navigate to the relevant page based on notification type
    const link = getNotificationLink(notification);
    window.location.href = link;
  };

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
      case "system":
        return "⚙️";
      default:
        return "🔔";
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        data-testid="notification-dropdown"
      >
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="mark-all-read"
                >
                  Mark all read
                </Button>
              )}
              <Link href="/notifications/settings">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  data-testid="notification-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <NotificationSkeleton />
          ) : error ? (
            <div className="p-4">
              <FallbackMessage
                type="error"
                title="Failed to load notifications"
                message="Unable to fetch your notifications. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })
                }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4">
              <FallbackMessage
                type="empty"
                title="No notifications yet"
                message="We'll notify you when something interesting happens!"
              />
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <Link 
                  key={notification.id} 
                  href={getNotificationLink(notification)}
                >
                  <div
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 ${
                      !notification.readAt 
                        ? "bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent border-l-2 border-l-blue-500" 
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-tight">
                            {notification.title}
                          </p>
                          {!notification.readAt && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mt-1 leading-tight">
                          {notification.body}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        <div className="p-2">
          <Link href="/notifications">
            <Button 
              variant="ghost" 
              className="w-full justify-center"
              data-testid="view-all-notifications"
            >
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
      
      {/* Instagram-style In-App Notifications */}
      {showInAppNotifications && Array.isArray(realtimeNotifications) && realtimeNotifications.length > 0 && (
        <NotificationManager
          notifications={realtimeNotifications as Notification[]}
          onMarkRead={(id) => markReadMutation.mutate(id)}
          onAction={handleInAppNotificationAction}
        />
      )}
    </DropdownMenu>
  );
}