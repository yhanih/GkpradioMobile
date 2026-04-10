import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchCurrentLiveEvent, fetchUpcomingLiveEvents, BackendLiveEvent } from '../lib/backend';
import { RootStackParamList } from '../types/navigation';

type LiveNavProp = NativeStackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.52;
const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200';

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LiveScreen() {
  const navigation = useNavigation<LiveNavProp>();
  const { theme, isDark } = useTheme();
  const { isPlaying, pause } = useAudio();
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEvent, setLiveEvent] = useState<BackendLiveEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<BackendLiveEvent[]>([]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [current, upcoming] = await Promise.all([
        fetchCurrentLiveEvent(),
        fetchUpcomingLiveEvents(6),
      ]);
      setLiveEvent(current);
      setUpcomingEvents(upcoming);
    } catch (err) {
      console.error('Error loading live video data:', err);
      setError('Unable to load live shows right now. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.22, duration: 780, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 780, useNativeDriver: true }),
      ])
    ).start();
  }, [loadData, pulseAnim]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadData();
      }
    }, [loadData, loading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const upcomingWithoutCurrent = useMemo(
    () => upcomingEvents.filter((event) => event.id !== liveEvent?.id),
    [upcomingEvents, liveEvent?.id]
  );

  const openLiveVideo = async (eventToOpen: BackendLiveEvent | null) => {
    if (!eventToOpen?.video_url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      await pause();
    }
    navigation.navigate('VideoPlayer', {
      liveEvent: {
        ...eventToOpen,
        status: eventToOpen.status || 'live',
      },
    });
  };

  const heroImageScale = scrollY.interpolate({
    inputRange: [-120, 0, HERO_HEIGHT],
    outputRange: [1.25, 1, 1.05],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.66],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading live video...</Text>
        </View>
      </View>
    );
  }

  const hasLiveNow = Boolean(liveEvent);
  const heroTitle = liveEvent?.title || 'No Live Show Right Now';
  const heroDescription =
    liveEvent?.description ||
    'The stream is offline right now. Check upcoming events below or configure a fallback live stream URL.';
  const heroImage = liveEvent?.thumbnail_url || FALLBACK_HERO_IMAGE;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
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
            <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover">
              <LinearGradient
                colors={
                  hasLiveNow
                    ? ['transparent', 'rgba(220, 38, 38, 0.3)', 'rgba(127, 29, 29, 0.95)']
                    : isDark
                      ? ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']
                      : ['transparent', 'rgba(4, 120, 87, 0.2)', 'rgba(4, 120, 87, 0.9)']
                }
                style={styles.heroGradient}
              />
            </ImageBackground>
          </Animated.View>

          <SafeAreaView style={styles.heroContent}>
            <View style={styles.heroTopBar}>
              <Text style={styles.heroPageTitle}>Live</Text>
              {hasLiveNow && (
                <View style={styles.livePill}>
                  <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.livePillText}>Video Live</Text>
                </View>
              )}
            </View>

            <View style={styles.heroMainContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {heroTitle}
              </Text>
              <Text style={styles.heroDescription} numberOfLines={3}>
                {heroDescription}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
                onPress={() => openLiveVideo(liveEvent)}
                disabled={!hasLiveNow}
              >
                <LinearGradient
                  colors={hasLiveNow ? ['#ef4444', '#dc2626'] : ['#6b7280', '#4b5563']}
                  style={styles.heroButtonGradient}
                >
                  <Ionicons name="videocam" size={22} color="#fff" />
                  <Text style={styles.heroButtonText}>{hasLiveNow ? 'Watch Live Show' : 'No Stream Available'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upcoming Live Shows</Text>
            {upcomingWithoutCurrent.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={42} color={theme.colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No upcoming shows</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  Add events in the `live_events` table, or set `EXPO_PUBLIC_LIVE_VIDEO_URL` for a persistent stream.
                </Text>
              </View>
            ) : (
              upcomingWithoutCurrent.map((event) => (
                <Pressable
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => openLiveVideo(event)}
                >
                  <View style={styles.eventTitleRow}>
                    <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <View style={[styles.statusBadge, event.status === 'live' && styles.statusBadgeLive]}>
                      <Text style={styles.statusBadgeText}>{event.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.eventDate, { color: theme.colors.textMuted }]}>
                    {formatEventDate(event.scheduled_start)}
                  </Text>
                  {event.description ? (
                    <Text style={[styles.eventDescription, { color: theme.colors.textMuted }]} numberOfLines={2}>
                      {event.description}
                    </Text>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>

          {error ? (
            <View style={styles.errorState}>
              <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.error || '#ef4444'} />
              <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>{error}</Text>
              <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 140 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
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
    letterSpacing: -0.4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  livePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroMainContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 37,
    letterSpacing: -0.3,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
    lineHeight: 23,
  },
  heroButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contentContainer: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    minHeight: SCREEN_HEIGHT * 0.45,
  },
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#4b5563',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeLive: {
    backgroundColor: '#ef4444',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 42,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  errorState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 34,
    gap: 12,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
