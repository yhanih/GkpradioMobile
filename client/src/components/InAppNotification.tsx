import { useState, useEffect } from "react";
import { X, Check, MessageCircle, Heart, Bell, Users, Clock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface NotificationData {
  id: number;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

interface InAppNotificationProps {
  notification: NotificationData;
  onDismiss: () => void;
  onMarkRead?: () => void;
  onAction?: () => void;
}

export function InAppNotification({ 
  notification, 
  onDismiss, 
  onMarkRead, 
  onAction 
}: InAppNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAction = () => {
    if (!notification.readAt && onMarkRead) {
      onMarkRead();
    }
    if (onAction) {
      onAction();
    }
    handleDismiss();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "prayer_reply":
      case "prayer_joined":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
      case "thread_reply":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "community":
        return <Users className="w-5 h-5 text-green-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "prayer_reply":
      case "prayer_joined":
        return "border-l-red-500 bg-red-50/80 dark:bg-red-950/20";
      case "comment":
      case "thread_reply":
        return "border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/20";
      case "community":
        return "border-l-green-500 bg-green-50/80 dark:bg-green-950/20";
      case "system":
        return "border-l-yellow-500 bg-yellow-50/80 dark:bg-yellow-950/20";
      default:
        return "border-l-gray-500 bg-gray-50/80 dark:bg-gray-950/20";
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      data-testid={`notification-${notification.id}`}
    >
      <div className={`
        bg-card/95 backdrop-blur-md rounded-lg shadow-lg border-l-4
        ${getNotificationColor(notification.type)}
        p-4 space-y-3
      `}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">
                {notification.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                {!notification.readAt && (
                  <Badge variant="destructive" className="h-4 px-1 text-xs">
                    New
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={handleDismiss}
            data-testid="notification-dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="pl-8">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {notification.body}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pl-8">
          <div className="flex items-center gap-2">
            {!notification.readAt && onMarkRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  onMarkRead();
                  handleDismiss();
                }}
                data-testid="notification-mark-read"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark read
              </Button>
            )}
          </div>
          
          {(notification.metadata?.actionText || notification.metadata?.threadId) && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleAction}
              data-testid="notification-action"
            >
              {notification.metadata?.actionText || "View"}
            </Button>
          )}
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-border/20 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-primary/30 transition-all duration-6000 ease-linear"
            style={{
              width: isVisible && !isExiting ? '0%' : '100%',
              transition: isVisible && !isExiting ? 'width 6s linear' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Notification Manager Component
interface NotificationManagerProps {
  notifications: NotificationData[];
  onMarkRead: (id: number) => void;
  onAction?: (notification: NotificationData) => void;
}

export function NotificationManager({ 
  notifications, 
  onMarkRead, 
  onAction 
}: NotificationManagerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Show only unread notifications and limit to 3 at a time
    const unreadNotifications = notifications
      .filter(n => !n.readAt)
      .slice(0, 3);
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications]);

  const handleDismiss = (notificationId: number) => {
    setVisibleNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3 pointer-events-none">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <InAppNotification
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
            onMarkRead={() => onMarkRead(notification.id)}
            onAction={() => onAction?.(notification)}
          />
        </div>
      ))}
    </div>
  );
}