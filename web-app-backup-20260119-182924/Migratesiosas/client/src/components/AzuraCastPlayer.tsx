import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Users, Clock, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface CurrentTrack {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number;
  elapsed: number;
  isLive: boolean;
  streamerName: string;
}

interface StationStatus {
  isLive: boolean;
  listeners: number;
  currentTrack: CurrentTrack;
  station: {
    name: string;
    description: string;
    listen_url: string;
  };
}

const AzuraCastPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch station status
  const { data: stationStatus, isLoading, error } = useQuery<StationStatus>({
    queryKey: ['/api/azuracast/status'],
    refetchInterval: 10000, // Update every 10 seconds
    retry: 3
  });

  // Fetch stream URL
  const { data: streamData } = useQuery<{ streamUrl: string }>({
    queryKey: ['/api/azuracast/stream-url'],
    retry: 3
  });

  useEffect(() => {
    if (streamData?.streamUrl) {
      setStreamUrl(streamData.streamUrl);
    }
  }, [streamData]);

  // Audio element management
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    if (!streamUrl) return;

    if (audioRef.current) {
      if (!isPlaying) {
        try {
          audioRef.current.src = streamUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Failed to play stream:', error);
        }
      } else {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stationStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Radio className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-2">Station Offline</h3>
          <p className="text-sm text-muted-foreground">
            Unable to connect to AzuraCast station. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { currentTrack, isLive, listeners } = stationStatus;

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        preload="none"
        onError={() => setIsPlaying(false)}
      />

      {/* Main Player */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {/* Album Artwork / Live Indicator */}
            <div className="relative flex-shrink-0">
              {currentTrack.artwork ? (
                <img
                  src={currentTrack.artwork}
                  alt="Album artwork"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {isLive ? (
                    <Radio className="w-8 h-8 text-primary" />
                  ) : (
                    <Disc3 className="w-8 h-8 text-primary" />
                  )}
                </div>
              )}
              
              {isLive && (
                <Badge className="absolute -top-2 -right-2 bg-live-indicator text-live-foreground text-xs px-2 animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg truncate">
                {currentTrack.title}
              </h3>
              <p className="text-muted-foreground truncate">
                {isLive && currentTrack.streamerName 
                  ? `Live with ${currentTrack.streamerName}`
                  : currentTrack.artist
                }
              </p>
              {currentTrack.album && !isLive && (
                <p className="text-sm text-muted-foreground truncate">
                  {currentTrack.album}
                </p>
              )}
              
              {/* Progress Bar for non-live content */}
              {!isLive && currentTrack.duration > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${(currentTrack.elapsed / currentTrack.duration) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTrack.elapsed)}</span>
                    <span>{formatTime(currentTrack.duration)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Listener Count */}
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{listeners.toLocaleString()}</span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>

              {/* Play/Pause Button */}
              <Button
                onClick={togglePlayPause}
                disabled={!streamUrl}
                className="btn-faith-gold px-6"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {isPlaying ? "Pause" : "Listen"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Badge variant={isLive ? "default" : "secondary"} className="text-xs">
                {isLive ? "🔴 LIVE BROADCAST" : "📻 AUTOMATED"}
              </Badge>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Radio className="w-3 h-3" />
                <span>GKP Radio - Faith & Community</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>24/7 Broadcasting</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AzuraCastPlayer;