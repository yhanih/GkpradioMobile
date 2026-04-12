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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { fetchBlockedUserIds, unblockCommunityUser } from '../lib/backend';
import { RootStackParamList } from '../types/navigation';
import { getCategoryIcon, getCategoryLabel } from '../constants/categories';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen() {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { theme } = useTheme();
  const { user: authUser } = useAuth();

  const [userProfile, setUserProfile] = useState<any | null>(route.params.user || null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, testimonies: 0 });
  const [youHaveBlocked, setYouHaveBlocked] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,avatar_url,bio,created_at')
        .eq('id', String(route.params.userId))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserProfile({
          id: data.id,
          fullname: data.full_name,
          avatarurl: data.avatar_url,
          bio: data.bio,
          created_at: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [route.params.userId]);

  const fetchUserPosts = useCallback(async () => {
    try {
      const userId = String(route.params.userId);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      const rows = postsData || [];
      const postIds = rows.map((p: any) => p.id);

      const [reactionsRes, commentsRes] = await Promise.all([
        postIds.length
          ? supabase
              .from('post_reactions')
              .select('post_id,reaction_type')
              .in('post_id', postIds)
          : Promise.resolve({ data: [], error: null } as any),
        postIds.length
          ? supabase
              .from('comments')
              .select('post_id')
              .in('post_id', postIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (reactionsRes.error) throw reactionsRes.error;
      if (commentsRes.error) throw commentsRes.error;

      const likeCounts = new Map<string, number>();
      (reactionsRes.data || []).forEach((r: any) => {
        if (r.reaction_type !== 'like') return;
        likeCounts.set(r.post_id, (likeCounts.get(r.post_id) || 0) + 1);
      });

      const commentCounts = new Map<string, number>();
      (commentsRes.data || []).forEach((c: any) => {
        commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1);
      });

      const mapped = rows.map((p: any) => ({
        id: String(p.id),
        title: String(p.title || ''),
        content: String(p.content || ''),
        category: String(p.category || ''),
        post_type: p.post_type || null,
        createdat: p.created_at,
        userid: String(p.author_id),
        is_anonymous: Boolean(p.is_anonymous),
        ispinned: Boolean(p.is_pinned),
        like_count: likeCounts.get(p.id) || 0,
        prayer_count: 0,
        comment_count: commentCounts.get(p.id) || 0,
      }));

      setPosts(mapped);
      setStats({
        posts: mapped.length,
        testimonies: mapped.length,
      });
    } catch (error) {
      console.error('Error fetching user testimonies:', error);
    }
  }, [route.params.userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    const viewedId = String(route.params.userId);
    if (authUser?.id && viewedId !== String(authUser.id)) {
      const blocked = await fetchBlockedUserIds(authUser.id);
      if (blocked.includes(viewedId)) {
        setYouHaveBlocked(true);
        setPosts([]);
        setStats({ posts: 0, testimonies: 0 });
      } else {
        setYouHaveBlocked(false);
      }
    } else {
      setYouHaveBlocked(false);
    }
    setLoading(false);
  }, [fetchUserProfile, fetchUserPosts, authUser?.id, route.params.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    const viewedId = String(route.params.userId);
    if (authUser?.id && viewedId !== String(authUser.id)) {
      const blocked = await fetchBlockedUserIds(authUser.id);
      if (blocked.includes(viewedId)) {
        setYouHaveBlocked(true);
        setPosts([]);
        setStats({ posts: 0, testimonies: 0 });
      } else {
        setYouHaveBlocked(false);
      }
    } else {
      setYouHaveBlocked(false);
    }
    setRefreshing(false);
  };

  const handleUnblock = async () => {
    if (!authUser?.id) return;
    const viewedId = String(route.params.userId);
    try {
      await unblockCommunityUser(authUser.id, viewedId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setYouHaveBlocked(false);
      await fetchUserPosts();
    } catch (e) {
      console.error('Unblock failed:', e);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const navigateToPost = (post: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: post.id, thread: post });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color={theme.colors.textMuted} />
          <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>User not found</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = userProfile.avatarurl;
  const displayName = userProfile.fullname || 'Community Member';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.profileHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Ionicons name="person" size={40} color={theme.colors.textMuted} />
            </View>
          )}
          
          <Text style={[styles.fullName, { color: theme.colors.text }]}>
            {displayName}
          </Text>
          
          <Text style={[styles.username, { color: theme.colors.textMuted }]}>@{String(userProfile.id).slice(0, 8)}</Text>
          
          {userProfile.bio && (
            <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{userProfile.bio}</Text>
          )}
        </View>

        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.testimonies}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Testimonies</Text>
          </View>
        </View>

        {youHaveBlocked ? (
          <View style={[styles.blockedBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="eye-off-outline" size={28} color={theme.colors.textMuted} />
            <Text style={[styles.blockedTitle, { color: theme.colors.text }]}>You blocked this member</Text>
            <Text style={[styles.blockedSubtitle, { color: theme.colors.textMuted }]}>
              Their posts are hidden from your community feed. You can unblock them anytime.
            </Text>
            <Pressable
              style={[styles.unblockButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleUnblock}
            >
              <Text style={styles.unblockButtonText}>Unblock</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.postsSection}>
          <Text style={[styles.postsTitle, { color: theme.colors.text }]}>Public Testimonies</Text>
          
          {youHaveBlocked ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="lock-closed-outline" size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyPostsText, { color: theme.colors.textMuted }]}>
                Posts are hidden while this member is blocked
              </Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyPostsText, { color: theme.colors.textMuted }]}>No public testimonies yet</Text>
            </View>
          ) : (
            posts.map(post => (
              <Pressable
                key={post.id}
                style={[styles.postCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigateToPost(post)}
              >
                <View style={styles.postHeader}>
                  <Text style={[styles.postTime, { color: theme.colors.textMuted }]}>{formatTimeAgo(post.createdat)}</Text>
                </View>
                
                <Text style={[styles.postTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={[styles.postContent, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {post.content}
                </Text>
                
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.postStatText, { color: theme.colors.textMuted }]}>{post.like_count || 0}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.postStatText, { color: theme.colors.textMuted }]}>{post.comment_count || 0}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    marginBottom: 4,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPostsText: {
    fontSize: 15,
    marginTop: 12,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  postTime: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 13,
  },
  blockedBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  blockedTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  blockedSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  unblockButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
