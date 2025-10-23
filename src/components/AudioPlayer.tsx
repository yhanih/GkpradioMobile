import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// Get stream URL from environment variables
const STREAM_URL = Constants.expoConfig?.extra?.streamUrl || 
                   process.env.EXPO_PUBLIC_STREAM_URL || 
                   'https://stream.zeno.fm/your-stream-id-here'; // Fallback placeholder

export function AudioPlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Configure audio mode for playback
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

    configureAudio();

    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadAndPlaySound = async () => {
    try {
      setIsLoading(true);

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: STREAM_URL },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
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

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(status.isPlaying);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!sound) {
        // Load and play for the first time
        await loadAndPlaySound();
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Error', 'Could not control playback. Please try again.');
    }
  };

  const handleSkipBack = async () => {
    // For live streams, this would typically restart the stream
    if (sound) {
      try {
        await sound.setPositionAsync(0);
      } catch (error) {
        console.log('Skip back not available for live stream');
      }
    }
  };

  const handleSkipForward = async () => {
    // For live streams, skip forward doesn't apply
    console.log('Skip forward not available for live stream');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.trackInfo}>
          {/* Album Art */}
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

          {/* Track Details */}
          <View style={styles.details}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {isPlaying ? 'Live Radio Stream' : 'Kingdom Principles Radio'}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {isPlaying ? 'Broadcasting Live' : 'Tap to listen'}
            </Text>
          </View>
        </View>

        {/* Controls */}
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
    borderTopColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
