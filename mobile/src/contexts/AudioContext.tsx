import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Alert } from 'react-native';
import { fetchNowPlaying, NowPlayingData } from '../lib/azuracast';
import { Episode } from '../types/database.types';

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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [streamUrl, setStreamUrl] = useState<string>('');
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

    useEffect(() => {
        fetchNowPlayingData();
        const interval = setInterval(fetchNowPlayingData, 10000);
        return () => {
            clearInterval(interval);
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const fetchNowPlayingData = async () => {
        try {
            const data = await fetchNowPlaying(1);
            setNowPlaying(data);
            if (data.station && data.station.listen_url) {
                setStreamUrl(data.station.listen_url);
            }
        } catch (error) {
            console.error('Error fetching now playing:', error);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
        } else if ('error' in status && status.error) {
            console.error('Playback error:', status.error);
            setIsPlaying(false);
        }
    };

    const play = async () => {
        try {
            if (!streamUrl) {
                await fetchNowPlayingData();
                return;
            }

            setIsLoading(true);

            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    await soundRef.current.playAsync();
                    return;
                }
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: streamUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
            setIsPlaying(true);
        } catch (error) {
            console.error('Error playing sound:', error);
            Alert.alert('Playback Error', 'Could not connect to the radio stream.');
        } finally {
            setIsLoading(false);
        }
    };

    const pause = async () => {
        if (soundRef.current) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
        }
    };

    const resume = async () => {
        if (soundRef.current) {
            try {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    await soundRef.current.playAsync();
                    setIsPlaying(true);
                }
            } catch (error) {
                console.error('Error resuming:', error);
            }
        }
    };

    const togglePlayback = async () => {
        if (isPlaying) {
            await pause();
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

            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: episode.audio_url },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
            setIsPlaying(true);
        } catch (error) {
            console.error('Error playing episode:', error);
            Alert.alert('Playback Error', 'Could not play this episode.');
            setCurrentEpisode(null);
        } finally {
            setIsLoading(false);
        }
    };

    const clearEpisode = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setCurrentEpisode(null);
            setIsPlaying(false);
        } catch (error) {
            console.error('Error clearing episode:', error);
        }
    };

    const getCurrentPosition = async (): Promise<number | null> => {
        try {
            if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    return status.positionMillis / 1000; // Convert to seconds
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting position:', error);
            return null;
        }
    };

    const skipForward = async (seconds: number = 30) => {
        try {
            if (soundRef.current && currentEpisode) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    const currentPosition = status.positionMillis;
                    const duration = status.durationMillis || 0;
                    const newPosition = Math.min(currentPosition + (seconds * 1000), duration);
                    await soundRef.current.setPositionAsync(newPosition);
                }
            }
        } catch (error) {
            console.error('Error skipping forward:', error);
        }
    };

    const skipBackward = async (seconds: number = 15) => {
        try {
            if (soundRef.current && currentEpisode) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    const currentPosition = status.positionMillis;
                    const newPosition = Math.max(currentPosition - (seconds * 1000), 0);
                    await soundRef.current.setPositionAsync(newPosition);
                }
            }
        } catch (error) {
            console.error('Error skipping backward:', error);
        }
    };

    return (
        <AudioContext.Provider value={{ 
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
            getCurrentPosition
        }}>
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
