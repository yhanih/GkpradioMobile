import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, TextInput, Animated, Share, Modal, useWindowDimensions, FlatList, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BackendThread,
  blockCommunityUser,
  deleteCommunityPost,
  fetchCommunityPosts,
  fetchUnreadNotificationCount,
  getCommunityStats,
  togglePostReaction,
} from '../lib/backend';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { NewPostModal } from '../components/NewPostModal';
import { ReportContentModal } from '../components/ReportContentModal';
import {
  COMMUNITY_CATEGORIES,
  PostType,
  getCategoryIcon,
  getCategoryLabel,
  getPostTypeForCategory,
  isPrayerCategory,
  Category,
} from '../constants/categories';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useToast } from '../components/Toast';
import { openPostOverflowMenu } from '../utils/contentOverflowMenu';
import { REPORT_SUBMITTED_ALERT } from '../constants/reportReasons';
import { PostCard } from '../components/PostCard';
import { NotificationBadge } from '../components/NotificationBadge';
import { HELP_DESK_EMAIL } from '../constants/contact';

const COMMUNITY_SAFETY_MESSAGE =
  'Please refrain from making any monetary donations or transactions to other user(s) or member(s) while using this platform. This ministry is dedicated to uplifting, encouraging, and educating.';

type SortOption = 'newest' | 'popular' | 'discussed';
type ModeType = 'prayers' | 'discussions';

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
    avatarseed?: string | null;
  } | null;
}

type CommunityNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
type CommunityRouteProp = RouteProp<MainTabParamList, 'Community'>;

export function CommunityScreen() {
  const navigation = useNavigation<CommunityNavProp>();
  const route = useRoute<CommunityRouteProp>();
  const { user, acceptCommunityTerms } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createCommunityStyles(theme), [theme]);
  const { isBookmarked, toggleBookmark, refreshBookmarks } = useBookmarks();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [activeMode, setActiveMode] = useState<ModeType>('discussions');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [threads, setThreads] = useState<ThreadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showTermsGate, setShowTermsGate] = useState(false);
  const [termsAgreeChecked, setTermsAgreeChecked] = useState(false);
  const [termsAccepting, setTermsAccepting] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [likingThreadId, setLikingThreadId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const fabScale = useRef(new Animated.Value(1)).current;
  const sortByRef = useRef(sortBy);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingMoreRef = useRef(false);

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

  const sortThreads = useCallback((items: ThreadWithUser[], sortOpt: SortOption) => {
    const deduplicated = dedupeThreads(items);
    if (sortOpt === 'popular') {
      return [...deduplicated].sort(
        (a, b) =>
          Math.max(b.prayer_count || 0, b.like_count || 0) - Math.max(a.prayer_count || 0, a.like_count || 0) ||
          new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
      );
    } else if (sortOpt === 'discussed') {
      return [...deduplicated].sort(
        (a, b) => (b.comment_count || 0) - (a.comment_count || 0) ||
        new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
      );
    } else {
      return [...deduplicated].sort((a, b) => {
        const aTime = new Date(a.createdat).getTime() || 0;
        const bTime = new Date(b.createdat).getTime() || 0;
        return bTime - aTime;
      });
    }
  }, [dedupeThreads]);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

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

  useEffect(() => {
    if (!user?.id) {
      setShowTermsGate(false);
      return;
    }
    setShowTermsGate(!user.terms_accepted_at);
    if (!user.terms_accepted_at) {
      setTermsAgreeChecked(false);
    }
  }, [user?.id, user?.terms_accepted_at]);

  const handleAcceptCommunityTerms = async () => {
    if (!termsAgreeChecked) {
      Alert.alert(
        'Terms required',
        'Please confirm you are at least 18 and agree to the Terms of Service & Community Guidelines.'
      );
      return;
    }
    setTermsAccepting(true);
    const { error } = await acceptCommunityTerms();
    setTermsAccepting(false);
    if (error) {
      Alert.alert('Could not continue', error.message || 'Please try again.');
      return;
    }
    setShowTermsGate(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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

      const targetPostType = activeCategory === 'all'
        ? (activeMode === 'prayers' ? 'prayer' : 'discussion' as PostType)
        : getPostTypeForCategory(activeCategory);

      const PAGE_SIZE = 15;
      const data = await fetchCommunityPosts(
        sortBy,
        user?.id,
        1,
        PAGE_SIZE,
        activeCategory,
        targetPostType
      );
      console.log(`[CommunityScreen] Posts fetched: ${data.length}`);
      const ordered = sortThreads(data as ThreadWithUser[], sortBy);
      setThreads(ordered);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('[CommunityScreen] Error fetching community data:', err);
      if (err.stack) console.error(err.stack);
      setError('Unable to load community content. Please try again.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [dedupeThreads, sortThreads, sortBy, user?.id, activeCategory, activeMode]);

  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore || isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    console.log(`[CommunityScreen] loadNextPage called. Loading page: ${page + 1}`);
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const targetPostType = activeCategory === 'all'
        ? (activeMode === 'prayers' ? 'prayer' : 'discussion' as PostType)
        : getPostTypeForCategory(activeCategory);

      const PAGE_SIZE = 15;
      const data = await fetchCommunityPosts(
        sortBy,
        user?.id,
        nextPage,
        PAGE_SIZE,
        activeCategory,
        targetPostType
      );
      console.log(`[CommunityScreen] Page ${nextPage} fetched: ${data.length} posts`);

      if (data.length > 0) {
        setThreads(prev => sortThreads([...prev, ...data] as ThreadWithUser[], sortBy));
        setPage(nextPage);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('[CommunityScreen] Error loading next page:', err);
    } finally {
      isLoadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, sortBy, user?.id, activeCategory, activeMode, sortThreads]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
      refreshBookmarks();
      if (user?.id) {
        fetchUnreadNotificationCount(user.id).then(setUnreadNotificationCount).catch(() => undefined);
      } else {
        setUnreadNotificationCount(0);
      }
    }, [fetchData, refreshBookmarks, user?.id])
  );

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationCount(0);
      return;
    }

    const refreshUnreadCount = () => {
      fetchUnreadNotificationCount(user.id).then(setUnreadNotificationCount).catch(() => undefined);
    };

    refreshUnreadCount();

    const channel = supabase
      .channel(`community-notifications-${user.id}-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        refreshUnreadCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);



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

    const channel = supabase.channel(`community-feed-realtime-${Math.random().toString(36).substring(2, 9)}`);
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, queueRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, queueRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, queueRealtimeRefresh);
    if (user?.id) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_users',
          filter: `blocker_id=eq.${user.id}`,
        },
        queueRealtimeRefresh
      );
    }
    channel.subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchStats, user?.id]);

  const handleLike = useCallback(async (threadId: string, currentlyLiked: boolean) => {
    if (!user) {
      showToast('Please sign in to like posts', 'info');
      return;
    }

    if (likingThreadId === threadId) {
      return;
    }

    setLikingThreadId(threadId);

    setThreads(prev => {
      const currentThread = prev.find(t => t.id === threadId);
      const currentCount = currentThread?.like_count ?? 0;
      const newCount = currentlyLiked ? Math.max(currentCount - 1, 0) : currentCount + 1;
      return prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            user_has_liked: !currentlyLiked,
            like_count: newCount
          };
        }
        return t;
      });
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await togglePostReaction(threadId, user.id, 'like');
    } catch (error: any) {
      console.error('Error toggling like:', error);
      setThreads(prev => {
        return prev.map(t => {
          if (t.id === threadId) {
            const prevLiked = currentlyLiked;
            const prevCount = t.like_count + (currentlyLiked ? 1 : -1);
            return {
              ...t,
              user_has_liked: prevLiked,
              like_count: prevCount
            };
          }
          return t;
        });
      });
      showToast('Unable to update like. Please try again.', 'error');
    } finally {
      setLikingThreadId(null);
    }
  }, [user, likingThreadId, showToast]);

  const handlePray = useCallback(async (threadId: string, currentlyPrayed: boolean) => {
    if (!user) {
      showToast('Please sign in to pray with the community', 'info');
      return;
    }

    if (likingThreadId === threadId) {
      return;
    }

    setLikingThreadId(threadId);

    setThreads(prev => {
      const currentThread = prev.find(t => t.id === threadId);
      const currentCount = currentThread?.prayer_count ?? 0;
      const newCount = currentlyPrayed ? Math.max(currentCount - 1, 0) : currentCount + 1;
      return prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            user_has_prayed: !currentlyPrayed,
            prayer_count: newCount
          };
        }
        return t;
      });
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await togglePostReaction(threadId, user.id, 'pray');
    } catch (error: any) {
      console.error('Error toggling prayer reaction:', error);
      setThreads(prev => {
        return prev.map(t => {
          if (t.id === threadId) {
            const prevPrayed = currentlyPrayed;
            const prevCount = t.prayer_count + (currentlyPrayed ? 1 : -1);
            return {
              ...t,
              user_has_prayed: prevPrayed,
              prayer_count: prevCount
            };
          }
          return t;
        });
      });
      showToast('Unable to update prayer response. Please try again.', 'error');
    } finally {
      setLikingThreadId(null);
    }
  }, [user, likingThreadId, showToast]);

  const handleReportPost = useCallback((postId: string) => {
    if (!user) {
      showToast('Please sign in to report content', 'info');
      return;
    }
    setReportPostId(postId);
  }, [user, showToast]);

  const handleBlockUser = useCallback((blockedUserId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to block users.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login', { redirectBack: true }) },
      ]);
      return;
    }
    if (String(user.id) === String(blockedUserId)) {
      showToast('You cannot block yourself', 'info');
      return;
    }

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
              await blockCommunityUser(user.id, blockedUserId);
              setThreads((prev) => prev.filter((t) => String(t.userid) !== String(blockedUserId)));
              await fetchData(true);
              showToast('Member blocked — their posts are hidden from your feed', 'success');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              showToast(e?.message || 'Unable to block member', 'error');
            }
          },
        },
      ]
    );
  }, [user, navigation, showToast, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchStats(), refreshBookmarks()]);
    setRefreshing(false);
  };

  const handleBookmarkToggle = useCallback(async (threadId: string) => {
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
  }, [user, toggleBookmark, showToast]);

  const handleSharePost = useCallback(async (thread: ThreadWithUser) => {
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
  }, [showToast]);

  const handleDeletePost = useCallback(async (threadId: string, threadUserId: string) => {
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
            } catch (error: any) {
              console.error('Error deleting post:', error);
              const message =
                error?.message ||
                (error instanceof Error ? error.message : 'Unable to delete post. Please try again.');
              showToast(message, 'error');
            }
          },
        }
      ]
    );
  }, [user, showToast, fetchStats]);

  const handleThreadOverflowMenu = useCallback((thread: ThreadWithUser) => {
    if (!user) {
      showToast('Please sign in', 'info');
      return;
    }
    Haptics.selectionAsync();
    const isOwn = String(user.id) === String(thread.userid);
    openPostOverflowMenu(isOwn, (choice) => {
      if (choice === 'delete') {
        handleDeletePost(thread.id, thread.userid);
      } else if (choice === 'report') {
        handleReportPost(thread.id);
      } else if (choice === 'block') {
        handleBlockUser(thread.userid);
      }
    });
  }, [user, showToast, handleDeletePost, handleReportPost, handleBlockUser]);

  const handleFabPress = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to create a community post.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login', { redirectBack: true }) },
      ]);
      return;
    }
    if (!user.terms_accepted_at) {
      setShowTermsGate(true);
      return;
    }
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

  useEffect(() => {
    const categoryId = route.params?.categoryId;
    if (!categoryId) return;

    const requestedMode = route.params?.mode;
    const derivedMode = requestedMode ?? (isPrayerCategory(categoryId) ? 'prayers' : 'discussions');

    setSortBy('newest');
    setActiveMode(derivedMode);
    setActiveCategory(categoryId);
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, [route.params?.categoryId, route.params?.mode]);

  const formatTimeAgo = useCallback((dateString: string) => {
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
  }, []);

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

  const modeCategories = useMemo(() => COMMUNITY_CATEGORIES, []);

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
          if (category.id === 'all') {
            setActiveMode('discussions');
          } else {
            setActiveMode(isPrayerCategory(category.id) ? 'prayers' : 'discussions');
          }
        }}
      >
        <Ionicons
          name={isActive ? category.iconActive : category.icon}
          size={18}
          color={isActive ? '#fff' : theme.colors.textMuted}
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

  const navigateToPost = useCallback((thread: ThreadWithUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: thread.id, thread });
  }, [navigation]);

  const navigateToUserProfile = useCallback((userId: string, userData?: { id: string; fullname: string | null; avatarurl: string | null } | null) => {
    if (!userId || userId.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('UserProfile', { userId, user: userData ? { ...userData, username: '' } as any : undefined });
  }, [navigation]);

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

  const handleCommentPress = useCallback((thread: ThreadWithUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: thread.id, thread, focusReply: true });
  }, [navigation]);

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'Newest';
      case 'popular': return 'Most Liked';
      case 'discussed': return 'Most Discussed';
      default: return 'Newest';
    }
  };  const combinedThreads = useMemo(() => {
    if (loading || error) return [];
    const pinned = pinnedThreads.map(t => ({ ...t, isPinnedItem: true }));
    const regular = regularThreads.map(t => ({ ...t, isPinnedItem: false }));
    return [...pinned, ...regular];
  }, [pinnedThreads, regularThreads, loading, error]);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title} accessibilityRole="header">
            Community
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('Notifications');
              }}
              style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="View notifications"
            >
              <Ionicons name="notifications-outline" size={26} color={theme.colors.primary} />
              {user ? <NotificationBadge count={unreadNotificationCount} /> : null}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowSafetyModal(true);
              }}
              style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Community safety guidelines"
            >
              <Ionicons name="shield-checkmark-outline" size={26} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Share testimonies, lift prayers, and encourage one another
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setShowSafetyModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Read full community safety guidelines"
        >
          <Text style={styles.safetyHint}>
            No peer-to-peer payments or donations between members.{' '}
            <Text style={styles.safetyHintLink}>Details</Text>
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            style={styles.searchButton}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <View style={[styles.statIconContainer, { backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)' }]}>
            <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.prayers}</Text>
          <Text style={styles.statLabel}>Prayers</Text>
        </View>
        <View style={styles.statBox}>
          <View style={[styles.statIconContainer, { backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
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
          <View style={[styles.statIconContainer, { backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(4, 120, 87, 0.1)' }]}>
            <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.statLabel, { marginTop: 4, fontWeight: '700', color: theme.colors.primary }]}>New Post</Text>
        </Pressable>
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
          <Ionicons name="funnel-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
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
                  {sortBy === option && <Ionicons name="checkmark" size={16} color={theme.colors.primary} />}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );

  const renderEmptyComponent = () => {
    if (error) {
      return (
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => { fetchData(); fetchStats(); }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    if (loading) {
      return (
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons
            name={activeMode === 'prayers' ? 'hand-right-outline' : 'chatbubbles-outline'}
            size={48}
            color={theme.colors.border}
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
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: ThreadWithUser & { isPinnedItem: boolean } }) => (
    <View style={styles.content}>
      <PostCard
        thread={item}
        isPinned={item.isPinnedItem}
        theme={theme}
        isBookmarked={isBookmarked('thread', item.id)}
        onPress={navigateToPost}
        onPressAuthor={navigateToUserProfile}
        onLike={handleLike}
        onPray={handlePray}
        onCommentPress={handleCommentPress}
        onBookmarkToggle={handleBookmarkToggle}
        onShare={handleSharePost}
        onOverflowMenu={handleThreadOverflowMenu}
        formatTimeAgo={formatTimeAgo}
      />
    </View>
  ), [theme, isBookmarked, navigateToPost, navigateToUserProfile, handleLike, handlePray, handleCommentPress, handleBookmarkToggle, handleSharePost, handleThreadOverflowMenu, formatTimeAgo, styles.content]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={combinedThreads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={
          <View style={{ paddingBottom: 120, alignItems: 'center', justifyContent: 'center' }}>
            {loadingMore && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginVertical: 15 }}
              />
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        style={styles.scrollView}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.5}
      />

      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable onPress={handleFabPress} style={styles.fabButton}>
          <LinearGradient
            colors={[theme.colors.primary, '#059669']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Modal
        visible={showSafetyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.safetyModalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSafetyModal(false)}
            accessibilityLabel="Dismiss"
          />
          <View style={styles.safetyModalCard}>
            <View style={styles.safetyModalHeader}>
              <View style={styles.safetyModalTitleRow}>
                <Ionicons name="shield-checkmark" size={22} color={theme.colors.primary} />
                <Text style={styles.safetyModalTitle}>Community safety</Text>
              </View>
              <Pressable
                onPress={() => setShowSafetyModal(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.safetyModalBody}>{COMMUNITY_SAFETY_MESSAGE}</Text>
            <Text style={styles.safetyModalBody}>
              Report objectionable content with the ⋯ menu on any post. For urgent safety issues,
              email {HELP_DESK_EMAIL}.
            </Text>
            <Pressable
              style={styles.safetyModalSecondaryButton}
              onPress={() => {
                Haptics.selectionAsync();
                setShowSafetyModal(false);
                navigation.navigate('TermsOfService');
              }}
            >
              <Text style={styles.safetyModalSecondaryButtonText}>Community Guidelines</Text>
            </Pressable>
            <Pressable
              style={styles.safetyModalButton}
              onPress={() => {
                Haptics.selectionAsync();
                setShowSafetyModal(false);
              }}
            >
              <Text style={styles.safetyModalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(user && showTermsGate)}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.safetyModalRoot}>
          <View style={styles.safetyModalCard}>
            <View style={styles.safetyModalHeader}>
              <View style={styles.safetyModalTitleRow}>
                <Ionicons name="document-text" size={22} color={theme.colors.primary} />
                <Text style={styles.safetyModalTitle}>Community access</Text>
              </View>
            </View>
            <Text style={styles.safetyModalBody}>
              Community features are for adults (18+). You must agree to our Terms of Service &
              Community Guidelines, including zero tolerance for objectionable content and abusive
              users, before posting or interacting.
            </Text>
            <Pressable
              style={styles.termsGateRow}
              onPress={() => setTermsAgreeChecked((prev) => !prev)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAgreeChecked }}
            >
              <View style={[styles.termsGateCheckbox, termsAgreeChecked && styles.termsGateCheckboxChecked]}>
                {termsAgreeChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.termsGateLabel}>
                I am 18+ and agree to the{' '}
                <Text
                  style={styles.safetyHintLink}
                  onPress={() => navigation.navigate('TermsOfService')}
                >
                  Terms & Community Guidelines
                </Text>
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.safetyModalButton,
                (!termsAgreeChecked || termsAccepting) && styles.safetyModalButtonDisabled,
              ]}
              onPress={handleAcceptCommunityTerms}
              disabled={!termsAgreeChecked || termsAccepting}
            >
              {termsAccepting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.safetyModalButtonText}>Continue to Community</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <NewPostModal
        visible={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        defaultPostType={activeMode === 'prayers' ? 'prayer' : 'discussion'}
        onOptimisticCreate={(tempPost) => {
          focusFeedOnCreatedCategory(tempPost.category);
          setThreads((prev) => sortThreads([tempPost as ThreadWithUser, ...prev], sortByRef.current));
        }}
        onCommitCreate={(tempId, persistedPost) => {
          focusFeedOnCreatedCategory(persistedPost.category);
          setThreads((prev) => {
            const withoutTemp = prev.filter((t) => t.id !== tempId);
            return sortThreads(
              [persistedPost as ThreadWithUser, ...withoutTemp],
              sortByRef.current
            );
          });
        }}
        onCreateFailed={(tempId) => {
          setThreads((prev) => prev.filter((t) => t.id !== tempId));
        }}
        onSuccess={async (createdPost: BackendThread) => {
          try {
            await Promise.all([fetchStats(), refreshBookmarks()]);
            showToast('Post shared successfully!', 'success');
            navigation.navigate('PostDetail', { threadId: createdPost.id, thread: createdPost });
          } catch (error) {
            showToast('Post created but some updates are pending. Pull to refresh.', 'warning');
          }
        }}
      />

      <ReportContentModal
        visible={Boolean(user && reportPostId)}
        onClose={() => setReportPostId(null)}
        reporterId={user?.id ?? ''}
        targetType="post"
        targetId={reportPostId ?? ''}
        onSubmitted={() =>
          Alert.alert(REPORT_SUBMITTED_ALERT.title, REPORT_SUBMITTED_ALERT.message)
        }
      />
    </SafeAreaView>
  );
}

function createCommunityStyles(theme: Theme) {
  const pinBg = theme.dark ? 'rgba(251, 191, 36, 0.12)' : '#fffbeb';
  const pinBorder = theme.dark ? 'rgba(245, 158, 11, 0.45)' : '#fbbf24';

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(4, 120, 87, 0.08)',
  },
  headerIconButtonPressed: {
    opacity: 0.75,
  },
  safetyInfoButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(4, 120, 87, 0.08)',
  },
  safetyInfoButtonPressed: {
    opacity: 0.75,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  safetyHint: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  safetyHintLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  safetyModalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  safetyModalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: theme.dark ? 1 : 0,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: theme.dark ? 0.35 : 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  safetyModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  safetyModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  safetyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  safetyModalBody: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  safetyModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  safetyModalButtonDisabled: {
    opacity: 0.55,
  },
  safetyModalSecondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  safetyModalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  termsGateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  termsGateCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsGateCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsGateLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  safetyModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.dark ? 0.2 : 0.04,
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
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.borderLight,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.borderLight,
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: theme.colors.border,
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
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.borderLight,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  sortMenu: {
    position: 'absolute',
    top: 44,
    left: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortMenuItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  sortMenuItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sortMenuItemTextActive: {
    color: theme.colors.primary,
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
    color: theme.colors.textMuted,
  },
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
    backgroundColor: theme.colors.borderLight,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
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
  authorNameClickable: {
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
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
    shadowColor: theme.colors.primary,
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
}
