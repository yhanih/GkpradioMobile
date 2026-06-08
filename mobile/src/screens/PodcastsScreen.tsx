import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { wpClient } from '../lib/wordpress';
import { useTheme, type Theme } from '../contexts/ThemeContext';

export function PodcastsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createPodcastStyles(theme), [theme]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
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
      const { data, error: fetchError } = await wpClient.getPodcasts();

      if (fetchError) throw new Error(fetchError);
      if (data) setPodcasts(data);
    } catch (err: any) {
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

  const renderPodcastItem = useCallback(({ item: podcast }: { item: any }) => (
    <Pressable style={[styles.podcastCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Image
        source={{
          uri: podcast.thumbnail_url || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
        }}
        style={styles.podcastImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.podcastInfo}>
        <Text style={[styles.podcastTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {podcast.title.rendered}
        </Text>
        <View style={styles.podcastMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color={theme.colors.textMuted} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>Podcast</Text>
          </View>
        </View>
      </View>
    </Pressable>
  ), [theme, styles]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Podcasts</Text>
      <Text style={styles.subtitle}>
        Stream sermons, teachings, and conversations
      </Text>
    </View>
  ), [styles]);

  const renderEmpty = useCallback(() => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchPodcasts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading podcasts...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="mic-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No podcasts available</Text>
        <Text style={styles.emptyStateText}>
          Check back soon for new episodes
        </Text>
      </View>
    );
  }, [error, loading, theme, styles]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <FlatList
        data={error ? [] : podcasts}
        renderItem={renderPodcastItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={<View style={{ height: 120 }} />}
        windowSize={5}
        maxToRenderPerBatch={8}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

function createPodcastStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
    },
    header: {
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
    podcastCard: {
      flexDirection: 'row',
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
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
      color: theme.colors.text,
      marginBottom: 4,
    },
    podcastHosts: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    podcastDescription: {
      fontSize: 13,
      color: theme.colors.textMuted,
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
      color: theme.colors.textMuted,
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
