import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../contexts/AudioContext';
import { UNRECOGNIZED_RADIO_ARTIST } from '../lib/radioNowPlaying';
import { RadioExpandedSheet } from './RadioExpandedSheet';
import { useResponsive } from '../utils/responsive';

export function AudioPlayer() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(88, 60 + insets.bottom);
  const { floatingMaxWidth } = useResponsive();
  const { isPlaying, isLoading, nowPlaying, togglePlayback } = useAudio();
  const [isLiked, setIsLiked] = React.useState(false);
  const [expanded, setExpanded] = useState(false);

  const currentSong = nowPlaying?.now_playing?.song;
  const hasAlbumArt = currentSong?.art && currentSong.art !== '';

  return (
    <>
    <View style={[styles.outerShell, { bottom: bottomOffset }]}>
      <View style={[styles.outerInner, { maxWidth: floatingMaxWidth }]}>
      <BlurView intensity={80} tint="light" style={styles.container}>
        <View style={styles.content}>
          <Pressable
            style={styles.trackInfoPressable}
            onPress={() => {
              Haptics.selectionAsync();
              setExpanded(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open now playing and live chat"
          >
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
                  {currentSong?.artist || (isPlaying ? UNRECOGNIZED_RADIO_ARTIST : 'Tap to listen')}
                </Text>
              </View>
            </View>
          </Pressable>

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
                  <Text style={styles.playButtonLabel}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </BlurView>
      </View>
    </View>
    <RadioExpandedSheet visible={expanded} onClose={() => setExpanded(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  outerShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  outerInner: {
    width: '100%',
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
  trackInfoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
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
    minWidth: 64,
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
    paddingHorizontal: 14,
  },
  playButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
