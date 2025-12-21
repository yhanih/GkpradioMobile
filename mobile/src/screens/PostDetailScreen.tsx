import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CommunityThread, CommunityComment, User } from '../types/database.types';
import { RootStackParamList } from '../types/navigation';
import { getCategoryIcon, getCategoryLabel } from '../constants/categories';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;

interface ThreadWithUser extends CommunityThread {
  users?: User | null;
  user_has_liked?: boolean;
  user_has_prayed?: boolean;
  prayer_count?: number;
  user_has_bookmarked?: boolean;
}

interface CommentWithUser extends CommunityComment {
  users?: User | null;
}

export function PostDetailScreen() {
  const navigation = useNavigation<PostDetailNavProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { user } = useAuth();

  const [thread, setThread] = useState<ThreadWithUser | null>(route.params.thread || null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchThread = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('communitythreads')
        .select(`
          *,
          users:userid (
            id,
            username,
            fullname,
            avatarurl
          )
        `)
        .eq('id', route.params.threadId)
        .single();

      if (error) throw error;

      let threadData: ThreadWithUser = data;

      if (user) {
        const [likesResult, prayersResult, bookmarksResult] = await Promise.all([
          supabase
            .from('community_thread_likes')
            .select('id')
            .eq('thread_id', route.params.threadId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('thread_prayers')
            .select('id')
            .eq('thread_id', route.params.threadId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('bookmarks')
            .select('id')
            .eq('content_type', 'thread')
            .eq('content_id', route.params.threadId)
            .eq('userid', user.id)
            .maybeSingle(),
        ]);

        threadData = {
          ...data,
          user_has_liked: !!likesResult.data,
          user_has_prayed: !!prayersResult.data,
          user_has_bookmarked: !!bookmarksResult.data,
        };
      }

      const { count: prayerCount } = await supabase
        .from('thread_prayers')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', route.params.threadId);

      threadData.prayer_count = prayerCount || 0;

      setThread(threadData);
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  }, [route.params.threadId, user]);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('communitycomments')
        .select(`
          *,
          users:userid (
            id,
            username,
            fullname,
            avatarurl
          )
        `)
        .eq('threadid', route.params.threadId)
        .order('createdat', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [route.params.threadId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchThread(), fetchComments()]);
    setLoading(false);
  }, [fetchThread, fetchComments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    
    setThread(prev => prev ? {
      ...prev,
      user_has_liked: !currentlyLiked,
      like_count: currentlyLiked ? prev.like_count - 1 : prev.like_count + 1
    } : null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (currentlyLiked) {
        await supabase
          .from('community_thread_likes')
          .delete()
          .eq('thread_id', thread.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('community_thread_likes')
          .insert({ thread_id: thread.id, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setThread(prev => prev ? {
        ...prev,
        user_has_liked: currentlyLiked,
        like_count: currentlyLiked ? prev.like_count + 1 : prev.like_count - 1
      } : null);
    }
  };

  const handlePray = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to pray for posts.');
      return;
    }
    if (!thread) return;

    const currentlyPrayed = thread.user_has_prayed;

    setThread(prev => prev ? {
      ...prev,
      user_has_prayed: !currentlyPrayed,
      prayer_count: currentlyPrayed 
        ? (prev.prayer_count || 1) - 1 
        : (prev.prayer_count || 0) + 1
    } : null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (currentlyPrayed) {
        await supabase
          .from('thread_prayers')
          .delete()
          .eq('thread_id', thread.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('thread_prayers')
          .insert({ thread_id: thread.id, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling prayer:', error);
      setThread(prev => prev ? {
        ...prev,
        user_has_prayed: currentlyPrayed,
        prayer_count: currentlyPrayed 
          ? (prev.prayer_count || 0) + 1 
          : (prev.prayer_count || 1) - 1
      } : null);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark posts.');
      return;
    }
    if (!thread) return;

    const currentlyBookmarked = thread.user_has_bookmarked;

    setThread(prev => prev ? {
      ...prev,
      user_has_bookmarked: !currentlyBookmarked
    } : null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (currentlyBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('content_type', 'thread')
          .eq('content_id', thread.id)
          .eq('userid', user.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ 
            content_type: 'thread', 
            content_id: thread.id, 
            userid: user.id 
          });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setThread(prev => prev ? {
        ...prev,
        user_has_bookmarked: currentlyBookmarked
      } : null);
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

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment.');
      return;
    }
    if (!thread || !newComment.trim()) return;

    setSubmittingComment(true);

    try {
      const { error } = await supabase
        .from('communitycomments')
        .insert({
          userid: user.id,
          threadid: thread.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewComment('');
      await fetchComments();
      
      setThread(prev => prev ? {
        ...prev,
        comment_count: prev.comment_count + 1
      } : null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Unable to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const navigateToUserProfile = (userId: string, userData?: User | null) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('UserProfile', { userId, user: userData || undefined });
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

  if (loading) {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#09090b" />
        </Pressable>
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
              onPress={() => !thread.is_anonymous && thread.users && navigateToUserProfile(thread.userid, thread.users)}
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

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color="#71717a" />
                <Text style={styles.actionText}>{thread.comment_count || 0}</Text>
              </View>

              <Pressable style={styles.actionButton} onPress={handleBookmark}>
                <Ionicons
                  name={thread.user_has_bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={thread.user_has_bookmarked ? '#047857' : '#71717a'}
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
                <Pressable 
                  key={comment.id} 
                  style={styles.commentCard}
                  onPress={() => comment.users && navigateToUserProfile(comment.userid, comment.users)}
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
                      <Text style={styles.commentTime}>{formatTimeAgo(comment.createdat)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                </Pressable>
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
    flexDirection: 'row',
    marginBottom: 16,
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
