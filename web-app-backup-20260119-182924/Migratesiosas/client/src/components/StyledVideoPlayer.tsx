import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Maximize, Users, Radio, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  streamTitle: string;
}

export function StyledVideoPlayer() {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { data: status } = useQuery<OwncastStatus>({
    queryKey: ['/api/owncast/status'],
    refetchInterval: (query) => {
      // Adaptive polling: faster when live, slower when offline
      return query.state.data?.online ? 10000 : 30000; // 10s live, 30s offline
    },
    staleTime: 5000, // Consider data stale after 5s
  });

  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (!isFullscreen) {
      container?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    const iframe = document.getElementById('owncast-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // Send message to iframe to toggle mute
      iframe.contentWindow.postMessage({ action: 'toggleMute' }, '*');
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="space-y-4">
      {/* Custom Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-6 w-6 text-faith-gold" />
            {status?.online && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              GKP Radio Live Stream
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status?.online ? status.streamTitle : 'Stream Offline'}
            </p>
          </div>
        </div>
        
        {status?.online && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {status.viewerCount || 0} watching
            </Badge>
          </div>
        )}
      </div>

      {/* Video Player Container */}
      <Card 
        id="video-container"
        className="relative overflow-hidden bg-black rounded-lg shadow-2xl"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading State */}
        {!status && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <Loader2 className="h-12 w-12 text-faith-gold animate-spin" />
          </div>
        )}

        {/* Iframe */}
        <iframe
          id="owncast-iframe"
          src="http://74.208.102.89:8080/embed/video"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay"
          title="GKP Radio Live Stream"
        />

        {/* Custom Overlay Controls - Only show when stream is live */}
        {status?.online && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Offline Message */}
        {status && !status.online && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center space-y-4">
              <Radio className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Stream Currently Offline
                </h3>
                <p className="text-gray-400">
                  Check back later for our live broadcasts
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stream Info */}
      {status?.online && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Now Streaming
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {status.streamTitle || 'Live Broadcast'}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <p>Stream Quality: HD</p>
              <p>Latency: ~15s</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}