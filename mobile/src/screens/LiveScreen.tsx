import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { fetchRadioSchedule, fetchRadioStatusFromAzuraCast } from '../lib/backend';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';

type LiveNavProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;

export function LiveScreen() {
  const navigation = useNavigation<LiveNavProp>();
  const { theme, isDark } = useTheme();
  const { isPlaying, play, pause } = useAudio();
  
  const [radioStatus, setRadioStatus] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    loadData();
    startPulseAnimation();
    
    const statusInterval = setInterval(() => {
      loadRadioStatus();
    }, 30000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const loadRadioStatus = async () => {
    try {
      const data = await fetchRadioStatusFromAzuraCast();
      setRadioStatus(data);
    } catch (err) {
      console.error('Error auto-loading radio status:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statusRes, scheduleRes] = await Promise.all([
        fetchRadioStatusFromAzuraCast(),
        fetchRadioSchedule()
      ]);

      setRadioStatus(statusRes);
      if (scheduleRes) setSchedule(scheduleRes);
      
    } catch (err) {
      console.error('Error loading live data:', err);
      setError('Unable to load data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [])
  );

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isLive = radioStatus?.is_live || false;
  const isOnline = !!radioStatus?.now_playing;
  const heroTitle = radioStatus?.now_playing?.title || radioStatus?.current_show || 'Kingdom Principles Radio';
  const heroDescription = isLive 
    ? 'Live Broadcast with Host' 
    : isOnline 
      ? `Now Playing: ${radioStatus?.now_playing?.artist || 'Worship Music'}`
      : 'Tune in for our next broadcast';
  const heroImage = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200';

  const heroImageScale = scrollY.interpolate({
    inputRange: [-100, 0, HERO_HEIGHT],
    outputRange: [1.3, 1, 1.1],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scheduleImageUrl = schedule?.image_url;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading live data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
            progressViewOffset={HERO_HEIGHT * 0.3}
          />
        }
      >
        <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}>
          <Animated.View style={[styles.heroImageWrapper, { transform: [{ scale: heroImageScale }] }]}>
            <ImageBackground
              source={{ uri: heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={
                  isLive 
                    ? ['transparent', 'rgba(220, 38, 38, 0.3)', 'rgba(127, 29, 29, 0.95)']
                    : isDark
                      ? ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']
                      : ['transparent', 'rgba(4, 120, 87, 0.2)', 'rgba(4, 120, 87, 0.9)']
                }
                locations={[0, 0.5, 1]}
                style={styles.heroGradient}
              />
            </ImageBackground>
          </Animated.View>

          <SafeAreaView style={styles.heroContent}>
            <View style={styles.heroTopBar}>
              <Text style={styles.heroPageTitle}>Live</Text>
              {isLive && (
                <View style={styles.viewerPill}>
                  <Ionicons name="radio" size={14} color="#fff" />
                  <Text style={styles.viewerPillText}>On Air</Text>
                </View>
              )}
            </View>

            <View style={styles.heroMainContent}>
              {isLive ? (
                <View style={styles.liveIndicatorContainer}>
                  <Animated.View style={[styles.liveGlow, { opacity: glowAnim }]} />
                  <View style={styles.liveBadge}>
                    <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.upcomingBadge}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.upcomingBadgeText}>Broadcasting Live</Text>
                </View>
              )}

              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroDescription} numberOfLines={2}>
                {heroDescription}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.heroButton,
                  isLive && styles.heroButtonLive,
                  pressed && styles.heroButtonPressed,
                ]}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  if (isPlaying) {
                    await pause();
                  } else {
                    await play();
                  }
                }}
              >
                <LinearGradient
                  colors={isLive ? ['#ef4444', '#dc2626'] : [theme.colors.primary, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroButtonGradient}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
                  <Text style={styles.heroButtonText}>
                    {isPlaying ? 'Pause' : isLive ? 'Listen Now' : 'Tune In'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
          {scheduleImageUrl ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Radio Schedule
                </Text>
              </View>
              <View style={styles.scheduleImageContainer}>
                <Image
                  source={{ uri: scheduleImageUrl }}
                  style={styles.scheduleImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Schedule Available
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Check back later for updated program times
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorState}>
              <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.error || '#ef4444'} />
              <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
                {error}
              </Text>
              <Pressable 
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 140 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  heroPageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewerPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  heroMainContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  liveIndicatorContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  liveGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    backgroundColor: '#ef4444',
    borderRadius: 24,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  upcomingBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
  },
  heroButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroButtonLive: {
    shadowColor: '#ef4444',
  },
  heroButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  contentContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 28,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scheduleImageContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scheduleImage: {
    width: SCREEN_WIDTH - 24,
    height: (SCREEN_WIDTH - 24) * 1.4,
    borderRadius: 16,
  },
  errorState: {
    paddingVertical: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
});
