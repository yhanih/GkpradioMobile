import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';

export function AudioPlayer() {
  const { isPlaying, isLoading, nowPlaying, togglePlayback } = useAudio();
  const [isLiked, setIsLiked] = React.useState(false);

  const currentSong = nowPlaying?.now_playing?.song;
  const hasAlbumArt = currentSong?.art && currentSong.art !== '';

  return (
    <View style={styles.outerContainer}>
      <BlurView intensity={80} tint="light" style={styles.container}>
        <View style={styles.content}>
          <View style={styles.trackInfo}>
            {hasAlbumArt ? (
              <Image
                source={{ uri: currentSong?.art }}
                style={styles.albumArtImage}
              />
            ) : (
              <View style={styles.albumArtPlaceholder}>
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
              </View>
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
              onPress={() => {
                Haptics.selectionAsync();
                setIsLiked(!isLiked);
              }}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#047857' : '#71717a'}
              />
            </Pressable>

            <Pressable
              style={styles.playButton}
              onPress={togglePlayback}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#047857', '#059669']}
                style={styles.playButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#fff"
                  />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 88, // Above tab bar
    left: 12,
    right: 12,
    zIndex: 100,
  },
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  albumArtPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 120, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  details: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 1,
  },
  trackArtist: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
