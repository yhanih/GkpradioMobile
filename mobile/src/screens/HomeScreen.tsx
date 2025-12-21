import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Text,
  Pressable,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { ProfileAvatar } from '../components/ProfileAvatar';

import { supabase } from '../lib/supabase';
import { Episode, Video, Schedule } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';

import { HeroPlayerCard } from '../components/HeroPlayerCard';
import { MediaRail } from '../components/MediaRail';
import { StatsStrip } from '../components/StatsStrip';
import { MinistryRail } from '../components/MinistryRail';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const { user } = useAuth();
  const { isPlaying, play, pause } = useAudio();
  const navigation = useNavigation<HomeNavigationProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');

  // Data State
  const [featuredEpisodes, setFeaturedEpisodes] = useState<Episode[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);

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
    if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [episodes, videos, scheduleData] = await Promise.all([
        supabase.from('episodes').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('schedule').select('*').order('start_time', { ascending: true }),
      ]);

      if (episodes.data) setFeaturedEpisodes(episodes.data);
      if (videos.data) setRecentVideos(videos.data);
      if (scheduleData.data) setSchedule(scheduleData.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
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

          {/* Welcome Text */}
          <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.welcomeBrand}>God Kingdom Principles</Text>
            <Text style={styles.welcomeBrandSuffix}>Radio.</Text>
            <Text style={styles.welcomeSubtitle}>
              Join our community of believers in daily inspiration, powerful testimonies, and life-changing conversations.
            </Text>
          </Animated.View>

          {/* Hero Section - The Radio */}
          <HeroPlayerCard
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentShowTitle="Praise & Worship Music"
            currentShowHost="10:00 PM - 12:00 AM • Auto-DJ"
            schedule={schedule}
            onPress={() => navigation.navigate('Live')}
          />

          {/* Brand Stats */}
          <StatsStrip />

          {/* Ministry Fields (Brand Element from Web) */}
          <MinistryRail onPressItem={(item) => navigation.navigate('Community')} />

          {/* Podcast Rail */}
          <MediaRail
            title="Faith on Demand"
            type="podcast"
            items={featuredEpisodes.map(ep => ({
              id: ep.id,
              title: ep.title,
              subtitle: new Date(ep.created_at || new Date().toISOString()).toLocaleDateString(),
              imageUrl: ep.thumbnail_url || 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=400&q=80',
              duration: ep.duration ? `${Math.floor(ep.duration / 60)}m` : undefined
            }))}
            onPressItem={() => navigation.navigate('Media')}
            onPressViewAll={() => navigation.navigate('Media')}
          />

          {/* Video Rail */}
          <MediaRail
            title="Watch & Learn"
            type="video"
            items={recentVideos.map(vid => ({
              id: vid.id,
              title: vid.title,
              subtitle: 'GKP TV',
              imageUrl: vid.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&q=80',
              duration: vid.duration ? `${Math.floor(vid.duration / 60)}m` : undefined
            }))}
            onPressItem={() => navigation.navigate('Media')}
            onPressViewAll={() => navigation.navigate('Media')}
          />

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
