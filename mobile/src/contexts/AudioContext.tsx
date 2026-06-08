import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { Alert } from 'react-native';
import { fetchRadioStatusFromAzuraCast } from '../lib/backend';
import { resolveRadioTrackArtist, resolveRadioTrackTitle } from '../lib/radioNowPlaying';
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

const IS_EXPO_GO = isExpoGoClient();

async function configureNativeAmbientSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
  });
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
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
    if (!IS_EXPO_GO || expoGoWarnedRef.current) return;
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

  const syncLockScreen = useCallback((source: LockScreenSource, playing: boolean) => {
    if (IS_EXPO_GO) return;
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

      const songTitle = resolveRadioTrackTitle(
        data.now_playing
          ? {
              title: data.now_playing.title,
              text: data.now_playing.text,
              artist: data.now_playing.artist,
            }
          : null,
        data.current_show || 'GKP Radio Live',
      );
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

      const current = nowPlayingRef.current;
      const isChanged =
        !current ||
        current.is_live !== next.is_live ||
        current.station?.listen_url !== next.station?.listen_url ||
        current.now_playing?.song?.title !== next.now_playing?.song?.title ||
        current.now_playing?.song?.artist !== next.now_playing?.song?.artist ||
        current.now_playing?.song?.art !== next.now_playing?.song?.art;

      if (isChanged) {
        nowPlayingRef.current = next;
        setNowPlaying(next);
      }

      if (data.stream_url) {
        streamUrlRef.current = data.stream_url;
      }

      if (!IS_EXPO_GO && activeSourceRef.current === 'radio' && playerRef.current?.playing) {
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

    if (IS_EXPO_GO) {
      warnExpoGoBackground();
      return () => clearInterval(interval);
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

      await playRadioNative(url);
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
    if (playerRef.current) {
      playerRef.current.pause();
      deactivateLockScreenControls(playerRef.current);
    }
    setIsPlaying(false);
  };

  const resume = async () => {
    try {
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
    } else if (playerRef.current?.isLoaded) {
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
        if (playerRef.current) {
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
