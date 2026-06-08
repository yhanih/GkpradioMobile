import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './ui/avatar';
import { Theme } from '../contexts/ThemeContext';
import { PostType, getCategoryIcon, getCategoryLabel, getPostTypeForCategory } from '../constants/categories';

export interface ThreadWithUser {
  id: string;
  title: string;
  content: string;
  category: string;
  post_type: PostType | null;
  createdat: string;
  like_count: number;
  prayer_count: number;
  comment_count: number;
  user_has_liked?: boolean;
  user_has_prayed?: boolean;
  userid: string;
  is_anonymous?: boolean;
  ispinned?: boolean;
  users?: {
    id: string;
    fullname: string | null;
    avatarurl: string | null;
    avatarseed?: string | null;
  } | null;
}

interface PostCardProps {
  thread: ThreadWithUser;
  isPinned?: boolean;
  theme: Theme;
  isBookmarked: boolean;
  onPress: (thread: ThreadWithUser) => void;
  onPressAuthor: (userId: string, user: any) => void;
  onLike: (threadId: string, currentlyLiked: boolean) => void;
  onPray: (threadId: string, currentlyPrayed: boolean) => void;
  onCommentPress: (thread: ThreadWithUser, focusReply?: boolean) => void;
  onBookmarkToggle: (threadId: string) => void;
  onShare: (thread: ThreadWithUser) => void;
  onOverflowMenu: (thread: ThreadWithUser) => void;
  formatTimeAgo: (dateString: string) => string;
}

const PostCardComponent: React.FC<PostCardProps> = ({
  thread,
  isPinned = false,
  theme,
  isBookmarked,
  onPress,
  onPressAuthor,
  onLike,
  onPray,
  onCommentPress,
  onBookmarkToggle,
  onShare,
  onOverflowMenu,
  formatTimeAgo,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const likeAnim = useRef(new Animated.Value(1)).current;

  const postType = thread.post_type || getPostTypeForCategory(thread.category);
  const isPrayerPost = postType === 'prayer';
  const authorName = thread.is_anonymous
    ? 'Anonymous'
    : thread.users?.fullname || 'Member';

  const triggerLikeAnimation = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(likeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLikePress = (e: any) => {
    e?.stopPropagation?.();
    triggerLikeAnimation();
    if (isPrayerPost) {
      onPray(thread.id, thread.user_has_prayed || false);
    } else {
      onLike(thread.id, thread.user_has_liked || false);
    }
  };

  return (
    <View style={[styles.card, isPinned && styles.pinnedCard]}>
      {isPinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color="#f59e0b" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}
      
      <View style={styles.cardHeader}>
        <Pressable
          style={styles.authorInfo}
          onPress={() => {
            if (!thread.is_anonymous && thread.users) {
              onPressAuthor(thread.userid, thread.users);
            }
          }}
        >
          <Avatar
            src={thread.is_anonymous ? null : thread.users?.avatarurl}
            name={authorName}
            userId={thread.is_anonymous ? null : thread.userid}
            avatarSeed={thread.is_anonymous ? null : thread.users?.avatarseed}
            size="sm"
            anonymous={thread.is_anonymous}
            showRing
          />
          <View style={styles.authorMeta}>
            <Text style={[styles.authorName, !thread.is_anonymous && styles.authorNameClickable]}>
              {authorName}
            </Text>
            <Text style={styles.time}>{formatTimeAgo(thread.createdat)}</Text>
          </View>
        </Pressable>
        
        <View style={styles.categoryBadge}>
          <Ionicons
            name={getCategoryIcon(thread.category)}
            size={12}
            color={theme.colors.primary}
          />
          <Text style={styles.categoryBadgeText}>{getCategoryLabel(thread.category)}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => onPress(thread)}
        accessibilityRole="button"
        accessibilityLabel={`Open post: ${thread.title}`}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {thread.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {thread.content}
        </Text>
      </Pressable>

      <View style={styles.cardFooter}>
        <View style={styles.engagementStats}>
          <Pressable style={styles.statButton} onPress={handleLikePress}>
            <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
              <Ionicons
                name={
                  isPrayerPost
                    ? (thread.user_has_prayed ? 'hand-right' : 'hand-right-outline')
                    : (thread.user_has_liked ? 'heart' : 'heart-outline')
                }
                size={18}
                color={
                  isPrayerPost
                    ? (thread.user_has_prayed ? theme.colors.primary : theme.colors.textMuted)
                    : (thread.user_has_liked ? theme.colors.error : theme.colors.textMuted)
                }
              />
            </Animated.View>
            <Text
              style={[
                styles.statText,
                isPrayerPost
                  ? thread.user_has_prayed && styles.prayStatTextActive
                  : thread.user_has_liked && styles.statTextActive
              ]}
            >
              {isPrayerPost ? `${thread.prayer_count || 0} prayed` : (thread.like_count || 0)}
            </Text>
          </Pressable>

          <Pressable
            style={styles.statButton}
            onPress={() => onCommentPress(thread, true)}
          >
            <Ionicons name="chatbubble-outline" size={17} color={theme.colors.textMuted} />
            <Text style={styles.statText}>{thread.comment_count || 0}</Text>
          </Pressable>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => onBookmarkToggle(thread.id)}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? theme.colors.primary : theme.colors.textMuted}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => onShare(thread)}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons name="share-social-outline" size={18} color={theme.colors.textMuted} />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => onOverflowMenu(thread)}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// Custom comparison for React.memo to minimize unnecessary re-renders
const areEqual = (prevProps: PostCardProps, nextProps: PostCardProps) => {
  return (
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.theme === nextProps.theme &&
    prevProps.thread.id === nextProps.thread.id &&
    prevProps.thread.title === nextProps.thread.title &&
    prevProps.thread.content === nextProps.thread.content &&
    prevProps.thread.category === nextProps.thread.category &&
    prevProps.thread.like_count === nextProps.thread.like_count &&
    prevProps.thread.prayer_count === nextProps.thread.prayer_count &&
    prevProps.thread.comment_count === nextProps.thread.comment_count &&
    prevProps.thread.user_has_liked === nextProps.thread.user_has_liked &&
    prevProps.thread.user_has_prayed === nextProps.thread.user_has_prayed &&
    prevProps.thread.is_anonymous === nextProps.thread.is_anonymous &&
    prevProps.thread.users?.fullname === nextProps.thread.users?.fullname &&
    prevProps.thread.users?.avatarurl === nextProps.thread.users?.avatarurl &&
    prevProps.thread.users?.avatarseed === nextProps.thread.users?.avatarseed
  );
};

export const PostCard = React.memo(PostCardComponent, areEqual);

function createStyles(theme: Theme) {
  const pinBg = theme.dark ? 'rgba(251, 191, 36, 0.12)' : '#fffbeb';
  const pinBorder = theme.dark ? 'rgba(245, 158, 11, 0.45)' : '#fbbf24';

  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      padding: 18,
      borderRadius: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.2 : 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    pinnedCard: {
      borderColor: pinBorder,
      borderWidth: 1,
      backgroundColor: pinBg,
    },
    pinnedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 10,
    },
    pinnedText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#f59e0b',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    authorMeta: {
      flex: 1,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    authorNameClickable: {
      color: theme.colors.primary,
    },
    time: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textMuted,
      lineHeight: 20,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    engagementStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    statTextActive: {
      color: theme.colors.error,
    },
    prayStatTextActive: {
      color: theme.colors.primary,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionButton: {
      padding: 4,
    },
  });
}
