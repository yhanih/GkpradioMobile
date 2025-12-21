import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Alert } from 'react-native';
import { fetchNowPlaying, NowPlayingData } from '../lib/azuracast';

interface AudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    nowPlaying: NowPlayingData | null;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    togglePlayback: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [streamUrl, setStreamUrl] = useState<string>('');

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

    const togglePlayback = async () => {
        if (isPlaying) {
            await pause();
        } else {
            await play();
        }
    };

    return (
        <AudioContext.Provider value={{ isPlaying, isLoading, nowPlaying, play, pause, togglePlayback }}>
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
