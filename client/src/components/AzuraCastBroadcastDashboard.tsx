import { useState, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Users, MessageCircle, Settings, Upload, Calendar, Clock, Radio, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StreamStatus {
  isLive: boolean;
  isConnected: boolean;
  song: {
    title: string;
    artist: string;
    album: string | null;
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
  streamUrl: string;
}

interface BroadcastingDashboardProps {
  user: any;
}

const AzuraCastBroadcastDashboard = ({ user }: BroadcastingDashboardProps) => {
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastDescription, setBroadcastDescription] = useState("");
  const queryClient = useQueryClient();

  // Fetch stream status from unified endpoint
  const { data: streamStatus, isLoading, error } = useQuery<StreamStatus>({
    queryKey: ['/api/stream/status'],
    refetchInterval: 5000, // Update every 5 seconds
    retry: 3
  });

  // Station control mutations - endpoints removed, kept for future implementation
  const startStationMutation = useMutation({
    mutationFn: () => apiRequest('/api/stream/start', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stream/status'] });
    }
  });

  const stopStationMutation = useMutation({
    mutationFn: () => apiRequest('/api/stream/stop', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stream/status'] });
    }
  });

  const isConnected = streamStatus?.isConnected || false;
  const isLive = streamStatus?.isLive || false;
  const listeners = streamStatus?.station?.listeners || 0;
  const currentTrack = streamStatus?.song;

  const handleStartBroadcast = () => {
    if (!broadcastTitle.trim()) {
      alert("Please enter a broadcast title");
      return;
    }
    startStationMutation.mutate();
  };

  const handleStopBroadcast = () => {
    stopStationMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-3xl">Broadcasting Dashboard</h1>
            <p className="text-muted-foreground">Connected to: {streamStatus?.station?.name || "GKP Radio"}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            <Badge className={`text-sm px-3 py-1 ${isLive ? 'bg-live-indicator text-live-foreground animate-pulse' : 'bg-secondary'}`}>
              {isLive ? '🔴 ON AIR' : '⚪ OFF AIR'}
            </Badge>
          </div>
        </div>

        {/* Connection Error */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <Radio className="h-4 w-4" />
            <AlertDescription>
              Unable to connect to AzuraCast server. Please check your credentials and server status.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Broadcasting Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  Station Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="font-bold text-2xl text-primary">{listeners}</div>
                        <div className="text-sm text-muted-foreground">Active Listeners</div>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="font-bold text-2xl text-accent">{isLive ? 'LIVE' : 'AUTO'}</div>
                        <div className="text-sm text-muted-foreground">Broadcast Mode</div>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="font-bold text-2xl text-faith-gold">24/7</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                    </div>

                    {currentTrack && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Now Playing</h4>
                        <div className="space-y-1">
                          <p className="font-medium">{currentTrack.title || 'GKP Radio'}</p>
                          <p className="text-sm text-muted-foreground">
                            {isLive && streamStatus?.program?.host 
                              ? `Live with ${streamStatus.program.host}`
                              : currentTrack.artist || 'Now Playing'
                            }
                          </p>
                          {currentTrack.album && !isLive && (
                            <p className="text-xs text-muted-foreground">{currentTrack.album}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Unable to connect to AzuraCast station</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Broadcast Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Live Broadcast Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcast-title">Broadcast Title</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="e.g., Faith Talk with Pastor David"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    disabled={isLive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broadcast-description">Description</Label>
                  <Textarea
                    id="broadcast-description"
                    placeholder="Share what this broadcast is about..."
                    value={broadcastDescription}
                    onChange={(e) => setBroadcastDescription(e.target.value)}
                    disabled={isLive}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Live Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Station Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  {!isLive ? (
                    <Button 
                      onClick={handleStartBroadcast}
                      disabled={!isConnected || startStationMutation.isPending}
                      className="btn-live text-xl px-8 py-6"
                      size="lg"
                    >
                      <Play className="w-6 h-6 mr-2" />
                      {startStationMutation.isPending ? 'Starting...' : 'Start Station'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStopBroadcast}
                      disabled={!isConnected || stopStationMutation.isPending}
                      variant="destructive"
                      size="lg"
                      className="px-8 py-6"
                    >
                      <Pause className="w-6 h-6 mr-2" />
                      {stopStationMutation.isPending ? 'Stopping...' : 'Stop Station'}
                    </Button>
                  )}
                </div>

                {isLive && (
                  <div className="mt-6 p-4 bg-live-indicator/10 rounded-lg">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">STATION ON AIR</h3>
                      <p className="text-sm text-muted-foreground">{broadcastTitle || "Live Broadcasting"}</p>
                      <div className="flex items-center justify-center mt-2 space-x-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="font-medium">{listeners} listeners</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Broadcasting live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Connection Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Server Status</Label>
                  <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected to AzuraCast' : 'Connection Failed'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Station Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {streamStatus?.station?.name || 'Not available'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Stream URL</Label>
                  <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                    {streamStatus?.streamUrl || 'Not available'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Broadcasting Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Broadcasting Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>1.</strong> Connect your streaming software (OBS, BUTT, etc.) to your AzuraCast server</p>
                  <p><strong>2.</strong> Configure audio settings and start your stream</p>
                  <p><strong>3.</strong> Use the controls above to manage station status</p>
                  <p><strong>4.</strong> Monitor listener count and engagement</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="font-bold text-2xl text-primary">{listeners}</div>
                  <div className="text-sm text-muted-foreground">Current Listeners</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-accent">{isLive ? 'LIVE' : 'AUTO'}</div>
                  <div className="text-sm text-muted-foreground">Broadcast Mode</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-faith-gold">GKP</div>
                  <div className="text-sm text-muted-foreground">Radio Station</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AzuraCastBroadcastDashboard;