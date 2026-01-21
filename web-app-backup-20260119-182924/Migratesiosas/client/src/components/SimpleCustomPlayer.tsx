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

export function SimpleCustomPlayer() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamHealth, setStreamHealth] = useState<'good' | 'poor' | 'critical'>('good');
  
  const { data: status, isLoading } = useQuery<OwncastStatus>({
    queryKey: ['/api/owncast/status'],
    refetchInterval: 5000,
  });

  const toggleFullscreen = () => {
    const container = document.getElementById('player-container');
    if (!isFullscreen && container) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else if (isFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Custom Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <Radio className="h-7 w-7 text-faith-gold" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              GKP Radio Live
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status?.online ? 'Broadcasting Now' : 'Currently Offline'}
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
              {status.viewerCount}
            </Badge>
          </div>
        )}
      </div>

      {/* Player Container */}
      <div 
        id="player-container"
        className="relative bg-black rounded-lg overflow-hidden shadow-xl"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <Loader2 className="h-12 w-12 text-faith-gold animate-spin" />
          </div>
        )}

        {/* Iframe */}
        <iframe
          src="https://74.208.102.89:8080/embed/video"
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay"
          title="GKP Radio Stream"
        />

        {/* Simple Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-end">
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

        {/* Offline Overlay */}
        {status && !status.online && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-20">
            <div className="text-center space-y-4">
              <Radio className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Stream Offline
                </h3>
                <p className="text-gray-400">
                  Check back later for live broadcasts
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stream Info Bar with Health Indicator */}
      {status?.online && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-semibold text-green-600">Live</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Viewers</p>
              <p className="font-semibold">{status.viewerCount}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Quality</p>
              <p className="font-semibold">HD 1080p</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Stream Health</p>
              <p className={`font-semibold ${
                streamHealth === 'good' ? 'text-green-600' : 
                streamHealth === 'poor' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {streamHealth === 'good' ? 'Stable' : 
                 streamHealth === 'poor' ? 'Buffering' : 
                 'Unstable'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}