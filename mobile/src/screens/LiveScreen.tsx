import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fetchNowPlaying, NowPlayingData } from '../lib/azuracast';

export function LiveScreen() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const schedule = [
    {
      day: 'Mon–Fri',
      show: 'My Spouse, My Heart',
      hosts: 'Jeff & Suzie Spencer',
      time: '8:00 PM – 9:00 PM',
      isLive: false,
    },
    {
      day: 'Saturday',
      show: 'Kingdom Finances',
      hosts: 'Dr. Sarah Johnson',
      time: '10:00 AM – 11:00 AM',
      isLive: false,
    },
    {
      day: 'Sunday',
      show: 'Morning Worship Service',
      hosts: 'Pastor James Williams',
      time: '9:00 AM – 11:30 AM',
      isLive: false,
    },
  ];

  useEffect(() => {
    loadNowPlaying();
    
    const interval = setInterval(loadNowPlaying, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNowPlaying = async () => {
    try {
      const data = await fetchNowPlaying(1);
      setNowPlaying(data);
    } catch (error) {
      console.error('Error loading now playing:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNowPlaying();
  };

  const currentShow = nowPlaying?.now_playing?.playlist || nowPlaying?.station?.name || 'Live Radio';
  const currentSong = nowPlaying?.now_playing?.song;
  const listenerCount = nowPlaying?.listeners?.current || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Loading live stream data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        {/* Live Now Banner */}
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveBanner}
        >
          <View style={styles.liveBannerContent}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <Text style={styles.currentShow}>
              {currentSong?.title || currentShow}
            </Text>
            <Text style={styles.currentHosts}>
              {currentSong?.artist || nowPlaying?.station?.description || 'Broadcasting 24/7'}
            </Text>
            
            <Pressable style={styles.listenButton}>
              <Ionicons name="play" size={20} color="#ef4444" />
              <Text style={styles.listenButtonText}>Listen Live</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#047857" />
            <Text style={styles.statValue}>{listenerCount}</Text>
            <Text style={styles.statLabel}>Listening Now</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="radio" size={24} color="#047857" />
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>Broadcasting</Text>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>
          {schedule.map((item, index) => (
            <View key={index} style={styles.scheduleCard}>
              {item.isLive && (
                <View style={styles.liveTagContainer}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.liveTag}
                  >
                    <Text style={styles.liveTagText}>LIVE</Text>
                  </LinearGradient>
                </View>
              )}
              <View style={styles.scheduleHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>{item.day}</Text>
                </View>
              </View>
              <Text style={styles.showTitle}>{item.show}</Text>
              <Text style={styles.showTime}>{item.time}</Text>
              <Text style={styles.showHosts}>{item.hosts}</Text>
            </View>
          ))}
        </View>

        {/* Streaming Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listen Everywhere</Text>
          <Text style={styles.sectionSubtitle}>
            Stream on your favorite platform
          </Text>
          <View style={styles.platformsGrid}>
            {['logo-spotify', 'logo-apple', 'logo-soundcloud', 'logo-youtube'].map((platform, index) => (
              <Pressable key={index} style={styles.platformCard}>
                <Ionicons name={platform as any} size={32} color="#047857" />
              </Pressable>
            ))}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#71717a',
  },
  scrollView: {
    flex: 1,
  },
  liveBanner: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  liveBannerContent: {
    alignItems: 'center',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  currentShow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  currentHosts: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 24,
  },
  listenButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  listenButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#09090b',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    position: 'relative',
  },
  liveTagContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  liveTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scheduleHeader: {
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: '#f4f4f5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  showTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 6,
  },
  showTime: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 4,
  },
  showHosts: {
    fontSize: 13,
    color: '#71717a',
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
});
