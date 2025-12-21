import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, Image, TextInput, Animated, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { CommunityThread, User } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { NewPostModal } from '../components/NewPostModal';
import { COMMUNITY_CATEGORIES, getCategoryIcon, getCategoryLabel, Category } from '../constants/categories';
import { RootStackParamList } from '../types/navigation';

type SortOption = 'newest' | 'popular' | 'discussed';

interface ThreadWithUser extends CommunityThread {
  users?: User | null;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
}

type CommunityNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function CommunityScreen() {
  const navigation = useNavigation<CommunityNavProp>();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [threads, setThreads] = useState<ThreadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, total: 0 });
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [bookmarkedThreadIds, setBookmarkedThreadIds] = useState<Set<string>>(new Set());
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [likeAnimations] = useState<{[key: string]: Animated.Value}>({});
  const fabScale = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBlockedUsers();
    fetchBookmarks();
    fetchData();
    fetchStats();
  }, [user, sortBy]);

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('content_id')
        .eq('userid', user.id)
        .eq('content_type', 'thread');

      if (error) throw error;
      if (data) {
        setBookmarkedThreadIds(new Set(data.map(b => b.content_id)));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) throw error;
      if (data) {
        setBlockedUserIds(data.map(b => b.blocked_id));
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('communitythreads')
        .select('category');

      if (error) throw error;

      const prayerCategories = ['Prayer Requests', 'Pray for Others'];
      const prayers = data?.filter(t => prayerCategories.includes(t.category)).length || 0;
      const testimonies = data?.filter(t => t.category === 'Testimonies').length || 0;

      setStats({
        prayers,
        testimonies,
        total: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('communitythreads')
        .select(`
          *,
          users:userid (
            id,
            username,
            fullname,
            avatarurl
          )
        `);

      if (sortBy === 'newest') {
        query = query.order('createdat', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('like_count', { ascending: false });
      } else if (sortBy === 'discussed') {
        query = query.order('comment_count', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      let threadsWithLikes: ThreadWithUser[] = data || [];

      if (user && threadsWithLikes.length > 0) {
        const { data: likesData } = await supabase
          .from('community_thread_likes')
          .select('thread_id')
          .eq('user_id', user.id)
          .in('thread_id', threadsWithLikes.map(t => t.id));

        const likedThreadIds = new Set(likesData?.map(l => l.thread_id) || []);

        threadsWithLikes = threadsWithLikes.map(thread => ({
          ...thread,
          user_has_liked: likedThreadIds.has(thread.id)
        }));
      }

      if (blockedUserIds.length > 0) {
        threadsWithLikes = threadsWithLikes.filter(t => !blockedUserIds.includes(t.userid));
      }

      setThreads(threadsWithLikes);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError('Unable to load community content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLikeAnimation = (threadId: string) => {
    if (!likeAnimations[threadId]) {
      likeAnimations[threadId] = new Animated.Value(1);
    }
    return likeAnimations[threadId];
  };

  const animateLike = (threadId: string) => {
    const anim = getLikeAnimation(threadId);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLike = async (threadId: string, currentlyLiked: boolean) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to like posts.');
      return;
    }

    animateLike(threadId);

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          user_has_liked: !currentlyLiked,
          like_count: currentlyLiked ? t.like_count - 1 : t.like_count + 1
        };
      }
      return t;
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('community_thread_likes')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_thread_likes')
          .upsert({ thread_id: threadId, user_id: user.id }, { onConflict: 'thread_id,user_id' });
        if (error) throw error;
      }
    } catch (error: any) {
      if (error?.code === '23505') {
        return;
      }
      console.error('Error toggling like:', error);
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            user_has_liked: currentlyLiked,
            like_count: currentlyLiked ? t.like_count + 1 : t.like_count - 1
          };
        }
        return t;
      }));
    }
  };

  const handleReport = async (targetType: 'thread' | 'comment', targetId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to report content.');
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
          onPress: async () => {
            try {
              const { error } = await supabase.from('reports').upsert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: 'Inappropriate content'
              }, { onConflict: 'reporter_id,target_type,target_id' });

              if (error) throw error;
              Alert.alert('Success', 'Thank you for your report. We will review it shortly.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              if (error?.code === '23505') {
                Alert.alert('Already Reported', 'You have already reported this content.');
                return;
              }
              console.error('Error reporting content:', error);
              Alert.alert('Error', 'Unable to submit report. Please try again.');
            }
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

    if (user.id === blockedUserId) {
      Alert.alert('Not Allowed', 'You cannot block yourself.');
      return;
    }

    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer see their posts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('blocked_users').upsert({
                blocker_id: user.id,
                blocked_id: blockedUserId
              }, { onConflict: 'blocker_id,blocked_id' });

              if (error) throw error;

              if (!blockedUserIds.includes(blockedUserId)) {
                setBlockedUserIds([...blockedUserIds, blockedUserId]);
              }
              fetchData();
              Alert.alert('Success', 'User has been blocked.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              if (error?.code === '23505') {
                Alert.alert('Already Blocked', 'You have already blocked this user.');
                return;
              }
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Unable to block user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchStats(), fetchBookmarks()]);
    setRefreshing(false);
  };

  const handleBookmark = async (threadId: string, currentlyBookmarked: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save posts.');
      return;
    }

    const newBookmarked = !currentlyBookmarked;
    setBookmarkedThreadIds(prev => {
      const newSet = new Set(prev);
      if (newBookmarked) {
        newSet.add(threadId);
      } else {
        newSet.delete(threadId);
      }
      return newSet;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (currentlyBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('content_id', threadId)
          .eq('userid', user.id)
          .eq('content_type', 'thread');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ content_id: threadId, userid: user.id, content_type: 'thread' });
        if (error && error.code !== '23505') throw error;
      }
    } catch (error: any) {
      if (error?.code === '23505') return;
      console.error('Error toggling bookmark:', error);
      setBookmarkedThreadIds(prev => {
        const newSet = new Set(prev);
        if (currentlyBookmarked) {
          newSet.add(threadId);
        } else {
          newSet.delete(threadId);
        }
        return newSet;
      });
    }
  };

  const handleSharePost = async (thread: ThreadWithUser) => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: thread.title,
        message: `${thread.title}\n\n${thread.content.substring(0, 200)}${thread.content.length > 200 ? '...' : ''}\n\nShared from GKP Radio Community`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeletePost = async (threadId: string, threadUserId: string) => {
    if (!user || user.id !== threadUserId) {
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
              const { error } = await supabase
                .from('communitythreads')
                .delete()
                .eq('id', threadId);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Deleted', 'Your post has been deleted.');
              fetchData();
              fetchStats();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Unable to delete post. Please try again.');
            }
          }
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredThreads = activeCategory === 'all' 
    ? threads 
    : threads.filter(t => t.category === activeCategory);

  const renderCategoryTab = (category: typeof COMMUNITY_CATEGORIES[0]) => {
    const isActive = activeCategory === category.id;
    const count = category.id === 'all' 
      ? threads.length 
      : threads.filter(t => t.category === category.id).length;

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

  const navigateToUserProfile = (userId: string, userData?: User | null) => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('UserProfile', { userId, user: userData || undefined });
  };

  const filteredBySearch = searchQuery.trim() 
    ? filteredThreads.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredThreads;

  const pinnedThreads = filteredBySearch.filter(t => t.ispinned);
  const regularThreads = filteredBySearch.filter(t => !t.ispinned);

  const renderThread = (thread: ThreadWithUser, isPinned = false) => {
    const authorName = thread.is_anonymous 
      ? 'Anonymous' 
      : thread.users?.fullname || thread.users?.username || 'Member';
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
              onPress={() => handleLike(thread.id, thread.user_has_liked || false)}
            >
              <Animated.View style={{ transform: [{ scale: getLikeAnimation(thread.id) }] }}>
                <Ionicons 
                  name={thread.user_has_liked ? "heart" : "heart-outline"} 
                  size={18} 
                  color={thread.user_has_liked ? "#ef4444" : "#71717a"} 
                />
              </Animated.View>
              <Text style={[styles.statText, thread.user_has_liked && styles.statTextActive]}>
                {thread.like_count || 0}
              </Text>
            </Pressable>
            <View style={styles.statButton}>
              <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
              <Text style={styles.statText}>{thread.comment_count || 0}</Text>
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
              onPress={() => handleBookmark(thread.id, bookmarkedThreadIds.has(thread.id))} 
              style={styles.actionButton}
            >
              <Ionicons 
                name={bookmarkedThreadIds.has(thread.id) ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={bookmarkedThreadIds.has(thread.id) ? "#047857" : "#a1a1aa"} 
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

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {COMMUNITY_CATEGORIES.map(renderCategoryTab)}
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
                name={getCategoryIcon(activeCategory)} 
                size={48} 
                color="#d4d4d8" 
              />
              <Text style={styles.emptyStateTitle}>
                No {activeCategory === 'all' ? 'posts' : getCategoryLabel(activeCategory).toLowerCase()} yet
              </Text>
              <Text style={styles.emptyStateText}>
                Be the first to share with the community
              </Text>
              <Pressable 
                style={styles.emptyStateButton}
                onPress={() => setShowNewPostModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Post</Text>
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
        onSuccess={() => {
          fetchData();
          fetchStats();
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
