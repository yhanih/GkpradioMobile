import { useEffect, useState } from "react";
import { Radio, Users, Mic, WifiOff, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, StreamStatusSkeleton, FallbackMessage } from "./FallbackUI";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StreamData {
  isLive: boolean;
  isConnected: boolean;
  song: {
    title: string;
    artist: string;
    album?: string;
  };
  station: {
    name: string;
    listeners: number;
    isLive: boolean;
  };
  program: {
    title: string;
    host: string;
    description: string;
  };
  error?: string;
}

export function StreamingStatusWidget() {
  const [lastSuccessfulData, setLastSuccessfulData] = useState<StreamData | null>(null);

  const { 
    data: streamData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ["/api/stream/status"],
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 3,
    retryDelay: 2000,
    staleTime: 5000
  });

  // Update last successful data when we get new data
  useEffect(() => {
    if (streamData && !(streamData as StreamData)?.error) {
      setLastSuccessfulData(streamData as StreamData);
    }
  }, [streamData]);

  // Use current data if available, otherwise fall back to last successful data
  const displayData = (streamData as StreamData) || lastSuccessfulData;
  const hasError = error || (displayData?.error && !displayData?.isConnected);

  if (isLoading && !lastSuccessfulData) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <StreamStatusSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (hasError && !displayData) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <FallbackMessage
            type="offline"
            title="Stream Unavailable"
            message="Unable to connect to the radio stream. Please check your connection."
            action={{
              label: "Try Again",
              onClick: () => refetch()
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-r from-card via-card to-accent/5 border-l-4 border-l-live-indicator">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Stream Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-live-indicator/20 to-accent/20 flex items-center justify-center">
                {displayData?.isLive ? (
                  <Mic className="w-6 h-6 text-live-indicator" />
                ) : (
                  <Radio className="w-6 h-6 text-live-indicator" />
                )}
              </div>
              
              {/* Connection status indicator */}
              <div className="absolute -bottom-1 -right-1">
                {hasError ? (
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-card" />
                ) : displayData?.isConnected ? (
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                ) : (
                  <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-card" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {displayData?.station.name || "GKP Radio"}
                </h3>
                
                {hasError ? (
                  <StatusBadge status="offline" />
                ) : displayData?.isLive ? (
                  <StatusBadge status="online" label="Live" />
                ) : (
                  <StatusBadge status="online" label="Auto DJ" />
                )}
              </div>

              {/* Current program */}
              <div className="text-sm text-muted-foreground">
                <p className="truncate">
                  {displayData?.program.title || "Continuous Music"}
                </p>
                {displayData?.program.host && (
                  <p className="text-xs truncate opacity-75">
                    with {displayData.program.host}
                  </p>
                )}
              </div>

              {/* Now playing */}
              {displayData?.song.title && displayData?.song.artist ? (
                <div className="text-xs bg-muted/50 rounded px-2 py-1">
                  <p className="font-medium truncate">
                    {displayData.song.artist} - {displayData.song.title}
                  </p>
                </div>
              ) : hasError ? (
                <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Connection lost - attempting to reconnect
                </div>
              ) : null}
            </div>
          </div>

          {/* Stats and actions */}
          <div className="flex flex-col items-end gap-2">
            {/* Listener count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{displayData?.station.listeners || 0}</span>
            </div>

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="stream-refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error message for temporary issues */}
        {hasError && displayData && (
          <div className="mt-3 p-2 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-700 dark:text-orange-300">
            Stream connection interrupted. Using cached data. 
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs ml-1 text-orange-700 dark:text-orange-300"
              onClick={() => refetch()}
            >
              Retry now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}