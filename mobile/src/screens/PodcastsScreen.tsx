import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Episode } from '../types/database.types';

export function PodcastsScreen() {
  const [podcasts, setPodcasts] = useState<Episode[]>([]);
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
      const { data, error: fetchError } = await supabase
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (data) setPodcasts(data);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
      setError('Unable to load podcasts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPodcasts();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '~30 min';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

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
          <Text style={styles.title}>Podcasts</Text>
          <Text style={styles.subtitle}>
            Stream sermons, teachings, and conversations
          </Text>
        </View>

        <View style={styles.section}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchPodcasts}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.loadingText}>Loading podcasts...</Text>
            </View>
          ) : podcasts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mic-outline" size={48} color="#d4d4d8" />
              <Text style={styles.emptyStateTitle}>No podcasts available</Text>
              <Text style={styles.emptyStateText}>
                Check back soon for new episodes
              </Text>
            </View>
          ) : (
            podcasts.map((podcast) => (
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
                    <Text style={styles.podcastHosts}>{podcast.author}</Text>
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
            ))
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
  podcastHosts: {
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
