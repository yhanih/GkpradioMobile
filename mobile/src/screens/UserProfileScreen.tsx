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
import { wpClient, WPUser, WPTestimony } from '../lib/wordpress';
import { RootStackParamList } from '../types/navigation';
import { getCategoryIcon, getCategoryLabel } from '../constants/categories';
import { useTheme } from '../contexts/ThemeContext';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen() {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { theme } = useTheme();

  const [userProfile, setUserProfile] = useState<WPUser | null>(route.params.user || null);
  const [testimonies, setTestimonies] = useState<WPTestimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, testimonies: 0 });

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data, error } = await wpClient.getUserById(route.params.userId);
      if (error) throw new Error(error);
      if (data) setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [route.params.userId]);

  const fetchUserTestimonies = useCallback(async () => {
    try {
      const { data, error } = await wpClient.getTestimonies(20, 1, route.params.userId);
      if (error) throw new Error(error);
      
      const items = data || [];
      setTestimonies(items);
      setStats({
        posts: items.length,
        testimonies: items.length,
      });
    } catch (error) {
      console.error('Error fetching user testimonies:', error);
    }
  }, [route.params.userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUserProfile(), fetchUserTestimonies()]);
    setLoading(false);
  }, [fetchUserProfile, fetchUserTestimonies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserTestimonies()]);
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

  const navigateToPost = (testimony: WPTestimony) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: testimony.id, testimony });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color={theme.colors.textMuted} />
          <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>User not found</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = userProfile.avatar_urls?.['96'];
  const displayName = userProfile.name || userProfile.nickname || 'Community Member';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.profileHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={theme.colors.textMuted} />
            </View>
          )}
          
          <Text style={[styles.fullName, { color: theme.colors.text }]}>
            {displayName}
          </Text>
          
          <Text style={[styles.username, { color: theme.colors.textMuted }]}>@{userProfile.username || userProfile.nickname}</Text>
          
          {userProfile.description && (
            <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{userProfile.description}</Text>
          )}
        </View>

        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.testimonies}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Testimonies</Text>
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={[styles.postsTitle, { color: theme.colors.text }]}>Public Testimonies</Text>
          
          {testimonies.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyPostsText, { color: theme.colors.textMuted }]}>No public testimonies yet</Text>
            </View>
          ) : (
            testimonies.map(testimony => (
              <Pressable
                key={testimony.id}
                style={[styles.postCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigateToPost(testimony)}
              >
                <View style={styles.postHeader}>
                  <Text style={[styles.postTime, { color: theme.colors.textMuted }]}>{formatTimeAgo(testimony.date)}</Text>
                </View>
                
                <Text style={[styles.postTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {testimony.title.rendered}
                </Text>
                <Text style={[styles.postContent, { color: theme.colors.textMuted }]} numberOfLines={2}>
                  {testimony.content.rendered.replace(/<[^>]*>?/gm, '')}
                </Text>
                
                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.postStatText, { color: theme.colors.textMuted }]}>{testimony.like_count || 0}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.postStatText, { color: theme.colors.textMuted }]}>{testimony.comment_count || 0}</Text>
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
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
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
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    marginBottom: 4,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPostsText: {
    fontSize: 15,
    marginTop: 12,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  postTime: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
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
  },
});
