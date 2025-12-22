import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useAuth } from '../contexts/AuthContext';

type EpisodePlayerRouteProp = RouteProp<RootStackParamList, 'EpisodePlayer'>;
type EpisodePlayerNavProp = NativeStackNavigationProp<RootStackParamList, 'EpisodePlayer'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function EpisodePlayerScreen() {
  const navigation = useNavigation<EpisodePlayerNavProp>();
  const route = useRoute<EpisodePlayerRouteProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { playEpisode, isPlaying, isLoading, pause, resume, currentEpisode, skipForward, skipBackward, getCurrentPosition } = useAudio();
  
  const { episode } = route.params;
  const isCurrentEpisode = currentEpisode?.id === episode.id;
  
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(episode.duration || 0);

  useEffect(() => {
    if (episode.audio_url) {
      const shouldAutoPlay = currentEpisode?.id !== episode.id;
      if (shouldAutoPlay) {
        playEpisode(episode);
      }
    }
  }, [episode.id, episode.audio_url]);

  // Update position periodically
  useEffect(() => {
    if (!isCurrentEpisode || !isPlaying) return;

    const interval = setInterval(async () => {
      const position = await getCurrentPosition();
      if (position !== null) {
        setCurrentPosition(position);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCurrentEpisode, isPlaying, getCurrentPosition]);

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCurrentEpisode && isPlaying) {
      pause();
    } else if (isCurrentEpisode) {
      resume();
    } else {
      playEpisode(episode);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleBookmark('episode', episode.id);
  };

  const handleSkipBack = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipBackward(15);
  };

  const handleSkipForward = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipForward(30);
  };

  const handleSpeedChange = () => {
    Haptics.selectionAsync();
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  };

  const handleTimer = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Sleep Timer',
      'Set a timer to stop playback',
      [
        { text: '15 minutes', onPress: () => Alert.alert('Timer Set', 'Playback will stop in 15 minutes') },
        { text: '30 minutes', onPress: () => Alert.alert('Timer Set', 'Playback will stop in 30 minutes') },
        { text: '1 hour', onPress: () => Alert.alert('Timer Set', 'Playback will stop in 1 hour') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: episode.title,
        message: `Check out "${episode.title}" on GKP Radio!${episode.author ? ` by ${episode.author}` : ''}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '~30 min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable 
            style={[styles.headerButton, { backgroundColor: theme.colors.surface }]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
          </Pressable>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Now Playing</Text>
          
          {user && (
            <Pressable 
              style={[styles.headerButton, { backgroundColor: theme.colors.surface }]} 
              onPress={handleBookmark}
            >
              <Ionicons 
                name={isBookmarked('episode', episode.id) ? 'bookmark' : 'bookmark-outline'} 
                size={22} 
                color={isBookmarked('episode', episode.id) ? theme.colors.primary : theme.colors.text} 
              />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.artworkContainer}>
          <View style={[styles.artworkShadow, { shadowColor: theme.colors.primary }]}>
            <Image
              source={{ 
                uri: episode.thumbnail_url || 
                     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600' 
              }}
              style={styles.artwork}
            />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {episode.title}
          </Text>
          
          {episode.author && (
            <Text style={[styles.author, { color: theme.colors.primary }]}>
              {episode.author}
            </Text>
          )}
          
          <View style={styles.metaRow}>
            {episode.category && (
              <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                  {episode.category}
                </Text>
              </View>
            )}
            <Text style={[styles.duration, { color: theme.colors.textMuted }]}>
              {formatDuration(episode.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.colors.primary, 
                    width: duration > 0 ? `${(currentPosition / duration) * 100}%` : '0%' 
                  }
                ]} 
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {formatDuration(currentPosition)}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                {formatDuration(episode.duration)}
              </Text>
            </View>
          </View>

          <View style={styles.mainControls}>
            <Pressable 
              style={styles.secondaryControl}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Previous', 'Go to previous episode');
              }}
            >
              <Ionicons name="play-skip-back" size={28} color={theme.colors.textMuted} />
            </Pressable>
            
            <Pressable 
              style={styles.secondaryControl}
              onPress={handleSkipBack}
            >
              <Ionicons name="play-back" size={24} color={theme.colors.text} />
              <Text style={[styles.skipText, { color: theme.colors.text }]}>15</Text>
            </Pressable>

            <Pressable style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
              <LinearGradient
                colors={[theme.colors.primary, '#059669']}
                style={styles.playButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Ionicons 
                    name={isCurrentEpisode && isPlaying ? 'pause' : 'play'} 
                    size={36} 
                    color="#fff" 
                  />
                )}
              </LinearGradient>
            </Pressable>

            <Pressable 
              style={styles.secondaryControl}
              onPress={handleSkipForward}
            >
              <Ionicons name="play-forward" size={24} color={theme.colors.text} />
              <Text style={[styles.skipText, { color: theme.colors.text }]}>30</Text>
            </Pressable>

            <Pressable 
              style={styles.secondaryControl}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Next', 'Go to next episode');
              }}
            >
              <Ionicons name="play-skip-forward" size={28} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.extraControls}>
            <Pressable 
              style={styles.extraButton}
              onPress={handleSpeedChange}
            >
              <Ionicons name="speedometer-outline" size={22} color={theme.colors.textMuted} />
              <Text style={[styles.extraButtonText, { color: theme.colors.textMuted }]}>{playbackSpeed}x</Text>
            </Pressable>
            
            <Pressable 
              style={styles.extraButton}
              onPress={handleTimer}
            >
              <Ionicons name="timer-outline" size={22} color={theme.colors.textMuted} />
              <Text style={[styles.extraButtonText, { color: theme.colors.textMuted }]}>Timer</Text>
            </Pressable>
            
            <Pressable 
              style={styles.extraButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.textMuted} />
              <Text style={[styles.extraButtonText, { color: theme.colors.textMuted }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        {episode.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: theme.colors.text }]}>
              About this episode
            </Text>
            <Text style={[styles.descriptionText, { color: theme.colors.textMuted }]}>
              {episode.description}
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
              Published {formatDate(episode.created_at)}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  artworkShadow: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 24,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
  },
  controlsContainer: {
    marginBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 32,
  },
  secondaryControl: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  extraButton: {
    alignItems: 'center',
    gap: 4,
  },
  extraButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  descriptionContainer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
  },
});
