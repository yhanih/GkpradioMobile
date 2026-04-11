import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, Image, TextInput, Animated, Share, Dimensions, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BackendThread,
  deleteCommunityPost,
  fetchCommunityPosts,
  getCommunityStats,
  togglePostReaction,
} from '../lib/backend';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { NewPostModal } from '../components/NewPostModal';
import {
  COMMUNITY_CATEGORIES,
  PostType,
  getCategoryIcon,
  getCategoryLabel,
  getPostTypeForCategory,
  isPrayerCategory,
  Category,
} from '../constants/categories';
import { RootStackParamList } from '../types/navigation';
import { useToast } from '../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SortOption = 'newest' | 'popular' | 'discussed';
type ModeType = 'prayers' | 'discussions';

const DISCUSSION_CATEGORIES = COMMUNITY_CATEGORIES
  .filter(cat => cat.id !== 'all' && !isPrayerCategory(cat.id))
  .map(cat => cat.id);

interface ThreadWithUser {
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
  } | null;
}

type CommunityNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function CommunityScreen() {
  const navigation = useNavigation<CommunityNavProp>();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { isBookmarked, toggleBookmark, refreshBookmarks } = useBookmarks();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [activeMode, setActiveMode] = useState<ModeType>('prayers');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [threads, setThreads] = useState<ThreadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, total: 0 });
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [likingThreadId, setLikingThreadId] = useState<string | null>(null);
  const [likeAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const fabScale = useRef(new Animated.Value(1)).current;
  const sortByRef = useRef(sortBy);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const dedupeThreads = useCallback((items: ThreadWithUser[]) => {
    const seen = new Set<string>();
    const result: ThreadWithUser[] = [];
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
    return result;
  }, []);

  const sortByNewest = useCallback((items: ThreadWithUser[]) => {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.createdat).getTime() || 0;
      const bTime = new Date(b.createdat).getTime() || 0;
      return bTime - aTime;
    });
  }, []);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeMode === 'prayers' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [activeMode]);

  useEffect(() => {
    setActiveCategory('all');
  }, [activeMode]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getCommunityStats();
      setStats(data);
    } catch (_error) {
      setStats({ prayers: 0, testimonies: 0, total: 0 });
    }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    console.log('[CommunityScreen] fetchData started');
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchCommunityPosts(sortBy, user?.id);
      console.log(`[CommunityScreen] Posts fetched: ${data.length}`);
      const ordered = sortByNewest(dedupeThreads(data as ThreadWithUser[]));
      setThreads(ordered);
    } catch (err: any) {
      console.error('[CommunityScreen] Error fetching community data:', err);
      if (err.stack) console.error(err.stack);
      setError('Unable to load community content. Please try again.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [dedupeThreads, sortByNewest, sortBy, user?.id]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
      refreshBookmarks();
    }, [fetchData, refreshBookmarks])
  );

  const getLikeAnimation = (threadId: string) => {
    if (!likeAnimations[threadId]) {
      likeAnimations[threadId] = new Animated.Value(1);
    }
    return likeAnimations[threadId];
  };

  useEffect(() => {
    const threadIds = new Set(threads.map(t => t.id));
    Object.keys(likeAnimations).forEach(threadId => {
      if (!threadIds.has(threadId)) {
        delete likeAnimations[threadId];
      }
    });
  }, [threads]);

  useEffect(() => {
    const queueRealtimeRefresh = () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      realtimeDebounceRef.current = setTimeout(() => {
        fetchData(true);
        fetchStats();
      }, 350);
    };

    const channel = supabase
      .channel('community-feed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, queueRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, queueRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, queueRealtimeRefresh)
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchStats]);

  const animateLike = (threadId: string) => {
    const anim = getLikeAnimation(threadId);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLike = async (threadId: string, currentlyLiked: boolean) => {
    if (!user) {
      showToast('Please sign in to like posts', 'info');
      return;
    }

    if (likingThreadId === threadId) {
      return;
    }

    setLikingThreadId(threadId);

    const currentThread = threads.find(t => t.id === threadId);
    const currentCount = currentThread?.like_count ?? 0;
    const newCount = currentlyLiked ? Math.max(currentCount - 1, 0) : currentCount + 1;

    animateLike(threadId);

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          user_has_liked: !currentlyLiked,
          like_count: newCount
        };
      }
      return t;
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await togglePostReaction(threadId, user.id, 'like');
    } catch (error: any) {
      console.error('Error toggling like:', error);
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            user_has_liked: currentlyLiked,
            like_count: currentCount
          };
        }
        return t;
      }));
      showToast('Unable to update like. Please try again.', 'error');
    } finally {
      setLikingThreadId(null);
    }
  };

  const handlePray = async (threadId: string, currentlyPrayed: boolean) => {
    if (!user) {
      showToast('Please sign in to pray with the community', 'info');
      return;
    }

    if (likingThreadId === threadId) {
      return;
    }

    setLikingThreadId(threadId);

    const currentThread = threads.find(t => t.id === threadId);
    const currentCount = currentThread?.prayer_count ?? 0;
    const newCount = currentlyPrayed ? Math.max(currentCount - 1, 0) : currentCount + 1;

    animateLike(threadId);

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          user_has_prayed: !currentlyPrayed,
          prayer_count: newCount
        };
      }
      return t;
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await togglePostReaction(threadId, user.id, 'pray');
    } catch (error: any) {
      console.error('Error toggling prayer reaction:', error);
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            user_has_prayed: currentlyPrayed,
            prayer_count: currentCount
          };
        }
        return t;
      }));
      showToast('Unable to update prayer response. Please try again.', 'error');
    } finally {
      setLikingThreadId(null);
    }
  };

  const handleReport = async (targetType: 'thread' | 'comment', targetId: string) => {
    if (!user) {
      showToast('Please sign in to report content', 'info');
      return;
    }

    Alert.alert(
      'Report Content',
      'Are you sure you want to report this content for being inappropriate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`mailto:support@gkpradio.com?subject=Report%20Inappropriate%20Content&body=Reporting%20${targetType}%20with%20ID:%20${targetId}`);
            showToast('Thank you for your report. Our team will review it.', 'success');
          }
        }
      ]
    );
  };

  const handleBlock = async (blockedUserId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to block users.');
      return;
    }

    Alert.alert(
      'Block User',
      'If you wish to block a user, please contact our support team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => {
            Linking.openURL(`mailto:support@gkpradio.com?subject=Block%20User%20Request&body=I%20would%20like%20to%20block%20user%20ID:%20${blockedUserId}`);
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchStats(), refreshBookmarks()]);
    setRefreshing(false);
  };

  const handleBookmarkToggle = async (threadId: string) => {
    if (!user) {
      showToast('Please sign in to save posts', 'info');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await toggleBookmark('thread', threadId);
      showToast(result ? 'Post saved' : 'Post removed from bookmarks', 'success', 2000);
      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      showToast('Unable to save post. Please try again.', 'error');
    }
  };

  const handleSharePost = async (thread: ThreadWithUser) => {
    Haptics.selectionAsync();
    try {
      const content = thread.content || '';
      await Share.share({
        title: thread.title,
        message: `${thread.title}\n\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n\nShared from GKP Radio Community`,
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
      if (error?.message !== 'User did not share') {
        showToast('Unable to share post. Please try again.', 'error');
      }
    }
  };

  const handleDeletePost = async (threadId: string, threadUserId: string) => {
    if (!user || String(user.id) !== threadUserId) {
      showToast('You can only delete your own posts', 'warning');
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
              await deleteCommunityPost(threadId, user.id);
              setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
              await fetchStats();
              showToast('Post deleted successfully', 'success');
            } catch (error) {
              console.error('Error deleting post:', error);
              showToast('Unable to delete post. Please try again.', 'error');
            }
          },
        }
      ]
    );
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowNewPostModal(true);
    });
  };

  const focusFeedOnCreatedCategory = useCallback((category: string) => {
    const isPrayer = isPrayerCategory(category);
    setSortBy('newest');
    setActiveMode(isPrayer ? 'prayers' : 'discussions');
    setActiveCategory(category);
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, []);

  const formatTimeAgo = (dateString: string) => {
    try {
      if (!dateString) return 'recently';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'recently';
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      return 'recently';
    }
  };

  // Filter threads by mode first, then by category
  const filteredThreads = useMemo(() => {
    // First filter by mode (prayers vs discussions)
    let modeFiltered = threads.filter(t => {
      const postType = t.post_type || getPostTypeForCategory(t.category);
      if (activeMode === 'prayers') {
        return postType === 'prayer';
      } else {
        return postType === 'discussion';
      }
    });

    // Then filter by category if not 'all'
    if (activeCategory === 'all') {
      return modeFiltered;
    }
    return modeFiltered.filter(t => t.category === activeCategory);
  }, [threads, activeMode, activeCategory]);

  // Get categories relevant to the active mode
  const modeCategories = useMemo(() => {
    if (activeMode === 'prayers') {
      return [
        { id: 'all', label: 'All', icon: 'grid-outline' as const, iconActive: 'grid' as const },
        ...COMMUNITY_CATEGORIES.filter(cat => isPrayerCategory(cat.id))
      ];
    } else {
      return [
        { id: 'all', label: 'All', icon: 'grid-outline' as const, iconActive: 'grid' as const },
        ...COMMUNITY_CATEGORIES.filter(cat => DISCUSSION_CATEGORIES.includes(cat.id))
      ];
    }
  }, [activeMode]);

  // Memoize category counts for performance (only for current mode)
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    modeCategories.forEach(cat => {
      if (cat.id === 'all') {
        // Count all threads in the current mode
        const modeFiltered = threads.filter(t => {
          const postType = t.post_type || getPostTypeForCategory(t.category);
          if (activeMode === 'prayers') {
            return postType === 'prayer';
          } else {
            return postType === 'discussion';
          }
        });
        counts[cat.id] = modeFiltered.length;
      } else {
        counts[cat.id] = threads.filter(t => t.category === cat.id).length;
      }
    });
    return counts;
  }, [threads, activeMode, modeCategories]);

  const renderCategoryTab = (category: typeof modeCategories[0]) => {
    const isActive = activeCategory === category.id;
    const count = categoryCounts[category.id] || 0;

    return (
      <Pressable
        key={category.id}
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => {
          Haptics.selectionAsync();
          setActiveCategory(category.id);
        }}
      >
        <Ionicons
          name={isActive ? category.iconActive : category.icon}
          size={18}
          color={isActive ? '#fff' : '#71717a'}
        />
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
          {category.label}
        </Text>
        {count > 0 && (
          <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const navigateToPost = (thread: ThreadWithUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: thread.id, thread });
  };

  const navigateToUserProfile = (userId: string, userData?: { id: string; fullname: string | null; avatarurl: string | null } | null) => {
    if (!userId || userId.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('UserProfile', { userId, user: userData ? { ...userData, username: '' } as any : undefined });
  };

  // Memoize filtered search results
  const filteredBySearch = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return filteredThreads;
    const query = debouncedSearchQuery.toLowerCase();
    return filteredThreads.filter(t => {
      const title = t.title?.toLowerCase() || '';
      const content = t.content?.toLowerCase() || '';
      return title.includes(query) || content.includes(query);
    });
  }, [filteredThreads, debouncedSearchQuery]);

  const pinnedThreads = filteredBySearch.filter(t => t.ispinned);
  const regularThreads = filteredBySearch.filter(t => !t.ispinned);

  const renderThread = (thread: ThreadWithUser, isPinned = false) => {
    const postType = thread.post_type || getPostTypeForCategory(thread.category);
    const isPrayerPost = postType === 'prayer';
    const authorName = thread.is_anonymous
      ? 'Anonymous'
      : thread.users?.fullname || 'Member';
    const avatarUrl = thread.is_anonymous ? null : thread.users?.avatarurl;

    return (
      <Pressable
        key={thread.id}
        style={[styles.card, isPinned && styles.pinnedCard]}
        onPress={() => navigateToPost(thread)}
      >
        {isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color="#f59e0b" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Pressable
            style={styles.authorInfo}
            onPress={(e) => {
              e.stopPropagation();
              if (!thread.is_anonymous && thread.users) {
                navigateToUserProfile(thread.userid, thread.users);
              }
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={14} color="#71717a" />
              </View>
            )}
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
              color="#047857"
            />
            <Text style={styles.categoryBadgeText}>{getCategoryLabel(thread.category)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {thread.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {thread.content}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.engagementStats}>
            <Pressable
              style={styles.statButton}
              onPress={() =>
                isPrayerPost
                  ? handlePray(thread.id, thread.user_has_prayed || false)
                  : handleLike(thread.id, thread.user_has_liked || false)
              }
            >
              <Animated.View style={{ transform: [{ scale: getLikeAnimation(thread.id) }] }}>
                <Ionicons
                  name={
                    isPrayerPost
                      ? (thread.user_has_prayed ? 'hand-right' : 'hand-right-outline')
                      : (thread.user_has_liked ? "heart" : "heart-outline")
                  }
                  size={18}
                  color={
                    isPrayerPost
                      ? (thread.user_has_prayed ? '#047857' : '#71717a')
                      : (thread.user_has_liked ? "#ef4444" : "#71717a")
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
            <View style={styles.statButton}>
              <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
              <Text style={styles.statText}>
                {thread.comment_count || 0}
                {!isPrayerPost ? ' replies' : ''}
              </Text>
            </View>
            <Pressable
              style={styles.statButton}
              onPress={() => handleSharePost(thread)}
            >
              <Ionicons name="share-outline" size={18} color="#71717a" />
            </Pressable>
          </View>
          <View style={styles.cardActions}>
            <Pressable
              onPress={() => handleBookmarkToggle(thread.id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={isBookmarked('thread', thread.id) ? "bookmark" : "bookmark-outline"}
                size={16}
                color={isBookmarked('thread', thread.id) ? "#047857" : "#a1a1aa"}
              />
            </Pressable>
            {user && user.id === thread.userid && (
              <Pressable onPress={() => handleDeletePost(thread.id, thread.userid)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </Pressable>
            )}
            <Pressable onPress={() => handleReport('thread', thread.id)} style={styles.actionButton}>
              <Ionicons name="flag-outline" size={16} color="#a1a1aa" />
            </Pressable>
            <Pressable onPress={() => handleBlock(thread.userid)} style={styles.actionButton}>
              <Ionicons name="eye-off-outline" size={16} color="#a1a1aa" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'Newest';
      case 'popular': return 'Most Liked';
      case 'discussed': return 'Most Discussed';
      default: return 'Newest';
    }
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
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Share testimonies, lift prayers, and encourage one another
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            placeholderTextColor="#a1a1aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.searchButton}
            >
              <Ionicons name="close-circle" size={20} color="#71717a" />
            </Pressable>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
              <Ionicons name="chatbubbles" size={20} color="#059669" />
            </View>
            <Text style={styles.statValue}>{stats.prayers}</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="sparkles" size={20} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.testimonies}</Text>
            <Text style={styles.statLabel}>Testimonies</Text>
          </View>
          <Pressable
            style={styles.statBox}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowNewPostModal(true);
            }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(4, 120, 87, 0.1)' }]}>
              <Ionicons name="add-circle" size={24} color="#047857" />
            </View>
            <Text style={[styles.statLabel, { marginTop: 4, fontWeight: '700', color: '#047857' }]}>New Post</Text>
          </Pressable>
        </View>

        {/* Mode Tab Switcher */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [{
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (SCREEN_WIDTH - 48) / 2],
                    })
                  }],
                },
              ]}
            />
            <Pressable
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveMode('prayers');
              }}
            >
              <Ionicons
                name="hand-right"
                size={18}
                color={activeMode === 'prayers' ? '#fff' : '#71717a'}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeMode === 'prayers' ? '#fff' : '#71717a' },
                ]}
              >
                Prayers
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeMode === 'prayers' ? 'rgba(255,255,255,0.3)' : '#e4e4e7' }
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  { color: activeMode === 'prayers' ? '#fff' : '#71717a' }
                ]}>
                  {stats.prayers}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveMode('discussions');
              }}
            >
              <Ionicons
                name="chatbubbles"
                size={18}
                color={activeMode === 'discussions' ? '#fff' : '#71717a'}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeMode === 'discussions' ? '#fff' : '#71717a' },
                ]}
              >
                Discussions
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeMode === 'discussions' ? 'rgba(255,255,255,0.3)' : '#e4e4e7' }
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  { color: activeMode === 'discussions' ? '#fff' : '#71717a' }
                ]}>
                  {stats.total - stats.prayers}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {modeCategories.map(renderCategoryTab)}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Pressable
            style={styles.sortButton}
            onPress={() => {
              Haptics.selectionAsync();
              setShowSortMenu(!showSortMenu);
            }}
          >
            <Ionicons name="funnel-outline" size={16} color="#71717a" />
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
            <Ionicons name="chevron-down" size={14} color="#71717a" />
          </Pressable>

          {showSortMenu && (
            <>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowSortMenu(false)}
              />
              <View style={styles.sortMenu}>
                {(['newest', 'popular', 'discussed'] as SortOption[]).map(option => (
                  <Pressable
                    key={option}
                    style={[styles.sortMenuItem, sortBy === option && styles.sortMenuItemActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSortBy(option);
                      setShowSortMenu(false);
                    }}
                  >
                    <Text style={[styles.sortMenuItemText, sortBy === option && styles.sortMenuItemTextActive]}>
                      {option === 'newest' ? 'Newest' : option === 'popular' ? 'Most Liked' : 'Most Discussed'}
                    </Text>
                    {sortBy === option && <Ionicons name="checkmark" size={16} color="#047857" />}
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => { fetchData(); fetchStats(); }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : filteredBySearch.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeMode === 'prayers' ? 'hand-right-outline' : 'chatbubbles-outline'}
                size={48}
                color="#d4d4d8"
              />
              <Text style={styles.emptyStateTitle}>
                {activeCategory === 'all' 
                  ? `No ${activeMode === 'prayers' ? 'prayers' : 'discussions'} yet`
                  : `No ${getCategoryLabel(activeCategory).toLowerCase()} yet`}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeMode === 'prayers' 
                  ? 'Be the first to share a prayer request'
                  : 'Be the first to start a discussion'}
              </Text>
              <Pressable
                style={styles.emptyStateButton}
                onPress={() => setShowNewPostModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>
                  {activeMode === 'prayers' ? 'Share Prayer' : 'Start Discussion'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {pinnedThreads.map(thread => renderThread(thread, true))}
              {regularThreads.map(thread => renderThread(thread, false))}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable onPress={handleFabPress} style={styles.fabButton}>
          <LinearGradient
            colors={['#047857', '#059669']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <NewPostModal
        visible={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        onOptimisticCreate={(tempPost) => {
          focusFeedOnCreatedCategory(tempPost.category);
          setThreads((prev) => sortByNewest(dedupeThreads([tempPost as ThreadWithUser, ...prev])));
        }}
        onCommitCreate={(tempId, persistedPost) => {
          focusFeedOnCreatedCategory(persistedPost.category);
          setThreads((prev) => {
            const withoutTemp = prev.filter((t) => t.id !== tempId);
            return sortByNewest(
              dedupeThreads([persistedPost as ThreadWithUser, ...withoutTemp])
            );
          });
        }}
        onCreateFailed={(tempId) => {
          setThreads((prev) => prev.filter((t) => t.id !== tempId));
        }}
        onSuccess={async (_createdPost: BackendThread) => {
          try {
            await Promise.all([fetchStats(), refreshBookmarks()]);
            showToast('Post shared successfully!', 'success');
          } catch (error) {
            showToast('Post created but some updates are pending. Pull to refresh.', 'warning');
          }
        }}
      />
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
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#09090b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Tab Switcher Styles
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: '#f4f4f5',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#047857',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  categoryTabActive: {
    backgroundColor: '#047857',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#e4e4e7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  countBadgeTextActive: {
    color: '#fff',
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  sortMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717a',
  },
  sortMenu: {
    position: 'absolute',
    top: 44,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortMenuItemActive: {
    backgroundColor: '#f0fdf4',
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#09090b',
  },
  sortMenuItemTextActive: {
    color: '#047857',
    fontWeight: '600',
  },
  content: {
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
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
  time: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#71717a',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
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
    color: '#71717a',
    fontWeight: '500',
  },
  statTextActive: {
    color: '#ef4444',
  },
  prayStatTextActive: {
    color: '#047857',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#047857',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  pinnedCard: {
    borderColor: '#fbbf24',
    borderWidth: 1,
    backgroundColor: '#fffbeb',
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
  authorNameClickable: {
    color: '#047857',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#09090b',
  },
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  fabButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
