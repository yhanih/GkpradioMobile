import { AlertCircle, Wifi, WifiOff, RefreshCw, Clock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FallbackMessageProps {
  type?: 'error' | 'loading' | 'offline' | 'maintenance' | 'empty';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function FallbackMessage({ 
  type = 'error', 
  title, 
  message, 
  action,
  className = ""
}: FallbackMessageProps) {
  const getConfig = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />,
          defaultTitle: "Loading...",
          defaultMessage: "Please wait while we fetch your content.",
          bgColor: "bg-muted/20",
          borderColor: "border-muted/30"
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-8 h-8 text-orange-500" />,
          defaultTitle: "Connection Issues",
          defaultMessage: "Unable to connect to our servers. Please check your connection and try again.",
          bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
          borderColor: "border-orange-200 dark:border-orange-800"
        };
      case 'maintenance':
        return {
          icon: <Clock className="w-8 h-8 text-blue-500" />,
          defaultTitle: "Temporary Maintenance",
          defaultMessage: "This service is temporarily under maintenance. We'll be back shortly.",
          bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-800"
        };
      case 'empty':
        return {
          icon: <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground/40" />
                </div>,
          defaultTitle: "Nothing here yet",
          defaultMessage: "No content is available at the moment.",
          bgColor: "bg-muted/10",
          borderColor: "border-muted/20"
        };
      default: // error
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          defaultTitle: "Something went wrong",
          defaultMessage: "We encountered an unexpected error. Please try again.",
          bgColor: "bg-red-50/50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800"
        };
    }
  };

  const config = getConfig();

  return (
    <Card className={`
      ${config.bgColor} ${config.borderColor} 
      border transition-all duration-300 hover:shadow-md
      ${className}
    `}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="flex items-center justify-center">
          {config.icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-base text-foreground">
            {title || config.defaultTitle}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {message || config.defaultMessage}
          </p>
        </div>

        {action && (
          <Button
            variant={type === 'error' ? 'destructive' : 'outline'}
            size="sm"
            onClick={action.onClick}
            className="mt-4"
            data-testid="fallback-action"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton Components for Loading States
export function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
          <div className="w-4 h-4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function StreamStatusSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 bg-muted rounded-lg" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="w-20 h-8 bg-muted rounded" />
    </div>
  );
}

// Enhanced Error Boundary Component
interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorBoundaryFallback({ 
  error, 
  resetErrorBoundary 
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <FallbackMessage
        type="error"
        title="Oops! Something went wrong"
        message={
          error?.message 
            ? `Error: ${error.message}` 
            : "An unexpected error occurred while loading this content."
        }
        action={
          resetErrorBoundary 
            ? {
                label: "Try again",
                onClick: resetErrorBoundary
              }
            : undefined
        }
        className="max-w-md"
      />
    </div>
  );
}

// Inline Loading State
export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Status Badge with smooth transitions
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading' | 'error';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          label: label || 'Online',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          label: label || 'Offline',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
      case 'loading':
        return {
          color: 'bg-yellow-500',
          label: label || 'Connecting...',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
      default:
        return {
          color: 'bg-gray-500',
          label: label || 'Unknown',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        };
    }
  };

  const config = getConfig();

  return (
    <Badge className={`${config.className} transition-all duration-300`}>
      <div className={`w-2 h-2 rounded-full ${config.color} mr-2 ${
        status === 'loading' ? 'animate-pulse' : ''
      }`} />
      {config.label}
    </Badge>
  );
}