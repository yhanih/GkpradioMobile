import { useState, useEffect, useCallback } from 'react';
import { radioConfig } from '@/config/radio';

interface StreamMetadata {
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
}

interface StreamStatus {
  isConnected: boolean;
  isPlaying: boolean;
  isLive: boolean;
  error: string | null;
}

export const useAzuraCastStream = () => {
  const [metadata, setMetadata] = useState<StreamMetadata>({
    song: { title: '', artist: '' },
    station: { name: radioConfig.stationName, listeners: 0, isLive: false },
    program: radioConfig.programs.autodj
  });
  
  const [status, setStatus] = useState<StreamStatus>({
    isConnected: false,
    isPlaying: false,
    isLive: false,
    error: null
  });

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Fetch metadata from real AzuraCast API via our backend
  const fetchMetadata = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for client
      
      const response = await fetch('/api/stream/status', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        setMetadata({
          song: data.song,
          station: data.station,
          program: data.program
        });

        setStatus(prev => ({ 
          ...prev, 
          isLive: data.station.isLive,
          isConnected: data.isConnected !== false,
          error: data.error || null
        }));
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to fetch metadata:', error);
      
      const isTimeout = error.name === 'AbortError';
      const errorMessage = isTimeout 
        ? 'Connection timeout - retrying...' 
        : 'Unable to connect to stream server';
      
      setStatus(prev => ({ 
        ...prev, 
        isConnected: !isTimeout, // Still connected if just timeout
        error: errorMessage
      }));
      
      // Set fallback metadata only for connection errors, not timeouts
      if (!isTimeout) {
        setMetadata({
          song: {
            title: 'Connection Error',
            artist: 'Please check stream server',
          },
          station: {
            name: radioConfig.stationName,
            listeners: 0,
            isLive: false
          },
          program: radioConfig.programs.autodj
        });
      }
    }
  }, []);

  // Initialize audio player
  const initializeAudio = useCallback(() => {
    if (audio) return audio;

    const newAudio = new Audio();
    newAudio.crossOrigin = 'anonymous';
    newAudio.preload = 'none';
    
    // Low latency configuration
    if (radioConfig.lowLatency.enabled) {
      newAudio.currentTime = radioConfig.lowLatency.bufferTime;
    }

    // Event listeners
    newAudio.addEventListener('loadstart', () => {
      setStatus(prev => ({ ...prev, isConnected: false, error: null }));
    });

    newAudio.addEventListener('canplay', () => {
      setStatus(prev => ({ ...prev, isConnected: true, error: null }));
    });

    newAudio.addEventListener('playing', () => {
      setStatus(prev => ({ ...prev, isPlaying: true }));
    });

    newAudio.addEventListener('pause', () => {
      setStatus(prev => ({ ...prev, isPlaying: false }));
    });

    newAudio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      const errorMessage = `Stream error: ${e.type}`;
      setStatus(prev => ({ 
        ...prev, 
        isConnected: false, 
        isPlaying: false, 
        error: errorMessage 
      }));
    });

    newAudio.addEventListener('stalled', () => {
      // Handle stream interruptions
      if (radioConfig.autoReconnect && newAudio.readyState < 3) {
        setTimeout(() => {
          newAudio.load();
          if (status.isPlaying) {
            newAudio.play().catch(console.warn);
          }
        }, radioConfig.reconnectDelay);
      }
    });

    setAudio(newAudio);
    return newAudio;
  }, [audio, status.isPlaying]);

  // Play/pause controls
  const play = useCallback(async () => {
    const audioElement = initializeAudio();
    
    // Use the real AzuraCast stream URL
    const streamUrl = radioConfig.streamUrl;
    
    if (audioElement.src !== streamUrl) {
      audioElement.src = streamUrl;
      audioElement.load(); // Force reload with new source
    }

    try {
      // Set volume before playing
      audioElement.volume = 0.75;
      await audioElement.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: 'Could not start playback. Click to try again.' 
      }));
    }
  }, [initializeAudio]);

  const pause = useCallback(() => {
    if (audio) {
      audio.pause();
    }
  }, [audio]);

  const setVolume = useCallback((volume: number) => {
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [audio]);

  // Metadata polling with smart interval management
  useEffect(() => {
    fetchMetadata(); // Initial fetch
    
    let interval: NodeJS.Timeout;
    
    // Only start polling if tab is visible to reduce server load
    const startPolling = () => {
      interval = setInterval(
        fetchMetadata, 
        radioConfig.metadataRefreshInterval
      );
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
      }
    };

    // Handle visibility changes to optimize polling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchMetadata(); // Fetch immediately when tab becomes visible
        startPolling();
      }
    };

    // Start initial polling if tab is visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMetadata]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  return {
    metadata,
    status,
    controls: {
      play,
      pause,
      setVolume
    }
  };
};