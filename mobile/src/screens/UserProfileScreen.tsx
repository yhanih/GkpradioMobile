import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { blockCommunityUser, fetchBlockedUserIds, unblockCommunityUser } from '../lib/backend';
import { RootStackParamList } from '../types/navigation';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ReportContentModal } from '../components/ReportContentModal';
import { openUserProfileOverflowMenu } from '../utils/contentOverflowMenu';
import { REPORT_SUBMITTED_ALERT } from '../constants/reportReasons';
import { Avatar } from '../components/ui/avatar';
import { normalizeAvatarSeed } from '../components/ui/avatar/avatarVariants';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen() {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createUserProfileStyles(theme), [theme]);
  const { user: authUser } = useAuth();

  const [userProfile, setUserProfile] = useState<any | null>(route.params.user || null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, testimonies: 0 });
  const [youHaveBlocked, setYouHaveBlocked] = useState(false);
  const [reportProfileOpen, setReportProfileOpen] = useState(false);

  const viewedUserId = String(route.params.userId);
  const showProfileModerationMenu = Boolean(authUser?.id && viewedUserId !== String(authUser.id));

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,avatar_url,avatar_seed,bio,created_at')
        .eq('id', String(route.params.userId))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserProfile({
          id: data.id,
          fullname: data.full_name,
          avatarurl: data.avatar_url,
          avatarseed: normalizeAvatarSeed(data.avatar_seed, data.id),
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
          ? supabase.from('comments').select('post_id').in('post_id', postIds)
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

  const handleProfileOverflow = () => {
    if (!authUser?.id) return;
    openUserProfileOverflowMenu(
      (choice) => {
        if (choice === 'report') setReportProfileOpen(true);
        else handleBlockProfileMember();
      },
      { hideBlock: youHaveBlocked }
    );
  };

  const handleBlockProfileMember = () => {
    if (!authUser?.id) return;
    const blockedId = viewedUserId;
    if (String(authUser.id) === blockedId) return;
    Alert.alert(
      'Block member',
      'You will no longer see posts or comments from this member in the community.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockCommunityUser(authUser.id, blockedId);
              setYouHaveBlocked(true);
              setPosts([]);
              setStats({ posts: 0, testimonies: 0 });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              Alert.alert('Unable to block', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
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

  const renderHeader = (title = 'Member') => (
    <View style={styles.header}>
      <Pressable onPress={() => navigation.goBack()} style={styles.headerIconButton}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {showProfileModerationMenu ? (
        <Pressable
          onPress={handleProfileOverflow}
          style={styles.headerIconButton}
          accessibilityLabel="Profile options"
          hitSlop={10}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.headerIconButton} />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <View style={styles.emptyIconWrap}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.04)']
                  : [theme.colors.primaryLight, theme.colors.surfaceSecondary]
              }
              style={styles.emptyIconGradient}
            >
              <Ionicons name="person-outline" size={28} color={theme.colors.primary} />
            </LinearGradient>
          </View>
          <Text style={styles.errorTitle}>Member not found</Text>
          <Text style={styles.errorText}>This profile may have been removed or is unavailable.</Text>
          <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = userProfile.fullname || 'Community Member';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.profileCard}>
          {isDark ? (
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.16)', 'rgba(16, 185, 129, 0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.profileGlow}
              pointerEvents="none"
            />
          ) : null}

          <View style={styles.avatarRing}>
            <Avatar
              src={userProfile.avatarurl}
              name={displayName}
              userId={userProfile.id}
              avatarSeed={userProfile.avatarseed}
              size="2xl"
              showRing
            />
          </View>

          <Text style={styles.fullName}>{displayName}</Text>

          {userProfile.bio ? (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>Sharing faith through the community</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{stats.testimonies}</Text>
              <Text style={styles.statLabel}>Testimonies</Text>
            </View>
          </View>
        </View>

        {youHaveBlocked ? (
          <View style={styles.blockedCard}>
            <View style={styles.emptyIconWrap}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(239, 68, 68, 0.18)', 'rgba(239, 68, 68, 0.04)']
                    : ['#fee2e2', theme.colors.surfaceSecondary]
                }
                style={styles.emptyIconGradient}
              >
                <Ionicons name="eye-off-outline" size={26} color={theme.colors.error} />
              </LinearGradient>
            </View>
            <Text style={styles.blockedTitle}>You blocked this member</Text>
            <Text style={styles.blockedSubtitle}>
              Their posts are hidden from your feed. You can unblock them anytime.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.unblockButton, pressed && styles.unblockButtonPressed]}
              onPress={handleUnblock}
            >
              <Text style={styles.unblockButtonText}>Unblock member</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.postsWell}>
          <View style={styles.postsHeader}>
            <Text style={styles.postsTitle}>Public testimonies</Text>
            <Text style={styles.postsCount}>{youHaveBlocked ? 0 : posts.length}</Text>
          </View>

          {youHaveBlocked ? (
            <View style={styles.emptyPosts}>
              <View style={styles.emptyIconWrap}>
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
                      : [theme.colors.borderLight, theme.colors.surfaceSecondary]
                  }
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="lock-closed-outline" size={26} color={theme.colors.textMuted} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyPostsTitle}>Posts are hidden</Text>
              <Text style={styles.emptyPostsSubtext}>
                Unblock this member to see their testimonies again.
              </Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <View style={styles.emptyIconWrap}>
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.04)']
                      : [theme.colors.primaryLight, theme.colors.surfaceSecondary]
                  }
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="document-text-outline" size={26} color={theme.colors.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyPostsTitle}>No testimonies yet</Text>
              <Text style={styles.emptyPostsSubtext}>
                When they share, their stories will appear here.
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <Pressable
                key={post.id}
                style={({ pressed }) => [styles.postCard, pressed && styles.postCardPressed]}
                onPress={() => navigateToPost(post)}
              >
                <Text style={styles.postTime}>{formatTimeAgo(post.createdat)}</Text>

                <Text style={styles.postTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.postContent} numberOfLines={2}>
                  {post.content}
                </Text>

                <View style={styles.postEngagementBar}>
                  <View style={styles.postEngagementChip}>
                    <Ionicons name="heart-outline" size={15} color={theme.colors.textMuted} />
                    <Text style={styles.postEngagementLabel}>{post.like_count || 0}</Text>
                  </View>
                  <View style={styles.postEngagementChip}>
                    <Ionicons name="chatbubble-outline" size={15} color={theme.colors.textMuted} />
                    <Text style={styles.postEngagementLabel}>{post.comment_count || 0}</Text>
                  </View>
                  <View style={styles.postEngagementSpacer} />
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 24 + insets.bottom }} />
      </ScrollView>

      <ReportContentModal
        visible={Boolean(authUser && reportProfileOpen)}
        onClose={() => setReportProfileOpen(false)}
        reporterId={authUser?.id ?? ''}
        targetType="user"
        targetId={viewedUserId}
        onSubmitted={() => {
          Alert.alert(REPORT_SUBMITTED_ALERT.title, REPORT_SUBMITTED_ALERT.message);
        }}
      />
    </SafeAreaView>
  );
}

function createUserProfileStyles(theme: Theme) {
  const surfaces = theme.dark
    ? {
        canvas: '#050505',
        profile: '#0E0E11',
        posts: '#0A0A0C',
        postCard: '#141418',
        engagement: 'rgba(255, 255, 255, 0.04)',
        statChip: 'rgba(255, 255, 255, 0.06)',
        input: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '#000000',
      }
    : {
        canvas: theme.colors.background,
        profile: theme.colors.surface,
        posts: theme.colors.surfaceSecondary,
        postCard: theme.colors.surface,
        engagement: theme.colors.borderLight,
        statChip: theme.colors.borderLight,
        input: theme.colors.borderLight,
        border: theme.colors.border,
        shadow: '#18181b',
      };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: surfaces.canvas,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 8,
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
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.3,
      color: theme.colors.text,
      marginTop: 4,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      marginTop: 8,
      marginBottom: 20,
      textAlign: 'center',
      maxWidth: 280,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    profileCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 22,
      borderRadius: 20,
      backgroundColor: surfaces.profile,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
      alignItems: 'center',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: surfaces.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: theme.dark ? 0.35 : 0.08,
          shadowRadius: 16,
        },
        android: { elevation: theme.dark ? 4 : 2 },
      }),
    },
    profileGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 140,
    },
    avatarRing: {
      padding: 3,
      borderRadius: 56,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
      marginBottom: 16,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: surfaces.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullName: {
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: -0.5,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    bio: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
      marginBottom: 20,
    },
    bioPlaceholder: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
      marginBottom: 20,
      fontStyle: 'italic',
      opacity: 0.85,
    },
    statsRow: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'center',
    },
    statChip: {
      minWidth: 120,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: surfaces.statChip,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: theme.colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
    },
    blockedCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderRadius: 20,
      backgroundColor: surfaces.posts,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
      alignItems: 'center',
    },
    blockedTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: theme.colors.text,
      marginTop: 4,
      textAlign: 'center',
    },
    blockedSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
      maxWidth: 280,
    },
    unblockButton: {
      marginTop: 18,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },
    unblockButtonPressed: {
      opacity: 0.88,
    },
    unblockButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    postsWell: {
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 10,
      borderRadius: 20,
      backgroundColor: surfaces.posts,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    postsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    postsTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
    },
    postsCount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    emptyPosts: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 12,
    },
    emptyIconWrap: {
      marginBottom: 14,
    },
    emptyIconGradient: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyPostsTitle: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyPostsSubtext: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
      maxWidth: 260,
      opacity: 0.9,
    },
    postCard: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      marginBottom: 10,
      backgroundColor: surfaces.postCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    postCardPressed: {
      opacity: 0.9,
    },
    postTime: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
      marginBottom: 8,
      alignSelf: 'flex-end',
    },
    postTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.3,
      lineHeight: 23,
      color: theme.colors.text,
      marginBottom: 6,
    },
    postContent: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    postEngagementBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 5,
      borderRadius: 12,
      backgroundColor: surfaces.engagement,
    },
    postEngagementChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    postEngagementLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    postEngagementSpacer: {
      flex: 1,
    },
  });
}
