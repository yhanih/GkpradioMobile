import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  deleteCommunityComment,
  deleteCommunityPost,
  createCommentForPost,
  fetchCommentsForPost,
  getPostById,
  togglePostReaction,
} from '../lib/backend';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { RootStackParamList } from '../types/navigation';
import { PostType, getCategoryIcon, getCategoryLabel, getPostTypeForCategory } from '../constants/categories';

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
  } | null;
}

export function PostDetailScreen() {
  const navigation = useNavigation<PostDetailNavProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [thread, setThread] = useState<ThreadWithUser | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
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
      
      // If we have the thread in params, use it for immediate display
      if (route.params.thread && !thread) {
        const t = route.params.thread;
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
          users: t.users
        } as any);
      }

      // Fetch fresh data from API
      // Since we don't have getTestimonyById yet, we'll use getTestimonies and filter
      const found = await getPostById(threadId, user?.id);
      if (found) setThread(found as ThreadWithUser);
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  }, [route.params.threadId, route.params.thread, user?.id]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await fetchCommentsForPost(String(route.params.threadId));
      setComments(dedupeComments(data as CommentWithUser[]));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [route.params.threadId, dedupeComments]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchThread(), fetchComments()]);
    setLoading(false);
  }, [fetchThread, fetchComments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      .channel(`post-comments-${route.params.threadId}`)
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

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts.');
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
      Alert.alert('Sign In Required', 'Please sign in to pray with the community.');
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
      Alert.alert('Sign In Required', 'Please sign in to save posts.');
      return;
    }
    if (!thread) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
      Alert.alert('Sign In Required', 'Please sign in to delete posts.');
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
      Alert.alert('Sign In Required', 'Please sign in to comment.');
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
      Alert.alert('Error', 'Unable to post comment. Please try again.');
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

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to delete comments.');
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
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#09090b" />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </SafeAreaView>
    );
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#09090b" />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
  const avatarUrl = thread.is_anonymous ? null : thread.users?.avatarurl;
  const isPrayerPost = (thread.post_type || getPostTypeForCategory(thread.category)) === 'prayer';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerActions}>
          {user?.id === thread.userid && (
            <Pressable onPress={handleDeletePost} style={styles.deletePostButton}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </Pressable>
          )}
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#09090b" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
          }
        >
          {thread.ispinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={14} color="#f59e0b" />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}

          <View style={styles.postContainer}>
            <Pressable 
              style={styles.authorRow}
              onPress={() => !thread.is_anonymous && thread.users && navigateToUserProfile(thread.userid)}
              disabled={thread.is_anonymous}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#71717a" />
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, !thread.is_anonymous && styles.authorNameClickable]}>
                  {authorName}
                </Text>
                <Text style={styles.timestamp}>{formatTimeAgo(thread.createdat)}</Text>
              </View>
            </Pressable>

            <View style={styles.categoryBadge}>
              <Ionicons
                name={getCategoryIcon(thread.category)}
                size={14}
                color="#047857"
              />
              <Text style={styles.categoryText}>{getCategoryLabel(thread.category)}</Text>
            </View>

            <Text style={styles.title}>{thread.title}</Text>
            <Text style={styles.content}>{thread.content}</Text>

            <View style={styles.actionsRow}>
              {!isPrayerPost && (
                <Pressable style={styles.actionButton} onPress={handleLike}>
                  <Ionicons
                    name={thread.user_has_liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={thread.user_has_liked ? '#ef4444' : '#71717a'}
                  />
                  <Text style={[styles.actionText, thread.user_has_liked && styles.actionTextActive]}>
                    {thread.like_count || 0}
                  </Text>
                </Pressable>
              )}

              {isPrayerPost && (
                <Pressable style={styles.actionButton} onPress={handlePray}>
                  <Ionicons
                    name={thread.user_has_prayed ? 'hand-right' : 'hand-right-outline'}
                    size={22}
                    color={thread.user_has_prayed ? '#047857' : '#71717a'}
                  />
                  <Text style={[styles.actionText, thread.user_has_prayed && styles.prayedText]}>
                    {thread.prayer_count || 0} prayed
                  </Text>
                </Pressable>
              )}

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color="#71717a" />
                <Text style={styles.actionText}>{thread.comment_count || 0}</Text>
              </View>

              <Pressable style={styles.actionButton} onPress={handleBookmark}>
                <Ionicons
                  name={isBookmarked('thread', thread.id) ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isBookmarked('thread', thread.id) ? '#047857' : '#71717a'}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={36} color="#d4d4d8" />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
              </View>
            ) : (
              comments.map(comment => (
                <View key={comment.id} style={styles.commentCard}>
                  <Pressable 
                    style={styles.commentRow}
                    onPress={() => comment.users && navigateToUserProfile(comment.userid)}
                  >
                    {comment.users?.avatarurl ? (
                      <Image source={{ uri: comment.users.avatarurl }} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarPlaceholder}>
                        <Ionicons name="person" size={14} color="#71717a" />
                      </View>
                    )}
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {comment.users?.fullname || comment.users?.username || 'Member'}
                        </Text>
                        <View style={styles.commentActions}>
                          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdat)}</Text>
                          {user && user.id === comment.userid && (
                            <Pressable 
                              onPress={() => handleDeleteComment(comment.id)}
                              style={styles.deleteCommentButton}
                            >
                              <Ionicons name="trash-outline" size={14} color="#ef4444" />
                            </Pressable>
                          )}
                        </View>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#a1a1aa"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCounter}>{newComment.length}/500</Text>
          </View>
          <Pressable
            style={[styles.sendButton, (!newComment.trim() || submittingComment) && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
  },
  shareButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletePostButton: {
    padding: 8,
    marginRight: 4,
  },
  keyboardAvoid: {
    flex: 1,
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
    color: '#71717a',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
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
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pinnedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  postContainer: {
    padding: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
  },
  authorNameClickable: {
    color: '#047857',
  },
  timestamp: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
    lineHeight: 28,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: '#3f3f46',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#71717a',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#ef4444',
  },
  prayedText: {
    color: '#047857',
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 8,
    borderTopColor: '#f4f4f5',
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCommentsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#71717a',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 4,
  },
  commentCard: {
    marginBottom: 16,
  },
  commentRow: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#09090b',
  },
  commentTime: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteCommentButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    backgroundColor: '#fff',
  },
  commentInputWrapper: {
    flex: 1,
  },
  commentInput: {
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#09090b',
    maxHeight: 100,
  },
  charCounter: {
    fontSize: 11,
    color: '#a1a1aa',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#047857',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a1a1aa',
  },
});
