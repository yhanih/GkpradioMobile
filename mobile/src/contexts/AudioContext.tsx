import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { Alert } from 'react-native';
import { fetchRadioStatusFromAzuraCast } from '../lib/backend';
import { resolveRadioTrackArtist } from '../lib/radioNowPlaying';
import { isExpoGoClient } from '../lib/isExpoGoClient';
import {
  activateLockScreenControls,
  buildLockScreenMetadata,
  deactivateLockScreenControls,
  supportsLockScreenControls,
  type LockScreenSource,
} from '../lib/audioLockScreen';

export interface Episode {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  thumbnail_url?: string;
  audio_url?: string;
}

export interface NowPlayingData {
  station: { listen_url: string; name: string };
  now_playing: { song: { title: string; artist: string; art?: string } };
  is_live: boolean;
}

interface AudioContextType {
  isPlaying: boolean;
  isLoading: boolean;
  nowPlaying: NowPlayingData | null;
  currentEpisode: Episode | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  playEpisode: (episode: Episode) => Promise<void>;
  clearEpisode: () => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  getCurrentPosition: () => Promise<number | null>;
  pauseForVideoSession: () => Promise<void>;
  resumeAfterVideoSession: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const USE_EXPO_GO_AV = isExpoGoClient();

async function configureNativeAmbientSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
  });
}

async function configureExpoAvSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const streamUrlRef = useRef('');
  const activeSourceRef = useRef<LockScreenSource | null>(null);
  const statusRef = useRef<AudioStatus | null>(null);
  const nowPlayingRef = useRef<NowPlayingData | null>(null);
  const currentEpisodeRef = useRef<Episode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  const wasPlayingBeforeVideoRef = useRef(false);
  const pausedForVideoRef = useRef(false);
  const lockScreenWarnedRef = useRef(false);
  const expoGoWarnedRef = useRef(false);

  const warnExpoGoBackground = useCallback(() => {
    if (!USE_EXPO_GO_AV || expoGoWarnedRef.current) return;
    expoGoWarnedRef.current = true;
    console.warn(
      '[Audio] Background listening is not available in Expo Go. Install a development build: npx expo run:ios',
    );
  }, []);

  const getNativePlayer = useCallback((): AudioPlayer => {
    if (!playerRef.current) {
      playerRef.current = createAudioPlayer(null, {
        updateInterval: 500,
        keepAudioSessionActive: true,
      });
    }
    return playerRef.current;
  }, []);

  const onAvPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    } else if ('error' in status && status.error) {
      console.error('Playback error:', status.error);
      setIsPlaying(false);
    }
  }, []);

  const syncLockScreen = useCallback((source: LockScreenSource, playing: boolean) => {
    if (USE_EXPO_GO_AV) return;
    const player = playerRef.current;
    if (!player || !playing) return;

    if (__DEV__ && !supportsLockScreenControls(player) && !lockScreenWarnedRef.current) {
      lockScreenWarnedRef.current = true;
      console.warn('[Audio] Lock screen controls unavailable on this build.');
    }

    activateLockScreenControls(
      player,
      buildLockScreenMetadata(
        nowPlayingRef.current,
        source === 'episode' ? currentEpisodeRef.current?.title?.rendered : null,
        source === 'episode' ? currentEpisodeRef.current?.thumbnail_url : null,
      ),
      source,
    );
  }, []);

  const fetchNowPlayingData = useCallback(async () => {
    try {
      const data = await fetchRadioStatusFromAzuraCast();
      if (!data) return;

      const songTitle = data.now_playing?.title || data.current_show || 'GKP Radio Live';
      const songArtist = resolveRadioTrackArtist(data.now_playing?.artist);

      const next: NowPlayingData = {
        station: { listen_url: data.stream_url, name: 'GKP Radio' },
        now_playing: {
          song: {
            title: songTitle,
            artist: songArtist,
            art: data.now_playing?.art,
          },
        },
        is_live: data.is_live,
      };

      nowPlayingRef.current = next;
      setNowPlaying(next);

      if (data.stream_url) {
        streamUrlRef.current = data.stream_url;
      }

      if (!USE_EXPO_GO_AV && activeSourceRef.current === 'radio' && playerRef.current?.playing) {
        syncLockScreen('radio', true);
      }
    } catch (error) {
      console.error('Error fetching now playing:', error);
    }
  }, [syncLockScreen]);

  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  useEffect(() => {
    currentEpisodeRef.current = currentEpisode;
  }, [currentEpisode]);

  useEffect(() => {
    void fetchNowPlayingData();
    const interval = setInterval(() => void fetchNowPlayingData(), 10000);

    if (USE_EXPO_GO_AV) {
      warnExpoGoBackground();
      return () => {
        clearInterval(interval);
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      };
    }

    void configureNativeAmbientSession();
    const player = getNativePlayer();
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      statusRef.current = status;
      setIsPlaying(status.playing);
      if (status.isLoaded) {
        setIsLoading(status.isBuffering);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      if (playerRef.current) {
        deactivateLockScreenControls(playerRef.current);
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, [fetchNowPlayingData, getNativePlayer, warnExpoGoBackground]);

  const playRadioExpoAv = async (url: string) => {
    await configureExpoAvSession();

    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && activeSourceRef.current === 'radio') {
        await soundRef.current.playAsync();
        setCurrentEpisode(null);
        currentEpisodeRef.current = null;
        setIsPlaying(true);
        return;
      }
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true },
      onAvPlaybackStatusUpdate,
    );
    soundRef.current = sound;
    activeSourceRef.current = 'radio';
    setCurrentEpisode(null);
    currentEpisodeRef.current = null;
    setIsPlaying(true);
  };

  const playRadioNative = async (url: string) => {
    await configureNativeAmbientSession();
    const player = getNativePlayer();

    if (activeSourceRef.current === 'radio' && player.isLoaded) {
      player.play();
      setCurrentEpisode(null);
      currentEpisodeRef.current = null;
      syncLockScreen('radio', true);
      return;
    }

    player.replace({ uri: url });
    activeSourceRef.current = 'radio';
    setCurrentEpisode(null);
    currentEpisodeRef.current = null;
    player.play();
    syncLockScreen('radio', true);
  };

  const play = async () => {
    try {
      setIsLoading(true);
      warnExpoGoBackground();

      let url = streamUrlRef.current;
      if (!url) {
        await fetchNowPlayingData();
        url = streamUrlRef.current;
      }

      if (!url) {
        Alert.alert(
          'Connection Error',
          'Could not fetch the radio stream URL. Please check your connection and try again.',
        );
        return;
      }

      if (USE_EXPO_GO_AV) {
        await playRadioExpoAv(url);
      } else {
        await playRadioNative(url);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error playing sound:', error);
      Alert.alert(
        'Playback Error',
        `Could not connect to the radio stream. (${message})`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    if (USE_EXPO_GO_AV) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
    } else if (playerRef.current) {
      playerRef.current.pause();
      deactivateLockScreenControls(playerRef.current);
    }
    setIsPlaying(false);
  };

  const resume = async () => {
    try {
      if (USE_EXPO_GO_AV) {
        await configureExpoAvSession();
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        }
        return;
      }

      await configureNativeAmbientSession();
      if (playerRef.current?.isLoaded) {
        playerRef.current.play();
        syncLockScreen(activeSourceRef.current || 'radio', true);
      }
    } catch (error) {
      console.error('Error resuming:', error);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await pause();
    } else if (USE_EXPO_GO_AV ? soundRef.current : playerRef.current?.isLoaded) {
      await resume();
    } else {
      await play();
    }
  };

  const playEpisode = async (episode: Episode) => {
    try {
      if (!episode.audio_url) {
        Alert.alert('Error', 'Audio not available for this episode.');
        return;
      }

      setIsLoading(true);
      setCurrentEpisode(episode);
      currentEpisodeRef.current = episode;
      warnExpoGoBackground();

      if (USE_EXPO_GO_AV) {
        await configureExpoAvSession();
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: episode.audio_url },
          { shouldPlay: true },
          onAvPlaybackStatusUpdate,
        );
        soundRef.current = sound;
        activeSourceRef.current = 'episode';
        setIsPlaying(true);
        return;
      }

      await configureNativeAmbientSession();
      const player = getNativePlayer();
      player.replace({ uri: episode.audio_url });
      activeSourceRef.current = 'episode';
      player.play();
      syncLockScreen('episode', true);
    } catch (error) {
      console.error('Error playing episode:', error);
      Alert.alert('Playback Error', 'Could not play this episode.');
      setCurrentEpisode(null);
      currentEpisodeRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearEpisode = async () => {
    try {
      if (activeSourceRef.current === 'episode') {
        if (USE_EXPO_GO_AV && soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        } else if (playerRef.current) {
          playerRef.current.pause();
          deactivateLockScreenControls(playerRef.current);
        }
        activeSourceRef.current = null;
      }
      setCurrentEpisode(null);
      currentEpisodeRef.current = null;
      setIsPlaying(false);
    } catch (error) {
      console.error('Error clearing episode:', error);
    }
  };

  const getCurrentPosition = async (): Promise<number | null> => {
    if (USE_EXPO_GO_AV) {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          return status.positionMillis / 1000;
        }
      }
      return null;
    }

    const status = statusRef.current;
    if (status?.isLoaded) {
      return status.currentTime;
    }
    if (playerRef.current?.isLoaded) {
      return playerRef.current.currentTime;
    }
    return null;
  };

  const skipForward = async (seconds: number = 30) => {
    try {
      if (activeSourceRef.current !== 'episode') return;

      if (USE_EXPO_GO_AV && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const duration = status.durationMillis || 0;
          const newPosition = Math.min(status.positionMillis + seconds * 1000, duration);
          await soundRef.current.setPositionAsync(newPosition);
        }
        return;
      }

      const player = playerRef.current;
      const avStatus = statusRef.current;
      if (!player || !avStatus?.isLoaded) return;
      const duration = avStatus.duration || player.duration || 0;
      const next = Math.min(avStatus.currentTime + seconds, duration || avStatus.currentTime + seconds);
      await player.seekTo(next);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = async (seconds: number = 15) => {
    try {
      if (activeSourceRef.current !== 'episode') return;

      if (USE_EXPO_GO_AV && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.max(status.positionMillis - seconds * 1000, 0);
          await soundRef.current.setPositionAsync(newPosition);
        }
        return;
      }

      const player = playerRef.current;
      const avStatus = statusRef.current;
      if (!player || !avStatus?.isLoaded) return;
      const next = Math.max(avStatus.currentTime - seconds, 0);
      await player.seekTo(next);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const pauseForVideoSession = async () => {
    try {
      pausedForVideoRef.current = true;
      wasPlayingBeforeVideoRef.current = isPlaying;
      if (isPlaying) {
        await pause();
      }
    } catch (error) {
      console.error('Error pausing for video session:', error);
    }
  };

  const resumeAfterVideoSession = async () => {
    try {
      if (!pausedForVideoRef.current) return;
      const shouldResume = wasPlayingBeforeVideoRef.current;
      pausedForVideoRef.current = false;
      wasPlayingBeforeVideoRef.current = false;
      if (!shouldResume) return;
      await resume();
    } catch (error) {
      console.error('Error resuming after video session:', error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isLoading,
        nowPlaying,
        currentEpisode,
        play,
        pause,
        resume,
        togglePlayback,
        playEpisode,
        clearEpisode,
        skipForward,
        skipBackward,
        getCurrentPosition,
        pauseForVideoSession,
        resumeAfterVideoSession,
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
