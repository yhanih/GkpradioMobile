import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: {
    title: string;
    artist: string;
    isLive: boolean;
  } | null;
  play: () => void;
  pause: () => void;
  playLiveStream: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  error: string | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTrack, setCurrentTrack] = useState<AudioContextType['currentTrack']>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ============================================
  // CONFIGURE YOUR AZURACAST STREAM URL HERE
  // ============================================
  // Replace this with your actual Azuracast stream URL
  // Format: https://your-domain.com/radio/8000/radio.mp3
  // 
  // For testing, using a demo stream (SomaFM):
  const AZURACAST_STREAM_URL = 'https://ice1.somafm.com/groovesalad-128-mp3';
  
  // When you have your Azuracast URL, replace above with:
  // const AZURACAST_STREAM_URL = 'https://your-azuracast-domain.com/radio/8000/radio.mp3';

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = 'none';

    // Add event listeners
    const audio = audioRef.current;
    
    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };
    
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      const errorMsg = 'Unable to connect to stream. Please check your stream URL configuration.';
      setError(errorMsg);
      toast.error(errorMsg, {
        description: 'Update your Azuracast URL in /utils/AudioContext.tsx'
      });
    };
    
    const handleCanPlay = () => {
      setError(null);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      if (audio) {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const playLiveStream = () => {
    if (audioRef.current) {
      try {
        // Set the Azuracast stream URL
        audioRef.current.src = AZURACAST_STREAM_URL;
        audioRef.current.load();
        
        setCurrentTrack({
          title: 'GKP Radio Live',
          artist: 'Broadcasting 24/7',
          isLive: true
        });

        toast.success('Connecting to live stream...', {
          description: 'Please wait while we connect'
        });

        audioRef.current.play().catch(err => {
          console.error('Error playing live stream:', err);
          setIsPlaying(false);
          setError('Failed to play stream');
          toast.error('Failed to play stream', {
            description: 'Please try again or check your connection'
          });
        });
      } catch (err) {
        console.error('Error setting up stream:', err);
        setError('Failed to setup stream');
        toast.error('Failed to setup stream', {
          description: 'Please check your stream configuration'
        });
      }
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrack,
        play,
        pause,
        playLiveStream,
        volume,
        setVolume,
        error,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
