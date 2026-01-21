import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  volume: number;
  isMuted: boolean;
}

interface AudioContextType {
  metadata: StreamMetadata;
  status: StreamStatus;
  controls: {
    play: () => Promise<void>;
    pause: () => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
  };
}

const AudioContext = createContext<AudioContextType | null>(null);

// Create a single shared audio instance
const sharedAudio = new Audio();
sharedAudio.crossOrigin = 'anonymous';
sharedAudio.preload = 'none';

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metadata, setMetadata] = useState<StreamMetadata>({
    song: { title: '', artist: '' },
    station: { name: radioConfig.stationName, listeners: 0, isLive: false },
    program: radioConfig.programs.autodj
  });
  
  const [status, setStatus] = useState<StreamStatus>({
    isConnected: false,
    isPlaying: false,
    isLive: false,
    error: null,
    volume: 75,
    isMuted: false
  });

  const audioRef = useRef<HTMLAudioElement>(sharedAudio);

  // Fetch metadata from real AzuraCast API via our backend
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch('/api/stream/status');
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle both successful connection and fallback data
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
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isConnected: false,
        error: 'Network connection error'
      }));
      
      // Set clean fallback metadata - no technical errors shown to users
      setMetadata({
        song: {
          title: '',
          artist: '',
        },
        station: {
          name: radioConfig.stationName,
          listeners: 0,
          isLive: false
        },
        program: radioConfig.programs.autodj
      });
    }
  }, []);

  // Memoize event handlers to prevent recreation
  const handleLoadStart = useCallback(() => {
    setStatus(prev => ({ ...prev, isConnected: false, error: null }));
  }, []);

  const handleCanPlay = useCallback(() => {
    setStatus(prev => ({ ...prev, isConnected: true, error: null }));
  }, []);

  const handlePlaying = useCallback(() => {
    setStatus(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setStatus(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleError = useCallback((e: Event) => {
    console.error('Audio error:', e);
    // Don't expose technical error details to users
    // Just set internal error state for debugging
    setStatus(prev => ({ 
      ...prev, 
      isConnected: false, 
      isPlaying: false, 
      error: process.env.NODE_ENV === 'development' ? `Stream error: ${e.type}` : 'stream_error'
    }));
  }, []);

  const handleStalled = useCallback(() => {
    // Handle stream interruptions
    const audio = audioRef.current;
    if (radioConfig.autoReconnect && audio.readyState < 3) {
      setTimeout(() => {
        audio.load();
        // Use ref to get current playing state instead of stale closure
        setStatus(current => {
          if (current.isPlaying) {
            audio.play().catch(console.warn);
          }
          return current;
        });
      }, radioConfig.reconnectDelay);
    }
  }, []);

  // Setup audio event listeners once - removed status.isPlaying dependency
  useEffect(() => {
    const audio = audioRef.current;

    // Low latency configuration
    if (radioConfig.lowLatency.enabled) {
      audio.currentTime = radioConfig.lowLatency.bufferTime;
    }

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [handleLoadStart, handleCanPlay, handlePlaying, handlePause, handleError, handleStalled]);

  // Play/pause controls
  const play = useCallback(async () => {
    const audio = audioRef.current;
    
    // Use the real AzuraCast stream URL
    const streamUrl = radioConfig.streamUrl;
    
    if (audio.src !== streamUrl) {
      audio.src = streamUrl;
      audio.load(); // Force reload with new source
    }

    try {
      // Maintain current volume when playing
      audio.volume = status.isMuted ? 0 : status.volume / 100;
      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      // Set clean error state - users don't see technical details
      setStatus(prev => ({ 
        ...prev, 
        isConnected: false,
        error: 'playback_error'
      }));
    }
  }, [status.isMuted, status.volume]); // Add proper dependencies

  const pause = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    
    // Clear src to free resources
    audio.src = '';
    audio.load();
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    // Ensure volume is between 0 and 100
    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    // Update audio element volume (0-1 range)
    audio.volume = clampedVolume / 100;
    
    // Update status to sync across all components
    setStatus(prev => ({ ...prev, volume: clampedVolume, isMuted: false }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    
    setStatus(prev => {
      if (prev.isMuted) {
        // Unmute: restore previous volume
        audio.volume = prev.volume / 100;
        return { ...prev, isMuted: false };
      } else {
        // Mute: set volume to 0 but remember current volume
        audio.volume = 0;
        return { ...prev, isMuted: true };
      }
    });
  }, []); // Remove status dependencies to prevent recreation

  // Start fetching metadata
  useEffect(() => {
    fetchMetadata();
    
    // Set up polling interval
    const interval = setInterval(fetchMetadata, radioConfig.metadataRefreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchMetadata]);

  const value: AudioContextType = {
    metadata,
    status,
    controls: {
      play,
      pause,
      setVolume,
      toggleMute
    }
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
};