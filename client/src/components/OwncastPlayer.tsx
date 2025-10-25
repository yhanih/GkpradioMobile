import { useEffect, useState, useRef } from 'react';
import { OWNCAST_CONFIG, getOwncastApiUrl, isOwncastConfigured } from '@/config/owncast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Video, Users } from '@/lib/icons';
// Load hls.js only when needed (saves ~100KB)
let Hls: typeof import('hls.js') | undefined;

interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  streamTitle: string;
}

export function OwncastPlayer() {
  const [status, setStatus] = useState<OwncastStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setLoading(true);
    let interval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/owncast/status');
        if (response.ok) {
          const data = await response.json();
          const isLive = data.online === true;
          const newStatus = {
            online: isLive,
            viewerCount: data.viewerCount || 0,
            streamTitle: data.streamTitle || 'GKP Radio Live'
          };
          
          setStatus(prevStatus => {
            // Only update if status actually changed to reduce re-renders
            if (!prevStatus || 
                prevStatus.online !== newStatus.online || 
                prevStatus.viewerCount !== newStatus.viewerCount ||
                prevStatus.streamTitle !== newStatus.streamTitle) {
              return newStatus;
            }
            return prevStatus;
          });
          
          setError(null);
          
          // Adaptive polling: faster when live, slower when offline
          const nextPollInterval = isLive ? 10000 : 30000; // 10s live, 30s offline
          clearInterval(interval);
          interval = setInterval(fetchStatus, nextPollInterval);
        } else {
          throw new Error('Failed to fetch status');
        }
      } catch (err) {
        setStatus({
          online: false,
          viewerCount: 0,
          streamTitle: 'GKP Radio Live'
        });
        setError(null);
        setLoading(false);
        
        // Retry more frequently on error
        clearInterval(interval);
        interval = setInterval(fetchStatus, 15000);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchStatus();

    return () => {
      clearInterval(interval);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  // Setup video player whenever status changes
  useEffect(() => {
    const setupVideoPlayer = () => {
      if (!videoRef.current) return;

      // Clean up existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (status?.online) {
        if (!Hls) {
          const mod = await import('hls.js');
          Hls = mod.default || (mod as any);
        }
        if (Hls && (Hls as any).isSupported()) {
          const hls = new (Hls as any)({
            enableWorker: true,
            lowLatencyMode: false, // Disable low latency for stability
            backBufferLength: 60, // Keep 60s of past content
            maxBufferLength: 60, // Buffer 60 seconds ahead
            maxMaxBufferLength: 180, // Maximum 3 minutes buffer
            liveSyncDurationCount: 3, // Stay 3 segments from edge for stability
            liveMaxLatencyDurationCount: 10, // Allow up to 10 segments behind
            liveDurationInfinity: true,
            levelLoadingTimeOut: 30000, // 30s timeout
            manifestLoadingTimeOut: 30000,
            fragLoadingTimeOut: 60000, // 60s for slow connections
            startFragPrefetch: true,
            testBandwidth: true, // Test bandwidth for adaptive quality
            progressive: true,
            highBufferWatchdogPeriod: 2, // Check buffer every 2s
            nudgeOffset: 0.5, // Less aggressive nudging
            nudgeMaxRetry: 3, // Fewer nudge attempts
            maxFragLookUpTolerance: 2, // More tolerance for fragments
            enableSoftwareAES: false,
            startLevel: 0, // Start with lowest quality
            abrEwmaDefaultEstimate: 500000, // Assume 500kbps initially
            xhrSetup: (xhr, url) => {
              xhr.timeout = 30000; // 30 second timeout
            }
          });
          
          hlsRef.current = hls;
          hls.loadSource('/api/owncast/stream.m3u8');
          hls.attachMedia(videoRef.current);
          
          hls.on((Hls as any).Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => {});
          });
          
          // Handle errors with automatic recovery
          hls.on((Hls as any).Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case (Hls as any).ErrorTypes.NETWORK_ERROR:
                  setTimeout(() => {
                    hls.startLoad();
                  }, 2000);
                  break;
                case (Hls as any).ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  setTimeout(() => {
                    setupVideoPlayer();
                  }, 5000);
                  break;
              }
            }
          });
          
          // Monitor buffer health instead of aggressively jumping to live edge
          const bufferMonitor = setInterval(() => {
            if (videoRef.current && hls.media) {
              const buffered = videoRef.current.buffered;
              if (buffered.length > 0) {
                const bufferEnd = buffered.end(buffered.length - 1);
                const currentTime = videoRef.current.currentTime;
                const bufferLength = bufferEnd - currentTime;
                
                // If buffer is too low, reduce quality to prevent interruptions
                if (bufferLength < 10 && hls.currentLevel > 0) {
                  hls.currentLevel = hls.currentLevel - 1;
                }
                
                // If buffer is healthy and connection is good, allow auto quality
                if (bufferLength > 30 && hls.autoLevelEnabled === false) {
                  hls.currentLevel = -1; // Auto mode
                }
                
                // Only adjust playback rate slightly to prevent jarring jumps
                if (hls.latency > 10 && videoRef.current.playbackRate === 1.0) {
                  videoRef.current.playbackRate = 1.05; // Very slight speedup
                } else if (hls.latency < 5 && videoRef.current.playbackRate > 1.0) {
                  videoRef.current.playbackRate = 1.0;
                }
              }
            }
          }, 5000);
          
          // Store interval ID for cleanup
          videoRef.current.dataset.bufferMonitor = String(bufferMonitor);
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari, also try to minimize latency
          videoRef.current.src = '/api/owncast/stream.m3u8';
          videoRef.current.play().catch(() => {});
          
          // Safari-specific: Jump to live edge periodically
          setInterval(() => {
            if (videoRef.current && videoRef.current.duration && !videoRef.current.seeking) {
              const liveEdge = videoRef.current.duration;
              const currentTime = videoRef.current.currentTime;
              if (liveEdge - currentTime > 2) {
                videoRef.current.currentTime = liveEdge - 0.5;
              }
            }
          }, 2000);
        }
      } else {
        // Don't set any video source when offline - just show black screen
        videoRef.current.src = '';
        // No need to play when offline
      }
    };

    setupVideoPlayer();
  }, [status]);

  // Always show the player since we have Bob's VPS configured
  const showPlayer = true;

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-faith-gold"></div>
            <span className="ml-3">Connecting to stream...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Connection Error</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stream Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
            status?.online 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-lg' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              status?.online ? 'bg-red-500 animate-pulse shadow-red-500/50 shadow-lg' : 'bg-gray-400'
            }`} />
            {status?.online ? '🔴 LIVE NOW' : '⚫ OFFLINE'}
          </div>
          
          {status?.online && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {status.viewerCount} viewers
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('http://74.208.102.89:8080', '_blank')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Owncast
        </Button>
      </div>

      {/* Clean Video Player - Twitch Style */}
      <Card className="w-full overflow-hidden bg-black">
        <CardContent className="p-0">
          <div className="relative w-full aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              autoPlay
              muted
              playsInline
            >
              <p className="text-white p-4">
                {status?.online ? 'Loading live stream...' : 'Stream offline'}
              </p>
            </video>
            
            {/* Stream Info Overlay */}
            {status?.online && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                  <span className="text-xs text-gray-300">• {status.viewerCount} viewers</span>
                </div>
              </div>
            )}

            {/* Fullscreen Toggle - Only control available */}
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="bg-black/70 text-white border-white/30 hover:bg-black/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
            
            {/* Click to unmute overlay (for autoplay policy) */}
            {status?.online && !videoRef.current?.paused && videoRef.current?.muted && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                onClick={() => {
                  if (videoRef.current && videoRef.current.muted) {
                    videoRef.current.muted = false;
                    videoRef.current.play();
                    // Force re-render to hide this overlay
                    setStatus({...status});
                  }
                }}
              >
                <div className="bg-black/80 text-white px-6 py-3 rounded-lg">
                  <p className="text-lg font-medium">Click to unmute</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Broadcasting Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">For Broadcasters</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>RTMP URL:</strong> rtmp://74.208.102.89:1935/live</p>
            <p><strong>Stream Key:</strong> gkpAdmin2025@</p>
            <p>Use OBS Studio to broadcast to your VPS server.</p>
            <p className="text-amber-600 font-medium">Note: Ensure port 1935 is open on your VPS firewall.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}