import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Users, 
  Settings,
  Copy,
  CheckCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamState {
  isLive: boolean;
  streamUrl: string;
  title: string;
  streamer: string;
  viewers: number;
  startTime?: string;
}

const BroadcastDashboard = () => {
  const [streamState, setStreamState] = useState<StreamState>({
    isLive: false,
    streamUrl: '',
    title: 'GKP Radio Live Stream',
    streamer: 'Pastor Team',
    viewers: 0
  });
  
  const [title, setTitle] = useState(streamState.title);
  const [streamer, setStreamer] = useState(streamState.streamer);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // OBS Settings for copy-paste - dynamic URL generation for VPS deployment
  const getRTMPServer = () => {
    const vpsHost = import.meta.env.VITE_VPS_HOST || window.location.hostname;
    return `rtmp://${vpsHost}:1935/live`;
  };

  const obsSettings = {
    server: getRTMPServer(),
    streamKey: 'gkp_radio_live'
  };

  useEffect(() => {
    fetchStreamState();
    const interval = setInterval(fetchStreamState, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStreamState = async () => {
    try {
      const response = await fetch('/api/stream/status');
      if (response.ok) {
        const data = await response.json();
        setStreamState(data);
        setTitle(data.title);
        setStreamer(data.streamer);
      }
    } catch (error) {
      console.error('Failed to fetch stream state:', error);
    }
  };

  const startStream = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: `${import.meta.env.VITE_HLS_BASE_URL || `http://${window.location.hostname}:8000`}/live/gkp_radio_live.flv`,
          title,
          streamer
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStreamState(data);
        toast({
          title: "Stream Started",
          description: "Your live broadcast is now active!"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to start stream",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stream/stop', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setStreamState(data);
        toast({
          title: "Stream Stopped",
          description: "Your broadcast has ended."
        });
      }
    } catch (error) {
      toast({
        title: "Failed to stop stream",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  return (
    <div className="space-y-6">
      {/* Stream Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Radio className="w-5 h-5" />
              <span>Broadcast Status</span>
            </CardTitle>
            <Badge 
              className={`${
                streamState.isLive 
                  ? 'bg-live-indicator text-live-foreground animate-pulse' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {streamState.isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {streamState.isLive && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span>Viewers</span>
                </div>
                <div className="text-2xl font-bold">{streamState.viewers}</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="text-2xl font-bold">
                  {streamState.startTime 
                    ? Math.floor((Date.now() - new Date(streamState.startTime).getTime()) / 60000) + 'm'
                    : '0m'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OBS Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>OBS Studio Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Stream Server</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={obsSettings.server} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(obsSettings.server, 'Server URL')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Stream Key</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={obsSettings.streamKey} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(obsSettings.streamKey, 'Stream Key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Quick Setup:</p>
            <ol className="space-y-1 text-muted-foreground">
              <li>1. Open OBS Studio → Settings → Stream</li>
              <li>2. Service: Custom</li>
              <li>3. Copy server URL and stream key above</li>
              <li>4. Add your microphone to Sources</li>
              <li>5. Click "Start Streaming" in OBS</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Stream Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Stream Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stream title"
            />
          </div>
          
          <div>
            <Label htmlFor="streamer">Broadcaster Name</Label>
            <Input
              id="streamer"
              value={streamer}
              onChange={(e) => setStreamer(e.target.value)}
              placeholder="Enter broadcaster name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stream Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            {!streamState.isLive ? (
              <Button
                onClick={startStream}
                disabled={isLoading}
                className="btn-live flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                {isLoading ? 'Starting...' : 'Go Live'}
              </Button>
            ) : (
              <Button
                onClick={stopStream}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                <MicOff className="w-4 h-4 mr-2" />
                {isLoading ? 'Stopping...' : 'End Stream'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastDashboard;