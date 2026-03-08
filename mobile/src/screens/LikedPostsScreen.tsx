import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wpClient, WPTestimony } from '../lib/wordpress';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryIcon, getCategoryLabel } from '../constants/categories';

type LikedPostsNavProp = NativeStackNavigationProp<RootStackParamList>;

export function LikedPostsScreen() {
  const navigation = useNavigation<LikedPostsNavProp>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [testimonies, setTestimonies] = useState<WPTestimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLikedPosts = useCallback(async () => {
    if (!user) {
      setError('Please sign in to view your liked posts');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Since we don't have a targeted "get liked" endpoint yet, 
      // we filter from recent testimonies as a placeholder
      const { data, error: fetchError } = await wpClient.getTestimonies(50);

      if (fetchError) throw new Error(fetchError);

      // In a real WP setup with likes, we'd have a specific endpoint.
      // For now, we'll show testimonies where user_has_liked is true if the API supports it,
      // or just show recent ones if we can't filter server-side yet.
      const likedItems = (data || []).filter(item => item.user_has_liked);

      setTestimonies(likedItems);
    } catch (err: any) {
      console.error('Error fetching liked posts:', err);
      setError('Failed to load liked posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLikedPosts();
  }, [fetchLikedPosts]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchLikedPosts();
      }
    }, [fetchLikedPosts, loading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLikedPosts();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const navigateToPost = (testimony: WPTestimony) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: testimony.id, testimony });
  };

  const renderTestimony = (testimony: WPTestimony) => {
    return (
      <Pressable
        key={testimony.id}
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigateToPost(testimony)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color="#71717a" />
            </View>
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>Member</Text>
              <Text style={styles.time}>{formatTimeAgo(testimony.date)}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {testimony.title.rendered}
        </Text>
        <Text style={[styles.cardDescription, { color: theme.colors.textMuted }]} numberOfLines={3}>
          {testimony.content.rendered.replace(/<[^>]*>?/gm, '')}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.engagementStats}>
            <View style={styles.statButton}>
              <Ionicons name="heart" size={18} color="#ef4444" />
              <Text style={[styles.statText, styles.statTextActive]}>
                {testimony.like_count || 0}
              </Text>
            </View>
            <View style={styles.statButton}>
              <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
              <Text style={styles.statText}>{testimony.comment_count || 0}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liked Posts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sign In Required</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            Please sign in to view your liked posts
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liked Posts</Text>
        <View style={{ width: 40 }} />
      </View>

      {error && !loading ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#ef4444'} />
          <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchLikedPosts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading...</Text>
        </View>
      ) : testimonies.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Liked Posts</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            Posts you like will appear here
          </Text>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.getParent()?.navigate('Community');
            }}
          >
            <Text style={styles.exploreButtonText}>Explore Community</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        >
          {testimonies.map(testimony => renderTestimony(testimony))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e4e4e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#71717a',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
  },
  statTextActive: {
    color: '#ef4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

