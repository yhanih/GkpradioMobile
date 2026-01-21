import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Maximize, Minimize, PlayCircle, PauseCircle, Users, Radio, Loader2, Share2 } from '@/lib/icons';
import { useQuery } from '@tanstack/react-query';
// Lazy-load framer-motion only when this component mounts
let motion: typeof import('framer-motion')['motion'] | undefined;

interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  streamTitle: string;
}

export function CustomIframePlayer() {
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: status, isLoading } = useQuery<OwncastStatus>({
    queryKey: ['/api/owncast/status'],
    refetchInterval: 5000,
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GKP Radio Live Stream',
        text: status?.streamTitle || 'Watch GKP Radio live!',
        url: window.location.href,
      });
    }
  };

  // Initialize framer-motion module lazily
  if (!motion) {
    // Fire-and-forget import; animation props are optional
    import('framer-motion').then((m) => {
      motion = m.motion;
    });
  }

  const MotionDiv: any = motion?.div ?? 'div';

  return (
    <div className="space-y-4">
      {/* Floating Header - Always Visible */}
      <MotionDiv 
        {...(motion && { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } })}
        className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-8 w-8 text-faith-gold" />
            {status?.online && (
              <MotionDiv 
                {...(motion && { animate: { scale: [1, 1.2, 1] }, transition: { repeat: Infinity, duration: 2 } })}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-faith-gold to-faith-green bg-clip-text text-transparent">
              GKP Radio
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status?.online ? 'Broadcasting Live' : 'Stream Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {status?.online && (
            <>
              <Badge variant="destructive" className="gap-1 px-3 py-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {status.viewerCount || 0}
              </Badge>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="hidden sm:flex gap-1"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </MotionDiv>

      {/* Video Player Container */}
      <MotionDiv 
        ref={containerRef}
        {...(motion && { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 } })}
        className="relative overflow-hidden bg-black rounded-xl shadow-2xl"
        style={{ aspectRatio: '16/9' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 text-faith-gold animate-spin mx-auto" />
              <p className="text-white">Loading stream...</p>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src="https://74.208.102.89:8080/embed/video"
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay"
          title="GKP Radio Live Stream"
          onLoad={() => setIsPlaying(true)}
        />

        {/* Custom Controls Overlay */}
        <MotionDiv
          {...(motion && { animate: { opacity: showControls ? 1 : 0 }, transition: { duration: 0.3 } })}
          className={`absolute inset-0 ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          {/* Gradient Background */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause (decorative) */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-10 w-10"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <PauseCircle className="h-6 w-6" />
                  ) : (
                    <PlayCircle className="h-6 w-6" />
                  )}
                </Button>
                
                {/* Volume */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                
                {/* Stream Info */}
                {status?.online && (
                  <div className="text-white">
                    <p className="text-sm font-medium">{status.streamTitle}</p>
                    <p className="text-xs opacity-70">HD Quality • Low Latency</p>
                  </div>
                )}
              </div>
              
              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Offline Overlay */}
        {status && !status.online && (
          <MotionDiv 
            {...(motion && { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-10"
          >
            <div className="text-center space-y-6 p-8">
              <MotionDiv
                {...(motion && { animate: { rotate: 360 }, transition: { duration: 20, repeat: Infinity, ease: "linear" } })}
              >
                <Radio className="h-24 w-24 text-gray-400 mx-auto" />
              </MotionDiv>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  We'll Be Right Back
                </h3>
                <p className="text-gray-400 max-w-md">
                  Our live stream is currently offline. Check back soon for our next broadcast
                  or enjoy our 24/7 radio stream.
                </p>
              </div>
              <Button 
                className="bg-faith-gold hover:bg-faith-gold/90 text-white"
                onClick={() => window.location.reload()}
              >
                Refresh Stream
              </Button>
            </div>
          </MotionDiv>
        )}
      </MotionDiv>

      {/* Stream Stats Bar */}
      {status?.online && (
        <MotionDiv
          {...(motion && { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 } })}
          className="bg-gradient-to-r from-faith-gold/10 to-faith-green/10 rounded-lg p-4"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-semibold text-green-600 dark:text-green-400">Live</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Viewers</p>
              <p className="font-semibold">{status.viewerCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quality</p>
              <p className="font-semibold">HD 1080p</p>
            </div>
          </div>
        </MotionDiv>
      )}
    </div>
  );
}