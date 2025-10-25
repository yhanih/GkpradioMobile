import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Video {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  views: number | null;
  likes: number | null;
  thumbnail: string | null;
  category: string | null;
  createdat: string;
}

export default function VideosScreen() {
  const [videos, setVideos] = useState<Video[]>([]);
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
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setVideos(data);
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videos</Text>
        <Text style={styles.headerSubtitle}>Sermons, teachings & worship</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047857" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Unable to load videos</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => {
              setLoading(true);
              fetchVideos();
            }}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={48} color="#d4d4d8" />
            <Text style={styles.emptyText}>No videos available yet</Text>
          </View>
        ) : (
          <View style={styles.videosList}>
            {videos.map((video) => (
              <Pressable key={video.id} style={styles.videoCard}>
                <View style={styles.thumbnailContainer}>
                  {video.thumbnail ? (
                    <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="videocam" size={40} color="#047857" />
                    </View>
                  )}
                  {video.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                    </View>
                  )}
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
                  </View>
                </View>
                
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  {video.description && (
                    <Text style={styles.videoDescription} numberOfLines={2}>
                      {video.description}
                    </Text>
                  )}
                  
                  <View style={styles.videoStats}>
                    {video.views !== null && (
                      <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={14} color="#71717a" />
                        <Text style={styles.statText}>{formatViews(video.views)} views</Text>
                      </View>
                    )}
                    {video.likes !== null && (
                      <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={14} color="#71717a" />
                        <Text style={styles.statText}>{video.likes}</Text>
                      </View>
                    )}
                    {video.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{video.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
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
  videosList: {
    padding: 16,
    gap: 16,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f4f4f5',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 6,
  },
  videoDescription: {
    fontSize: 13,
    color: '#71717a',
    lineHeight: 18,
    marginBottom: 8,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#71717a',
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
});
