import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { fetchNowPlaying } from '../lib/azuracast';
import type { NowPlayingData } from '../lib/azuracast';

interface Episode {
    id: string;
    title: string;
    audio_url: string;
    image_url?: string;
    author_name?: string;
}

interface AudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    nowPlaying: NowPlayingData | null;
    currentEpisode: Episode | null;
    play: () => void;
    pause: () => void;
    togglePlayback: () => void;
    playEpisode: (episode: Episode) => void;
    clearEpisode: () => void;
    skipForward: () => void;
    skipBackward: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchNowPlayingData = useCallback(async () => {
        try {
            const data = await fetchNowPlaying(1);
            setNowPlaying(data);
        } catch (err) {
            console.error('Error fetching now playing:', err);
        }
    }, []);

    useEffect(() => {
        fetchNowPlayingData();
        const interval = setInterval(fetchNowPlayingData, 15000);
        return () => clearInterval(interval);
    }, [fetchNowPlayingData]);

    const play = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        } else if (nowPlaying?.station.listen_url) {
            const audio = new Audio(nowPlaying.station.listen_url);
            audio.addEventListener('playing', () => {
                setIsPlaying(true);
                setIsLoading(false);
            });
            audio.addEventListener('waiting', () => setIsLoading(true));
            audio.addEventListener('error', () => {
                setIsPlaying(false);
                setIsLoading(false);
            });
            audio.play().catch(console.error);
            audioRef.current = audio;
            setIsPlaying(true);
        }
    }, [nowPlaying]);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const togglePlayback = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, pause, play]);

    const playEpisode = useCallback((episode: Episode) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(episode.audio_url);
        audio.addEventListener('playing', () => {
            setIsPlaying(true);
            setIsLoading(false);
        });
        audio.addEventListener('waiting', () => setIsLoading(true));
        audio.play().catch(console.error);

        audioRef.current = audio;
        setCurrentEpisode(episode);
        setIsPlaying(true);
    }, []);

    const skipForward = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, audioRef.current.duration || Infinity);
        }
    }, []);

    const skipBackward = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
        }
    }, []);

    const clearEpisode = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setCurrentEpisode(null);
        setIsPlaying(false);
    }, []);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            isLoading,
            nowPlaying,
            currentEpisode,
            play,
            pause,
            togglePlayback,
            playEpisode,
            clearEpisode,
            skipForward,
            skipBackward
        }}>
            {children}
            {/* Hidden audio element if needed, but we keep it in ref for better control */}
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
