import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { wpClient } from '../lib/wordpress';
import { useTheme, type Theme } from '../contexts/ThemeContext';

export function VideoScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createVideoStyles(theme), [theme]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await wpClient.getVideos();

      if (fetchError) throw new Error(fetchError);
      if (data) setVideos(data);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError('Unable to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Videos</Text>
          <Text style={styles.subtitle}>
            Watch sermons, teachings, and events
          </Text>
        </View>

        <View style={styles.section}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchVideos}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
          ) : videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No videos available</Text>
              <Text style={styles.emptyStateText}>
                Check back soon for new content
              </Text>
            </View>
          ) : (
            videos.map((video) => (
              <Pressable key={video.id} style={[styles.videoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{
                      uri: video.thumbnail_url || 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
                    }}
                    style={styles.thumbnail}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.thumbnailGradient}
                  />
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={32} color="#fff" />
                  </View>
                </View>

                <View style={styles.videoInfo}>
                  <Text style={[styles.videoTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {video.title.rendered}
                  </Text>
                  <View style={styles.videoMeta}>
                    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{formatTimeAgo(video.date)}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createVideoStyles(theme: Theme) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  section: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  videoCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  channelName: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginHorizontal: 6,
  },
  featuredText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  });
}
