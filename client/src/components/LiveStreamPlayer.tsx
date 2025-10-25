import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Mic, 
  Users, 
  Radio,
  Settings,
  Maximize,
  ExternalLink
} from 'lucide-react';

interface LiveStreamPlayerProps {
  streamUrl?: string;
  isLive?: boolean;
  streamTitle?: string;
  streamerName?: string;
  viewerCount?: number;
}

const LiveStreamPlayer = ({ 
  streamUrl = '',
  isLive = false,
  streamTitle = 'GKP Radio Live Stream',
  streamerName = 'Pastor Team',
  viewerCount = 0
}: LiveStreamPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ready' | 'connecting' | 'connected' | 'error'>('ready');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle play/pause
  const handlePlayPause = () => {
    if (!streamUrl) {
      setConnectionStatus('error');
      return;
    }

    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setConnectionStatus('ready');
    } else {
      setConnectionStatus('connecting');
      
      // Try video first, fallback to audio
      if (videoRef.current) {
        videoRef.current.src = streamUrl;
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setConnectionStatus('connected');
          })
          .catch(() => {
            // Fallback to audio only
            if (audioRef.current) {
              audioRef.current.src = streamUrl;
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setConnectionStatus('connected');
                })
                .catch(() => {
                  setConnectionStatus('error');
                });
            }
          });
      }
    }
  };

  // Handle volume changes
  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    const volumeValue = value[0] / 100;
    if (videoRef.current) videoRef.current.volume = volumeValue;
    if (audioRef.current) audioRef.current.volume = volumeValue;
    if (value[0] > 0) setIsMuted(false);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) videoRef.current.muted = newMuted;
    if (audioRef.current) audioRef.current.muted = newMuted;
  };

  // Set initial volume
  useEffect(() => {
    const volumeValue = volume[0] / 100;
    if (videoRef.current) videoRef.current.volume = volumeValue;
    if (audioRef.current) audioRef.current.volume = volumeValue;
  }, [volume]);

  // Stream status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Failed';
      default: return 'Ready';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Player Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-live-indicator/20 to-accent/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-live-indicator" />
                </div>
                {isLive && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-live-indicator rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{streamTitle}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isLive ? `Live with ${streamerName}` : 'Offline - Check back later'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={`${isLive ? 'bg-live-indicator text-live-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
              </Badge>
              
              {viewerCount > 0 && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{viewerCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video/Audio Player */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {/* Video Element (hidden if no video stream) */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls={false}
              muted={isMuted}
              onLoadedData={() => setConnectionStatus('connected')}
              onError={() => {
                // Video failed, will try audio
                setConnectionStatus('connecting');
              }}
            />
            
            {/* Audio Element (fallback) */}
            <audio
              ref={audioRef}
              muted={isMuted}
              onLoadedData={() => setConnectionStatus('connected')}
              onError={() => setConnectionStatus('error')}
            />
            
            {/* Overlay for when not playing */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Radio className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-white">
                      {isLive ? 'GKP Radio Live Stream' : 'Stream Offline'}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {isLive ? 'Click play to join the live broadcast' : 'No live broadcast at this time'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Control Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <div className="flex items-center justify-between">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                  <span className="text-white text-sm">{getStatusText()}</span>
                </div>
                
                {/* External Link (for YouTube/Twitch streams) */}
                {streamUrl.includes('youtube.com') || streamUrl.includes('twitch.tv') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => window.open(streamUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Play Controls */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handlePlayPause}
                disabled={!isLive}
                className={`w-12 h-12 rounded-full ${
                  isPlaying 
                    ? 'btn-live animate-pulse' 
                    : 'btn-faith-primary hover:btn-live'
                } transition-all duration-300`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
              
              {/* Volume Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="w-8 h-8"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <Slider
                  value={isMuted ? [0] : volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="w-8 h-8">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                🎙️ LIVE BROADCAST READY
              </Badge>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Radio className="w-3 h-3" />
                <span>GKP Radio - Faith & Community Broadcasting</span>
              </div>
            </div>

            <div className="text-muted-foreground">
              Ready for OBS Studio streaming
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStreamPlayer;