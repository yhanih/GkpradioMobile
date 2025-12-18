import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { Podcast, Video } from '../types/database.types';

type TabType = 'podcasts' | 'videos';

export function MediaScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('podcasts');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [podcastsData, videosData] = await Promise.all([
        supabase
          .from('episodes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (podcastsData.error) throw podcastsData.error;
      if (videosData.error) throw videosData.error;

      if (podcastsData.data) setPodcasts(podcastsData.data);
      if (videosData.data) setVideos(videosData.data);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Unable to load media content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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

  const renderPodcast = (podcast: Podcast) => (
    <Pressable key={podcast.id} style={styles.podcastCard}>
      <Image
        source={{
          uri: podcast.thumbnail_url || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
        }}
        style={styles.podcastImage}
      />
      <View style={styles.podcastInfo}>
        <Text style={styles.podcastTitle} numberOfLines={2}>
          {podcast.title}
        </Text>
        {podcast.author && (
          <Text style={styles.podcastAuthor}>{podcast.author}</Text>
        )}
        {podcast.description && (
          <Text style={styles.podcastDescription} numberOfLines={2}>
            {podcast.description}
          </Text>
        )}
        <View style={styles.podcastMeta}>
          {podcast.category && (
            <View style={styles.metaItem}>
              <Ionicons name="folder" size={14} color="#71717a" />
              <Text style={styles.metaText}>{podcast.category}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#71717a" />
            <Text style={styles.metaText}>{formatDuration(podcast.duration)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderVideo = (video: Video) => (
    <Pressable key={video.id} style={styles.videoCard}>
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
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        {video.category && (
          <Text style={styles.channelName}>{video.category}</Text>
        )}
        <View style={styles.videoMeta}>
          <Text style={styles.videoMetaText}>{formatTimeAgo(video.created_at)}</Text>
          {video.is_featured && (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.featuredText}>Featured</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Media</Text>
          <Text style={styles.subtitle}>
            Stream sermons, teachings, and watch videos
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'podcasts' && styles.activeTab]}
            onPress={() => setActiveTab('podcasts')}
          >
            <Ionicons 
              name="mic" 
              size={18} 
              color={activeTab === 'podcasts' ? '#fff' : '#71717a'} 
            />
            <Text style={[styles.tabText, activeTab === 'podcasts' && styles.activeTabText]}>
              Podcasts ({podcasts.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
            onPress={() => setActiveTab('videos')}
          >
            <Ionicons 
              name="videocam" 
              size={18} 
              color={activeTab === 'videos' ? '#fff' : '#71717a'} 
            />
            <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
              Videos ({videos.length})
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.loadingText}>Loading media...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'podcasts' && (
                <>
                  {podcasts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="mic-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No podcasts available</Text>
                      <Text style={styles.emptyStateText}>
                        Check back soon for new episodes
                      </Text>
                    </View>
                  ) : (
                    podcasts.map(renderPodcast)
                  )}
                </>
              )}

              {activeTab === 'videos' && (
                <>
                  {videos.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="videocam-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No videos available</Text>
                      <Text style={styles.emptyStateText}>
                        Check back soon for new content
                      </Text>
                    </View>
                  ) : (
                    videos.map(renderVideo)
                  )}
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#09090b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#71717a',
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#047857',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#71717a',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  podcastCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  podcastImage: {
    width: 120,
    height: 120,
  },
  podcastInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 6,
  },
  podcastDescription: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 8,
  },
  podcastMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#71717a',
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
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
    color: '#09090b',
    marginBottom: 6,
  },
  channelName: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoMetaText: {
    fontSize: 12,
    color: '#71717a',
  },
  metaDot: {
    fontSize: 12,
    color: '#a1a1aa',
    marginHorizontal: 6,
  },
  featuredText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#047857',
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
