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
import { User, CommunityThread } from '../types/database.types';
import { RootStackParamList } from '../types/navigation';
import { getCategoryIcon, getCategoryLabel } from '../constants/categories';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

interface ThreadWithUser extends CommunityThread {
  users?: User | null;
}

export function UserProfileScreen() {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();

  const [userProfile, setUserProfile] = useState<User | null>(route.params.user || null);
  const [posts, setPosts] = useState<ThreadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, prayers: 0, testimonies: 0 });

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', route.params.userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [route.params.userId]);

  const fetchUserPosts = useCallback(async () => {
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
        .eq('userid', route.params.userId)
        .eq('is_anonymous', false)
        .order('createdat', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);

      const prayers = data?.filter(t => t.category === 'Prayer Requests').length || 0;
      const testimonies = data?.filter(t => t.category === 'Testimonies').length || 0;

      setStats({
        posts: data?.length || 0,
        prayers,
        testimonies,
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  }, [route.params.userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    setLoading(false);
  }, [fetchUserProfile, fetchUserPosts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
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

  const formatJoinDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Member';
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  const navigateToPost = (thread: ThreadWithUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: thread.id, thread });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#09090b" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#09090b" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#d4d4d8" />
          <Text style={styles.errorText}>User not found</Text>
          <Pressable style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#09090b" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        <View style={styles.profileHeader}>
          {userProfile.avatarurl ? (
            <Image source={{ uri: userProfile.avatarurl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#71717a" />
            </View>
          )}
          
          <Text style={styles.fullName}>
            {userProfile.fullname || userProfile.username || 'Community Member'}
          </Text>
          
          {userProfile.username && (
            <Text style={styles.username}>@{userProfile.username}</Text>
          )}
          
          <Text style={styles.joinDate}>{formatJoinDate(userProfile.created_at)}</Text>
          
          {userProfile.bio && (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.prayers}</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.testimonies}</Text>
            <Text style={styles.statLabel}>Testimonies</Text>
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>Posts</Text>
          
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={36} color="#d4d4d8" />
              <Text style={styles.emptyPostsText}>No public posts yet</Text>
            </View>
          ) : (
            posts.map(post => (
              <Pressable
                key={post.id}
                style={styles.postCard}
                onPress={() => navigateToPost(post)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postCategory}>
                    <Ionicons
                      name={getCategoryIcon(post.category)}
                      size={12}
                      color="#047857"
                    />
                    <Text style={styles.postCategoryText}>{getCategoryLabel(post.category)}</Text>
                  </View>
                  <Text style={styles.postTime}>{formatTimeAgo(post.createdat)}</Text>
                </View>
                
                <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
                
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={16} color="#71717a" />
                    <Text style={styles.postStatText}>{post.like_count || 0}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={16} color="#71717a" />
                    <Text style={styles.postStatText}>{post.comment_count || 0}</Text>
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
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#09090b',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#71717a',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#3f3f46',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    padding: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e4e4e7',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPostsText: {
    fontSize: 15,
    color: '#71717a',
    marginTop: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#047857',
  },
  postTime: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    lineHeight: 22,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#71717a',
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
    color: '#71717a',
  },
});
