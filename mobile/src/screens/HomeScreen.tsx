import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Podcast, Video, Testimony } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

export function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, content: 0 });
  const [featuredContent, setFeaturedContent] = useState<(Podcast | Video | Testimony)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [prayersCount, podcastsCount, videosCount, featuredPodcasts, featuredVideos] = await Promise.all([
        supabase.from('prayercircles').select('id', { count: 'exact', head: true }),
        supabase.from('episodes').select('id', { count: 'exact', head: true }),
        supabase.from('videos').select('id', { count: 'exact', head: true }),
        supabase.from('episodes').select('*').eq('is_featured', true).limit(2),
        supabase.from('videos').select('*').eq('is_featured', true).limit(2),
      ]);

      if (prayersCount.error) throw prayersCount.error;
      if (podcastsCount.error) throw podcastsCount.error;
      if (videosCount.error) throw videosCount.error;
      if (featuredPodcasts.error) throw featuredPodcasts.error;
      if (featuredVideos.error) throw featuredVideos.error;

      setStats({
        prayers: prayersCount.count || 0,
        testimonies: 0,
        content: (podcastsCount.count || 0) + (videosCount.count || 0),
      });

      const combined = [
        ...(featuredPodcasts.data || []),
        ...(featuredVideos.data || []),
      ];
      setFeaturedContent(combined.slice(0, 3));
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Unable to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0]);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchUserProfile()]);
    setRefreshing(false);
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
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#047857', '#059669', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>GKP</Text>
                  </View>
                  <View>
                    <Text style={styles.welcomeText}>
                      {getGreeting()}{userName ? `, ${userName}` : ''}!
                    </Text>
                    <Text style={styles.radioName}>Kingdom Principles Radio</Text>
                  </View>
                </View>
                <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.7)" />
              </View>

              <Text style={styles.tagline}>
                Broadcasting Truth • Building Community • Transforming Lives
              </Text>

              <Pressable style={styles.liveButton}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveButtonText}>Listen Live Now</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <ActivityIndicator size="large" color="#047857" style={{ paddingVertical: 20 }} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#047857', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <Ionicons name="heart" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{stats.prayers}</Text>
                <Text style={styles.statLabel}>Prayers</Text>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#a855f7', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <Ionicons name="sparkles" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{stats.testimonies}</Text>
                <Text style={styles.statLabel}>Testimonies</Text>
              </View>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <Ionicons name="play-circle" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{stats.content}</Text>
                <Text style={styles.statLabel}>Content</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(4, 120, 87, 0.1)' }]}>
                <Ionicons name="chatbubbles" size={20} color="#047857" />
              </View>
              <Text style={styles.quickActionTitle}>Prayer Request</Text>
              <Text style={styles.quickActionSubtitle}>Share your needs</Text>
            </Pressable>

            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="heart" size={20} color="#a855f7" />
              </View>
              <Text style={styles.quickActionTitle}>Testimony</Text>
              <Text style={styles.quickActionSubtitle}>Share God's work</Text>
            </Pressable>
          </View>
        </View>

        {/* Featured Content */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Content</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          {featuredContent.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="#d4d4d8" />
              <Text style={styles.emptyStateText}>No featured content yet</Text>
            </View>
          ) : (
            featuredContent.map((content) => {
              const isVideo = 'video_url' in content;
              const isPodcast = 'audio_url' in content;
              const isTestimony = 'content' in content;
              const thumbnail = 'thumbnail_url' in content ? content.thumbnail_url : null;

              return (
                <Pressable key={content.id} style={styles.contentCard}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri: thumbnail || 'https://images.unsplash.com/photo-1629143949694-606987575b07?w=600',
                      }}
                      style={styles.contentImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.imageGradient}
                    />
                    {isPodcast && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Podcast</Text>
                      </View>
                    )}
                    {isVideo && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Video</Text>
                      </View>
                    )}
                    {isTestimony && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Testimony</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle} numberOfLines={2}>
                      {content.title}
                    </Text>
                    {isTestimony && 'content' in content && (
                      <Text style={styles.contentSpeaker} numberOfLines={2}>
                        {content.content}
                      </Text>
                    )}
                    {!isTestimony && 'description' in content && content.description && (
                      <Text style={styles.contentSpeaker} numberOfLines={2}>
                        {content.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })
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
  heroContainer: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroContent: {
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '600',
  },
  radioName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  liveButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveButtonText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -32,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.3)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '600',
    color: '#09090b',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#71717a',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    height: 208,
    position: 'relative',
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  contentInfo: {
    padding: 20,
    backgroundColor: '#fff',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 6,
  },
  contentSpeaker: {
    fontSize: 14,
    color: '#71717a',
    fontWeight: '500',
    marginBottom: 16,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 16,
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
});
