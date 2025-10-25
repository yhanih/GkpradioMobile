import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Podcast {
  id: number;
  title: string;
  description: string;
  author: string;
  duration: number;
  thumbnail: string | null;
  category: string | null;
  createdat: string;
}

export default function PodcastsScreen() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setPodcasts(data);
      }
    } catch (err: any) {
      console.error('Error fetching podcasts:', err);
      setError(err.message || 'Failed to load podcasts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPodcasts();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Podcasts</Text>
        <Text style={styles.headerSubtitle}>Faith-filled teachings & discussions</Text>
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
            <Text style={styles.errorTitle}>Unable to load podcasts</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => {
              setLoading(true);
              fetchPodcasts();
            }}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : podcasts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mic-outline" size={48} color="#d4d4d8" />
            <Text style={styles.emptyText}>No podcasts available yet</Text>
          </View>
        ) : (
          <View style={styles.podcastsList}>
            {podcasts.map((podcast) => (
              <Pressable key={podcast.id} style={styles.podcastCard}>
                <View style={styles.thumbnail}>
                  {podcast.thumbnail ? (
                    <Image source={{ uri: podcast.thumbnail }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="mic" size={32} color="#047857" />
                    </View>
                  )}
                </View>
                
                <View style={styles.podcastInfo}>
                  <Text style={styles.podcastTitle} numberOfLines={2}>
                    {podcast.title}
                  </Text>
                  <Text style={styles.podcastAuthor} numberOfLines={1}>
                    {podcast.author}
                  </Text>
                  {podcast.description && (
                    <Text style={styles.podcastDescription} numberOfLines={2}>
                      {podcast.description}
                    </Text>
                  )}
                  
                  <View style={styles.podcastFooter}>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={14} color="#71717a" />
                      <Text style={styles.durationText}>
                        {formatDuration(podcast.duration || 0)}
                      </Text>
                    </View>
                    {podcast.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{podcast.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Pressable style={styles.playButton}>
                  <Ionicons name="play" size={20} color="#047857" />
                </Pressable>
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
  podcastsList: {
    padding: 16,
    gap: 12,
  },
  podcastCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  podcastTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 4,
  },
  podcastDescription: {
    fontSize: 13,
    color: '#71717a',
    lineHeight: 18,
    marginBottom: 8,
  },
  podcastFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#71717a',
  },
  categoryBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
