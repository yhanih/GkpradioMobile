import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/ui/avatar';
import {
  blockCommunityUser,
  type CommunityReportTarget,
  CreatePostError,
  deleteCommunityComment,
  deleteCommunityPost,
  createCommentForPost,
  fetchCommentsForPost,
  getPostById,
  togglePostReaction,
} from '../lib/backend';
import { ReportContentModal } from '../components/ReportContentModal';
import { openCommentOverflowMenu, openPostOverflowMenu } from '../utils/contentOverflowMenu';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { PostType, getCategoryIcon, getCategoryLabel, getPostTypeForCategory } from '../constants/categories';
import { REPORT_SUBMITTED_ALERT } from '../constants/reportReasons';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

interface ThreadWithUser {
  id: string;
  title: string;
  content: string;
  createdat: string;
  category: string;
  post_type: PostType | null;
  userid: string;
  is_anonymous: boolean;
  ispinned: boolean;
  like_count: number;
  prayer_count: number;
  comment_count: number;
  user_has_liked?: boolean;
  user_has_prayed?: boolean;
  user_has_bookmarked?: boolean;
  users?: {
    id: string;
    fullname?: string;
    username?: string;
    avatarurl?: string;
    avatarseed?: string | null;
  } | null;
}

interface CommentWithUser {
  id: string;
  threadid: string;
  userid: string;
  content: string;
  createdat: string;
  users?: {
    id: string;
    fullname?: string;
    username?: string;
    avatarurl?: string;
    avatarseed?: string | null;
  } | null;
}

function pulseScale(anim: Animated.Value) {
  Animated.sequence([
    Animated.spring(anim, { toValue: 1.22, useNativeDriver: true, speed: 28, bounciness: 10 }),
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6 }),
  ]).start();
}

export function PostDetailScreen() {
  const navigation = useNavigation<PostDetailNavProp>();
  const route = useRoute<PostDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createPostDetailStyles(theme), [theme]);
  const likeScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const commentInputRef = useRef<TextInput>(null);

  const [thread, setThread] = useState<ThreadWithUser | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetType: CommunityReportTarget;
    targetId: string;
  } | null>(null);
  const submitCommentLockRef = useRef(false);
  const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const dedupeComments = useCallback((items: CommentWithUser[]) => {
    const seen = new Set<string>();
    const ordered: CommentWithUser[] = [];
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      ordered.push(item);
    }
    return ordered;
  }, []);

  const fetchThread = useCallback(async () => {
    try {
      const threadId = String(route.params.threadId);
      const optimistic = route.params.thread;
      if (optimistic && String(optimistic.id) === threadId) {
        const t = optimistic;
        setThread({
          id: String(t.id),
          title: t.title,
          content: t.content,
          createdat: t.createdat,
          category: t.category,
          post_type: t.post_type || getPostTypeForCategory(t.category),
          userid: t.userid,
          is_anonymous: t.is_anonymous,
          ispinned: t.ispinned,
          like_count: t.like_count,
          prayer_count: t.prayer_count || 0,
          comment_count: t.comment_count,
          user_has_liked: t.user_has_liked,
          user_has_prayed: t.user_has_prayed || false,
          users: t.users,
        } as ThreadWithUser);
      }

      const found = await getPostById(threadId, user?.id);
      if (found) {
        setThread(found as ThreadWithUser);
      } else {
        setThread(null);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  }, [route.params.threadId, route.params.thread, user?.id]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await fetchCommentsForPost(String(route.params.threadId), user?.id);
      setComments(dedupeComments(data as CommentWithUser[]));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [route.params.threadId, dedupeComments, user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchThread(), fetchComments()]);
    setLoading(false);
  }, [fetchThread, fetchComments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (route.params?.focusReply) {
      const timer = setTimeout(() => {
        commentInputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params?.focusReply]);

  useEffect(() => {
    const queueCommentsRefresh = () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      realtimeDebounceRef.current = setTimeout(() => {
        fetchComments();
      }, 300);
    };

    const channel = supabase
      .channel(`post-comments-${route.params.threadId}-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${route.params.threadId}` },
        queueCommentsRefresh
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [route.params.threadId, fetchComments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchThread(), fetchComments()]);
    setRefreshing(false);
  };

  const promptSignIn = useCallback((message: string) => {
    Alert.alert('Sign In Required', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign in', onPress: () => navigation.navigate('Login', { redirectBack: true }) },
    ]);
  }, [navigation]);

  const handleLike = async () => {
    if (!user) {
      promptSignIn('Please sign in to like posts.');
      return;
    }
    if (!thread) return;

    const currentlyLiked = thread.user_has_liked;
    const currentCount = thread.like_count ?? 0;
    const newCount = currentlyLiked ? Math.max(currentCount - 1, 0) : currentCount + 1;
    
    setThread(prev => prev ? {
      ...prev,
      user_has_liked: !currentlyLiked,
      like_count: newCount
    } : null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulseScale(likeScale);

    try {
      await togglePostReaction(thread.id, user.id, 'like');
    } catch (error: any) {
      console.error('Error toggling like:', error);
      // Rollback
      setThread(prev => prev ? {
        ...prev,
        user_has_liked: currentlyLiked,
        like_count: currentCount
      } : null);
    }
  };

  const handlePray = async () => {
    if (!user) {
      promptSignIn('Please sign in to pray with the community.');
      return;
    }
    if (!thread) return;

    const currentlyPrayed = thread.user_has_prayed;
    const currentCount = thread.prayer_count ?? 0;
    const newCount = currentlyPrayed ? Math.max(currentCount - 1, 0) : currentCount + 1;

    setThread(prev => prev ? {
      ...prev,
      user_has_prayed: !currentlyPrayed,
      prayer_count: newCount
    } : null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulseScale(likeScale);

    try {
      await togglePostReaction(thread.id, user.id, 'pray');
    } catch (error: any) {
      console.error('Error toggling prayer reaction:', error);
      setThread(prev => prev ? {
        ...prev,
        user_has_prayed: currentlyPrayed,
        prayer_count: currentCount
      } : null);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      promptSignIn('Please sign in to save posts.');
      return;
    }
    if (!thread) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulseScale(bookmarkScale);

    try {
      await toggleBookmark('thread', thread.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Unable to save post. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!thread) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await Share.share({
        message: `${thread.title}\n\n${thread.content}\n\nShared from GKP Radio Community`,
        title: thread.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!user) {
      promptSignIn('Please sign in to delete posts.');
      return;
    }
    if (!thread) return;
    if (user.id !== thread.userid) {
      Alert.alert('Not Allowed', 'You can only delete your own posts.');
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityPost(thread.id, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Unable to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitComment = async () => {
    if (submittingComment || submitCommentLockRef.current) return;

    if (!user) {
      promptSignIn('Please sign in to comment.');
      return;
    }
    if (!thread || !newComment.trim()) return;

    const trimmedComment = newComment.trim();
    const optimisticCommentId = `temp-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticComment: CommentWithUser = {
      id: optimisticCommentId,
      threadid: thread.id,
      userid: user.id,
      content: trimmedComment,
      createdat: new Date().toISOString(),
      users: {
        id: user.id,
        fullname: user.fullname || user.email?.split('@')[0] || 'You',
        avatarurl: user.avatarurl || null,
      },
    };

    submitCommentLockRef.current = true;
    setSubmittingComment(true);
    setComments((prev) => dedupeComments([...prev, optimisticComment]));
    setThread(prev => prev ? {
      ...prev,
      comment_count: (prev.comment_count || 0) + 1
    } : null);

    try {
      const createdComment = await createCommentForPost(thread.id, user.id, trimmedComment);
      setComments((prev) =>
        dedupeComments(
          prev.map((comment) =>
            comment.id === optimisticCommentId
              ? ({
                  ...createdComment,
                  users: createdComment.users
                    ? {
                        ...createdComment.users,
                        username: undefined,
                      } as any
                    : null,
                } as CommentWithUser)
              : comment
          )
        )
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticCommentId));
      setThread(prev => prev ? {
        ...prev,
        comment_count: Math.max((prev.comment_count || 1) - 1, 0)
      } : null);
      const message =
        error instanceof CreatePostError
          ? error.message
          : 'Unable to post comment. Please try again.';
      Alert.alert('Unable to post', message);
    } finally {
      submitCommentLockRef.current = false;
      setSubmittingComment(false);
    }
  };

  const navigateToUserProfile = (userId: string) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('UserProfile', { userId });
  };

  const handleReportPost = () => {
    if (!user || !thread) {
      promptSignIn('Please sign in to report content.');
      return;
    }
    if (user.id === thread.userid) return;
    setReportTarget({ targetType: 'post', targetId: thread.id });
  };

  const handleBlockPostAuthor = () => {
    if (!user || !thread) {
      promptSignIn('Please sign in to block users.');
      return;
    }
    if (user.id === thread.userid) return;
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
              await blockCommunityUser(user.id, thread.userid);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Unable to block', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePostHeaderOverflow = () => {
    if (!user || !thread) {
      promptSignIn('Please sign in to use post options.');
      return;
    }
    Haptics.selectionAsync();
    const isOwn = user.id === thread.userid;
    openPostOverflowMenu(isOwn, (choice) => {
      if (choice === 'delete') {
        handleDeletePost();
      } else if (choice === 'report') {
        handleReportPost();
      } else if (choice === 'block') {
        handleBlockPostAuthor();
      }
    });
  };

  const handleReportComment = (commentId: string, authorId: string) => {
    if (!user) {
      promptSignIn('Please sign in to report content.');
      return;
    }
    if (user.id === authorId) return;
    setReportTarget({ targetType: 'comment', targetId: commentId });
  };

  const handleBlockCommentAuthor = (authorId: string) => {
    if (!user) {
      promptSignIn('Please sign in to block users.');
      return;
    }
    if (user.id === authorId) return;
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
              await blockCommunityUser(user.id, authorId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setComments((prev) => prev.filter((c) => c.userid !== authorId));
              if (thread?.userid === authorId) {
                navigation.goBack();
              }
            } catch (e: any) {
              Alert.alert('Unable to block', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      promptSignIn('Please sign in to delete comments.');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityComment(commentId, user.id);
              setComments((prev) => prev.filter((comment) => comment.id !== commentId));
              setThread((prev) =>
                prev
                  ? {
                      ...prev,
                      comment_count: Math.max((prev.comment_count || 0) - 1, 0),
                    }
                  : null
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Unable to delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCommentOverflow = (comment: CommentWithUser) => {
    if (!user) {
      promptSignIn('Please sign in to use comment options.');
      return;
    }
    Haptics.selectionAsync();
    const isOwn = user.id === comment.userid;
    openCommentOverflowMenu(isOwn, (choice) => {
      if (choice === 'delete') {
        handleDeleteComment(comment.id);
      } else if (choice === 'report') {
        handleReportComment(comment.id, comment.userid);
      } else if (choice === 'block') {
        handleBlockCommentAuthor(comment.userid);
      }
    });
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

  if (loading && !thread) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerIconButton}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Discussion</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerIconButton}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Discussion</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Post not found</Text>
          <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const authorName = thread.is_anonymous
    ? 'Anonymous'
    : thread.users?.fullname || thread.users?.username || 'Member';
  const isPrayerPost = (thread.post_type || getPostTypeForCategory(thread.category)) === 'prayer';
  const saved = isBookmarked('thread', thread.id);
  const commentCount = comments.length || thread.comment_count || 0;

  const renderEngagementChip = (
    key: string,
    icon: React.ReactNode,
    label: string,
    active: boolean,
    onPress?: () => void,
    scaleAnim?: Animated.Value,
  ) => {
    const chip = (
      <View style={[styles.engagementChip, active && styles.engagementChipActive]}>
        {scaleAnim ? <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{icon}</Animated.View> : icon}
        <Text style={[styles.engagementChipLabel, active && styles.engagementChipLabelActive]}>{label}</Text>
      </View>
    );

    if (!onPress) {
      return <View key={key}>{chip}</View>;
    }

    return (
      <Pressable
        key={key}
        onPress={onPress}
        style={({ pressed }) => [styles.engagementChipPressable, pressed && styles.engagementChipPressed]}
        accessibilityRole="button"
      >
        {chip}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Discussion</Text>
        <View style={styles.headerActions}>
          {user ? (
            <Pressable
              onPress={handlePostHeaderOverflow}
              style={styles.headerIconButton}
              hitSlop={10}
              accessibilityLabel="Post options"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable onPress={handleShare} style={styles.headerIconButton}>
            <Ionicons name="share-outline" size={22} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        >
          {thread.ispinned ? (
            <View style={styles.pinnedRow}>
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={12} color={theme.colors.warning} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.postCard}>
            {isDark ? (
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.14)', 'rgba(16, 185, 129, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.postGlow}
                pointerEvents="none"
              />
            ) : null}

            <Pressable
              style={styles.authorRow}
              onPress={() => !thread.is_anonymous && thread.users && navigateToUserProfile(thread.userid)}
              disabled={thread.is_anonymous}
            >
              <Avatar
                src={thread.is_anonymous ? null : thread.users?.avatarurl}
                name={authorName}
                userId={thread.is_anonymous ? null : thread.userid}
                avatarSeed={thread.is_anonymous ? null : thread.users?.avatarseed}
                size="md"
                anonymous={thread.is_anonymous}
                showRing
              />
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, !thread.is_anonymous && styles.authorNameClickable]}>
                  {authorName}
                </Text>
                <Text style={styles.timestamp}>{formatTimeAgo(thread.createdat)}</Text>
              </View>
            </Pressable>

            <View style={styles.categoryBadge}>
              <Ionicons name={getCategoryIcon(thread.category)} size={13} color={theme.colors.primary} />
              <Text style={styles.categoryText}>{getCategoryLabel(thread.category)}</Text>
            </View>

            <Text style={styles.title}>{thread.title}</Text>
            <Text style={styles.content}>{thread.content}</Text>

            <View style={styles.engagementBar}>
              {!isPrayerPost
                ? renderEngagementChip(
                    'like',
                    <Ionicons
                      name={thread.user_has_liked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={thread.user_has_liked ? theme.colors.error : theme.colors.textMuted}
                    />,
                    String(thread.like_count || 0),
                    Boolean(thread.user_has_liked),
                    handleLike,
                    likeScale,
                  )
                : renderEngagementChip(
                    'pray',
                    <Ionicons
                      name={thread.user_has_prayed ? 'hand-right' : 'hand-right-outline'}
                      size={18}
                      color={thread.user_has_prayed ? theme.colors.primary : theme.colors.textMuted}
                    />,
                    `${thread.prayer_count || 0} prayed`,
                    Boolean(thread.user_has_prayed),
                    handlePray,
                    likeScale,
                  )}
              {renderEngagementChip(
                'comments',
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textMuted} />,
                String(commentCount),
                false,
                () => {
                  commentInputRef.current?.focus();
                }
              )}
              {renderEngagementChip(
                'bookmark',
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? theme.colors.primary : theme.colors.textMuted}
                />,
                saved ? 'Saved' : 'Save',
                saved,
                handleBookmark,
                bookmarkScale,
              )}
            </View>
          </View>

          <View style={styles.commentsWell}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Conversation</Text>
              <Text style={styles.commentsCount}>{commentCount}</Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <View style={styles.emptyCommentsIconWrap}>
                  <LinearGradient
                    colors={
                      isDark
                        ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.04)']
                        : [theme.colors.primaryLight, theme.colors.surfaceSecondary]
                    }
                    style={styles.emptyCommentsIconGradient}
                  >
                    <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.primary} />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyCommentsText}>No conversations yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Start the discussion — your voice matters here.</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentRow}>
                    <Pressable
                      onPress={() => comment.users && navigateToUserProfile(comment.userid)}
                      accessibilityRole="button"
                      accessibilityLabel="View member profile"
                    >
                      <Avatar
                        src={comment.users?.avatarurl}
                        name={comment.users?.fullname || comment.users?.username}
                        userId={comment.userid}
                        avatarSeed={comment.users?.avatarseed}
                        size="xs"
                        showRing
                      />
                    </Pressable>
                    <View style={styles.commentBubble}>
                      <View style={styles.commentHeader}>
                        <Pressable
                          onPress={() => comment.users && navigateToUserProfile(comment.userid)}
                          style={styles.commentAuthorPressable}
                        >
                          <Text style={styles.commentAuthor}>
                            {comment.users?.fullname || comment.users?.username || 'Member'}
                          </Text>
                        </Pressable>
                        <View style={styles.commentActions}>
                          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdat)}</Text>
                          {user ? (
                            <Pressable
                              onPress={() => handleCommentOverflow(comment)}
                              style={styles.commentOverflowButton}
                              hitSlop={12}
                              accessibilityLabel="Comment options: report, block, or delete"
                            >
                              <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textMuted} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 24 + insets.bottom }} />
        </ScrollView>

        <View style={[styles.commentDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <BlurView intensity={isDark ? 72 : 88} tint={isDark ? 'dark' : 'light'} style={styles.commentDockBlur}>
            <View style={styles.commentDockInner}>
              <View style={styles.commentInputShell}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                {newComment.length > 0 ? (
                  <Text style={styles.charCounter}>{newComment.length}/500</Text>
                ) : null}
              </View>
              <Pressable
                style={[
                  styles.sendButton,
                  (!newComment.trim() || submittingComment) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>

      <ReportContentModal
        visible={Boolean(user && reportTarget)}
        onClose={() => setReportTarget(null)}
        reporterId={user?.id ?? ''}
        targetType={reportTarget?.targetType ?? 'post'}
        targetId={reportTarget?.targetId ?? ''}
        onSubmitted={(info) => {
          if (info.targetType === 'comment') {
            setComments((prev) => prev.filter((c) => c.id !== info.targetId));
            setThread((prev) =>
              prev
                ? {
                    ...prev,
                    comment_count: Math.max((prev.comment_count || 1) - 1, 0),
                  }
                : null
            );
          }
          Alert.alert(REPORT_SUBMITTED_ALERT.title, REPORT_SUBMITTED_ALERT.message);
        }}
      />
    </SafeAreaView>
  );
}

function createPostDetailStyles(theme: Theme) {
  const surfaces = theme.dark
    ? {
        canvas: '#050505',
        post: '#0E0E11',
        comments: '#0A0A0C',
        dock: 'rgba(21, 21, 24, 0.72)',
        engagement: 'rgba(255, 255, 255, 0.04)',
        engagementActive: 'rgba(16, 185, 129, 0.14)',
        commentBubble: '#141418',
        input: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '#000000',
      }
    : {
        canvas: theme.colors.background,
        post: theme.colors.surface,
        comments: theme.colors.surfaceSecondary,
        dock: 'rgba(255, 255, 255, 0.9)',
        engagement: theme.colors.borderLight,
        engagementActive: theme.colors.primaryLight,
        commentBubble: theme.colors.surface,
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    keyboardAvoid: {
      flex: 1,
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
      paddingHorizontal: 40,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.textMuted,
      marginTop: 12,
      marginBottom: 20,
      textAlign: 'center',
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
    pinnedRow: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    pinnedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.dark ? 'rgba(251, 191, 36, 0.12)' : '#fef3c7',
    },
    pinnedText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.warning,
      letterSpacing: 0.2,
    },
    postCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      borderRadius: 20,
      backgroundColor: surfaces.post,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
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
    postGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    avatarPlaceholder: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: surfaces.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorInfo: {
      marginLeft: 12,
      flex: 1,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.1,
      color: theme.colors.text,
    },
    authorNameClickable: {
      color: theme.colors.primary,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 3,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.12)' : theme.colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      alignSelf: 'flex-start',
      marginBottom: 20,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
      letterSpacing: 0.15,
    },
    title: {
      fontSize: 26,
      fontWeight: '600',
      letterSpacing: -0.6,
      color: theme.colors.text,
      lineHeight: 32,
      marginBottom: 14,
      maxWidth: '100%',
    },
    content: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 23,
      marginBottom: 22,
      maxWidth: '100%',
    },
    engagementBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: 6,
      borderRadius: 16,
      backgroundColor: surfaces.engagement,
    },
    engagementChipPressable: {
      flex: 1,
    },
    engagementChipPressed: {
      opacity: 0.82,
    },
    engagementChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    engagementChipActive: {
      backgroundColor: surfaces.engagementActive,
    },
    engagementChipLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    engagementChipLabelActive: {
      color: theme.colors.text,
    },
    commentsWell: {
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 8,
      borderRadius: 20,
      backgroundColor: surfaces.comments,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    commentsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    commentsTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
    },
    commentsCount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      minWidth: 24,
      textAlign: 'right',
    },
    emptyComments: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 12,
    },
    emptyCommentsIconWrap: {
      marginBottom: 16,
    },
    emptyCommentsIconGradient: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCommentsText: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyCommentsSubtext: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
      maxWidth: 260,
      opacity: 0.9,
    },
    commentCard: {
      marginBottom: 14,
    },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    commentAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    commentAvatarPlaceholder: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: surfaces.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentBubble: {
      flex: 1,
      marginLeft: 10,
      backgroundColor: surfaces.commentBubble,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
      gap: 8,
    },
    commentAuthorPressable: {
      flexShrink: 1,
      marginRight: 8,
    },
    commentAuthor: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      flexShrink: 1,
    },
    commentTime: {
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    commentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    commentOverflowButton: {
      padding: 2,
    },
    commentText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 21,
    },
    commentDock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: surfaces.border,
      overflow: 'hidden',
    },
    commentDockBlur: {
      backgroundColor: surfaces.dock,
    },
    commentDockInner: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    commentInputShell: {
      flex: 1,
    },
    commentInput: {
      backgroundColor: surfaces.input,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 11,
      paddingTop: 11,
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.text,
      maxHeight: 110,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.border,
    },
    charCounter: {
      fontSize: 11,
      color: theme.colors.textMuted,
      textAlign: 'right',
      marginTop: 6,
      marginRight: 6,
      opacity: 0.8,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    sendButtonDisabled: {
      backgroundColor: theme.dark ? '#3f3f46' : theme.colors.textMuted,
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}
