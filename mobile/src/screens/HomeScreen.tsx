import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Text,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { ProfileAvatar } from '../components/ProfileAvatar';

import {
  fetchHomeStats,
  fetchPodcasts,
  fetchVideos,
} from '../lib/backend';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { MediaRail } from '../components/MediaRail';
import { StatsStrip } from '../components/StatsStrip';
import { MinistryFieldsList } from '../components/MinistryFieldsList';
import { SkeletonList } from '../components/SkeletonLoader';

interface Episode {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  thumbnail_url?: string;
  audio_url?: string;
  duration?: number;
}

interface Video {
  id: string;
  title: string;
  created_at?: string;
  thumbnail_url?: string;
  video_url?: string;
  duration?: number;
}

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<HomeNavigationProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');

  // Data State
  const [featuredEpisodes, setFeaturedEpisodes] = useState<Episode[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [homeStats, setHomeStats] = useState({
    familyMembers: 0,
    prayersLifted: 0,
    mediaItems: 0,
  });

  // Animation State
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    fetchData();
    const fullName = user?.fullname?.trim();
    const emailName = user?.email?.split('@')?.[0];
    setUserName(fullName || emailName || 'Friend');
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshStats = async () => {
      try {
        const stats = await fetchHomeStats();
        if (mounted) setHomeStats(stats);
      } catch (error) {
        console.error('[HomeScreen] Error fetching home stats:', error);
      }
    };

    const queueStatsRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshStats();
      }, 250);
    };

    refreshStats();

    const channel = supabase
      .channel('home-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'podcasts' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, queueStatsRefresh)
      .subscribe();

    return () => {
      mounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    console.log('[HomeScreen] fetchData started');
    try {
      setLoading(true);

      const [podcastsRes, videosRes] = await Promise.all([
        fetchPodcasts(5),
        fetchVideos(3),
      ]);

      setFeaturedEpisodes(podcastsRes.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        description: p.description,
        created_at: p.created_at,
        thumbnail_url: p.thumbnail_url,
        audio_url: p.audio_url
      } as any)));

      setRecentVideos(videosRes.map((v: any) => ({
        id: String(v.id),
        title: v.title,
        created_at: v.created_at,
        thumbnail_url: v.thumbnail_url,
        video_url: v.video_url
      } as any)));

      console.log(`[HomeScreen] State updated: ${podcastsRes.length || 0} pods, ${videosRes.length || 0} vids`);

    } catch (error: any) {
      console.error('[HomeScreen] Error fetching dashboard data:', error);
      if (error && error.stack) console.error(error.stack);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandingText}>GOD KINGDOM PRINCIPLES RADIO</Text>
            <Text style={styles.greetingText}>{getGreeting()}, {userName}</Text>
          </View>
          <ProfileAvatar 
            size="medium"
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Open profile"
            accessibilityRole="button"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={{ height: 12 }} />

          {loading ? (
            <>
              {/* Welcome Text Skeleton */}
              <View style={styles.welcomeSection}>
                <View style={{ height: 28, width: '60%', backgroundColor: '#e4e4e7', borderRadius: 8, marginBottom: 8 }} />
                <View style={{ height: 28, width: '80%', backgroundColor: '#e4e4e7', borderRadius: 8, marginBottom: 8 }} />
                <View style={{ height: 22, width: '100%', backgroundColor: '#e4e4e7', borderRadius: 8, marginBottom: 12 }} />
              </View>

              {/* Stats Skeleton */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 32 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <View style={{ height: 40, width: 40, backgroundColor: '#e4e4e7', borderRadius: 20, marginBottom: 8 }} />
                    <View style={{ height: 12, width: 60, backgroundColor: '#e4e4e7', borderRadius: 6 }} />
                  </View>
                ))}
              </View>

              {/* Media Rails Skeleton */}
              <SkeletonList count={1} type="media" />
              <SkeletonList count={1} type="media" />
            </>
          ) : (
            <>
              {/* Welcome Text */}
              <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <Text style={styles.welcomeTitle}>Welcome to</Text>
                <Text style={styles.welcomeBrand}>God Kingdom Principles</Text>
                <Text style={styles.welcomeBrandSuffix}>Radio.</Text>
                <Text style={styles.welcomeSubtitle}>
                  Join our community of believers in daily inspiration, powerful testimonies, and life-changing conversations.
                </Text>
              </Animated.View>

              {/* Brand Stats */}
              <StatsStrip
                familyMembers={homeStats.familyMembers}
                prayersLifted={homeStats.prayersLifted}
                mediaItems={homeStats.mediaItems}
              />

              {/* Ministry Fields (Brand Element from Web) */}
              <MinistryFieldsList onPressItem={(category) => navigation.navigate('Community')} />

              {/* Podcast Rail */}
              {console.log('[HomeScreen] Rendering podcast rail, count:', featuredEpisodes.length)}
              {featuredEpisodes.length > 0 ? (
                <MediaRail
                  title="Faith on Demand"
                  type="podcast"
                  items={featuredEpisodes.map(ep => ({
                    id: ep.id,
                    title: ep.title,
                    subtitle: new Date(ep.created_at || new Date().toISOString()).toLocaleDateString(),
                    imageUrl: ep.thumbnail_url || undefined,
                    duration: ep.duration ? `${Math.floor(ep.duration / 60)}m` : undefined
                  }))}
                  onPressItem={(item) => {
                    const episode = featuredEpisodes.find(ep => ep.id === item.id);
                    if (episode) {
                      navigation.navigate('EpisodePlayer', { episode });
                    }
                  }}
                  onPressViewAll={() => navigation.navigate('Media')}
                />
              ) : null}

              {/* Video Rail */}
              {console.log('[HomeScreen] Rendering video rail, count:', recentVideos.length)}
              {recentVideos.length > 0 ? (
                <MediaRail
                  title="Watch & Learn"
                  type="video"
                  items={recentVideos.map(vid => ({
                    id: vid.id,
                    title: vid.title,
                    subtitle: 'GKP TV',
                    imageUrl: vid.thumbnail_url || undefined,
                    duration: vid.duration ? `${Math.floor(vid.duration / 60)}m` : undefined
                  }))}
                  onPressItem={(item) => {
                    const video = recentVideos.find(vid => vid.id === item.id);
                    if (video) {
                      navigation.navigate('VideoPlayer', { video });
                    }
                  }}
                  onPressViewAll={() => navigation.navigate('Media')}
                />
              ) : null}
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandingText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 16,
    color: '#09090b',
    fontWeight: '600',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#09090b',
  },
  welcomeBrand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#eab308', // Gold color from brand
    lineHeight: 34,
  },
  welcomeBrandSuffix: {
    fontSize: 28,
    fontWeight: '700',
    color: '#09090b',
    lineHeight: 34,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#52525b',
    lineHeight: 22,
  },
});
