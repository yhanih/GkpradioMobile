import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { fetchNowPlaying, NowPlayingData } from '../../lib/azuracast';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

export default function LiveScreen() {
  const { isPlaying, isLoading: playerLoading, togglePlayPause } = useAudioPlayer();
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      const data = await fetchNowPlaying();
      setNowPlaying(data);
    } catch (err: any) {
      console.error('Error loading now playing:', err);
      setError(err.message || 'Failed to connect to radio stream');
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

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Unable to connect</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => {
            setLoading(true);
            loadNowPlaying();
          }}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
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
          
          <Pressable 
            style={styles.listenButton}
            onPress={togglePlayPause}
            disabled={playerLoading}
          >
            {playerLoading ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#ef4444" />
            )}
            <Text style={styles.listenButtonText}>
              {isPlaying ? 'Pause' : 'Listen Live'}
            </Text>
          </Pressable>
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
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{item.day}</Text>
              </View>
              <Text style={styles.showTitle}>{item.show}</Text>
              <Text style={styles.showTime}>{item.time}</Text>
              <Text style={styles.showHosts}>{item.hosts}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#71717a',
    fontSize: 14,
  },
  liveBanner: {
    padding: 32,
    alignItems: 'center',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentShow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentHosts: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  listenButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listenButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09090b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#09090b',
  },
  showTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  showTime: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 2,
  },
  showHosts: {
    fontSize: 13,
    color: '#71717a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
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
