import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { CommunityThread, User } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { NewPostModal } from '../components/NewPostModal';

type TabType = 'prayers' | 'testimonies';

interface ThreadWithUser extends CommunityThread {
  users?: User | null;
  user_has_liked?: boolean;
}

export function CommunityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('prayers');
  const [threads, setThreads] = useState<ThreadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, users: 0 });
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  useEffect(() => {
    fetchBlockedUsers();
    fetchData();
    fetchStats();
  }, [user]);

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

      const prayers = data?.filter(t => t.category === 'Prayers').length || 0;
      const testimonies = data?.filter(t => t.category === 'Testimonies').length || 0;

      setStats({
        prayers,
        testimonies,
        users: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Unable to load statistics. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch threads with user information
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
        .order('createdat', { ascending: false })
        .limit(50);

      if (error) throw error;

      let threadsWithLikes: ThreadWithUser[] = data || [];

      // Fetch user's likes if logged in
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

      // Filter blocked users
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

  const handleLike = async (threadId: string, currentlyLiked: boolean) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to like posts.');
      return;
    }

    // Optimistic UI update
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
        // Unlike
        await supabase
          .from('community_thread_likes')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('community_thread_likes')
          .insert({ thread_id: threadId, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
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
              const { error } = await supabase.from('reports').insert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: 'Inappropriate content'
              });

              if (error) throw error;
              Alert.alert('Success', 'Thank you for your report. We will review it shortly.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
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

    if (user.id === blockedUserId) return;

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
              const { error } = await supabase.from('blocked_users').insert({
                blocker_id: user.id,
                blocked_id: blockedUserId
              });

              if (error) throw error;

              setBlockedUserIds([...blockedUserIds, blockedUserId]);
              fetchData(); // Refresh content
              Alert.alert('Success', 'User has been blocked.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
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
    await Promise.all([fetchData(), fetchStats()]);
    setRefreshing(false);
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

  const renderThread = (thread: CommunityThread) => (
    <Pressable
      key={thread.id}
      style={styles.card}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={styles.cardHeader}>
        <Ionicons
          name={thread.category === 'Prayers' ? "hand-right" : "sparkles"}
          size={20}
          color="#047857"
        />
        <Text style={styles.category}>{thread.category === 'Prayers' ? 'Prayer Request' : 'Testimony'}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {thread.title}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {thread.content}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.time}>{formatTimeAgo(thread.createdat)}</Text>
        <View style={styles.cardActions}>
          <Pressable onPress={() => handleReport('thread', thread.id)} style={styles.actionButton}>
            <Ionicons name="flag-outline" size={18} color="#71717a" />
          </Pressable>
          <Pressable onPress={() => handleBlock(thread.userid)} style={styles.actionButton}>
            <Ionicons name="eye-off-outline" size={18} color="#71717a" />
          </Pressable>
          <Ionicons name="heart-outline" size={18} color="#71717a" />
          <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
        </View>
      </View>
    </Pressable>
  );

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
              // Handle new post logic here
            }}
          >
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(4, 120, 87, 0.1)' }]}>
              <Ionicons name="add-circle" size={24} color="#047857" />
            </View>
            <Text style={[styles.statLabel, { marginTop: 4, fontWeight: '700', color: '#047857' }]}>New Post</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'prayers' && styles.activeTab]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('prayers');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'prayers' && styles.activeTabText]}>
              Prayer Requests
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'testimonies' && styles.activeTab]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('testimonies');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'testimonies' && styles.activeTabText]}>
              Testimonies
            </Text>
          </Pressable>
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
          ) : (
            <>
              {activeTab === 'prayers' && (
                <>
                  {threads.filter(t => t.category === 'Prayers').length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="hand-right-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No prayer requests yet</Text>
                      <Text style={styles.emptyStateText}>
                        Be the first to share a prayer request with the community
                      </Text>
                    </View>
                  ) : (
                    threads.filter(t => t.category === 'Prayers').map(renderThread)
                  )}
                </>
              )}

              {activeTab === 'testimonies' && (
                <>
                  {threads.filter(t => t.category === 'Testimonies').length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="sparkles-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No testimonies yet</Text>
                      <Text style={styles.emptyStateText}>
                        Share how God has worked in your life
                      </Text>
                    </View>
                  ) : (
                    threads.filter(t => t.category === 'Testimonies').map(renderThread)
                  )}
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
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
    marginBottom: 24,
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  activeTab: {
    backgroundColor: '#047857',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  activeTabText: {
    color: '#fff',
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
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  featuredBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
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
  },
  time: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
});
