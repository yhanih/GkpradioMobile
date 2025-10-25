import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { getStreamUrl, fetchNowPlaying, NowPlayingData } from '../lib/azuracast';

interface AudioPlayerContextType {
  isPlaying: boolean;
  isLoading: boolean;
  nowPlaying: NowPlayingData | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    configureAudio();
    fetchNowPlayingData();
    
    const interval = setInterval(fetchNowPlayingData, 15000);
    
    return () => {
      clearInterval(interval);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error configuring audio:', error);
    }
  };

  const fetchNowPlayingData = async () => {
    try {
      const data = await fetchNowPlaying();
      setNowPlaying(data);
    } catch (error) {
      console.error('Error fetching now playing:', error);
    }
  };

  const play = async () => {
    try {
      setIsLoading(true);

      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          setIsLoading(false);
          return;
        }
      }

      const streamUrl = getStreamUrl();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = newSound;
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
        setIsPlaying(false);
        setIsLoading(false);
      }
    } else {
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        isLoading,
        nowPlaying,
        play,
        pause,
        togglePlayPause,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
