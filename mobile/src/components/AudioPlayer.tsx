import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { fetchNowPlaying, NowPlayingData } from '../lib/azuracast';

export function AudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    fetchNowPlayingData();

    // Poll for now-playing data every 10 seconds
    const interval = setInterval(fetchNowPlayingData, 10000);

    // Cleanup on unmount
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

  const loadAndPlaySound = async () => {
    try {
      if (!streamUrl) {
        Alert.alert('Error', 'Stream URL not available. Please try again in a moment.');
        return;
      }

      setIsLoading(true);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      if (soundRef.current) {
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
      console.error('Error loading sound:', error);
      Alert.alert(
        'Playback Error',
        'Could not connect to the radio stream. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      if (status.error) {
        console.error('Playback error:', status.error);
        Alert.alert('Playback Error', 'An error occurred during playback.');
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) {
        await loadAndPlaySound();
      } else {
        const status = await soundRef.current.getStatusAsync();
        
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        } else {
          await loadAndPlaySound();
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Error', 'Could not control playback. Please try again.');
    }
  };

  const handleSkipBack = async () => {
    console.log('Skip back not available for live stream');
  };

  const handleSkipForward = async () => {
    console.log('Skip forward not available for live stream');
  };

  const currentSong = nowPlaying?.now_playing?.song;
  const hasAlbumArt = currentSong?.art && currentSong.art !== '';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.trackInfo}>
          {hasAlbumArt ? (
            <Image 
              source={{ uri: currentSong.art }} 
              style={styles.albumArtImage}
              defaultSource={require('../../assets/icon.png')}
            />
          ) : (
            <LinearGradient
              colors={['rgba(4, 120, 87, 0.2)', 'rgba(5, 150, 105, 0.2)']}
              style={styles.albumArtContainer}
            >
              <LinearGradient
                colors={['#047857', '#059669']}
                style={styles.albumArt}
              >
                <Ionicons 
                  name={isPlaying ? 'radio' : 'radio-outline'} 
                  size={20} 
                  color="#fff" 
                />
              </LinearGradient>
            </LinearGradient>
          )}

          <View style={styles.details}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentSong?.title || (isPlaying ? 'Live Radio Stream' : nowPlaying?.station?.name || 'Kingdom Principles Radio')}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentSong?.artist || (isPlaying ? 'Broadcasting Live' : 'Tap to listen')}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={styles.controlButton}
            onPress={() => setIsLiked(!isLiked)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#047857' : '#71717a'}
            />
          </Pressable>

          <Pressable style={styles.controlButton} onPress={handleSkipBack}>
            <Ionicons name="play-skip-back" size={18} color="#71717a" />
          </Pressable>

          <Pressable
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#047857', '#059669']}
              style={styles.playButtonGradient}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={18} color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color="#fff"
                />
              )}
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.controlButton} onPress={handleSkipForward}>
            <Ionicons name="play-skip-forward" size={18} color="#71717a" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(228, 228, 231, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  albumArtContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  details: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#09090b',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    color: '#71717a',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
