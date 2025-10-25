import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export default function MiniPlayer() {
  const { isPlaying, isLoading, nowPlaying, togglePlayPause } = useAudioPlayer();

  const currentSong = nowPlaying?.now_playing?.song;
  const currentShow = nowPlaying?.now_playing?.playlist || nowPlaying?.station?.name || 'Live Radio';

  return (
    <LinearGradient
      colors={['#047857', '#059669']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Live Indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          {currentSong ? (
            <>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {currentSong.artist || currentShow}
              </Text>
            </>
          ) : (
            <Text style={styles.songTitle} numberOfLines={2}>
              {currentShow}
            </Text>
          )}
        </View>

        {/* Play/Pause Button */}
        <Pressable
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#fff"
            />
          )}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 4,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
