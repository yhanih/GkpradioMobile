import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }, []);

  const renderVideoItem = useCallback(({ item: video }: { item: any }) => (
    <Pressable style={[styles.videoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{
            uri: video.thumbnail_url || 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
          }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
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
  ), [theme, styles, formatTimeAgo]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Videos</Text>
      <Text style={styles.subtitle}>
        Watch sermons, teachings, and events
      </Text>
    </View>
  ), [styles]);

  const renderEmpty = useCallback(() => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchVideos}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="videocam-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No videos available</Text>
        <Text style={styles.emptyStateText}>
          Check back soon for new content
        </Text>
      </View>
    );
  }, [error, loading, theme, styles]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <FlatList
        data={error ? [] : videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={<View style={{ height: 120 }} />}
        windowSize={5}
        maxToRenderPerBatch={6}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

function createVideoStyles(theme: Theme) {
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
