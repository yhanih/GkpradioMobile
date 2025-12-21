import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { supabase } from '../lib/supabase';
import { LiveEvent } from '../types/database.types';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

type LiveNavProp = NativeStackNavigationProp<RootStackParamList>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;

export function LiveScreen() {
  const navigation = useNavigation<LiveNavProp>();
  const { theme, isDark } = useTheme();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const scheduleReminder = async (event: LiveEvent) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in Settings to receive reminders.'
        );
        return;
      }

      const eventDate = new Date(event.scheduled_start);
      const reminderDate = new Date(eventDate.getTime() - 15 * 60 * 1000);
      
      if (reminderDate <= new Date()) {
        Alert.alert('Event Starting Soon', 'This event is about to start or has already started!');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GKP Radio - Starting Soon!',
          body: `"${event.title}" starts in 15 minutes`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      setReminders(prev => new Set(prev).add(event.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reminder Set', `We'll remind you 15 minutes before "${event.title}" starts.`);
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      Alert.alert('Error', 'Could not set reminder. Please try again.');
    }
  };

  const addToCalendar = async (event: LiveEvent) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Calendar Access Denied',
          'Please enable calendar access in Settings to add events.'
        );
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];
      
      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found on your device.');
        return;
      }

      const startDate = new Date(event.scheduled_start);
      const endDate = event.scheduled_end 
        ? new Date(event.scheduled_end) 
        : new Date(startDate.getTime() + 60 * 60 * 1000);

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        notes: event.description || 'GKP Radio Live Event',
        startDate,
        endDate,
        alarms: [{ relativeOffset: -15 }],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Added to Calendar', `"${event.title}" has been added to your calendar.`);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Could not add to calendar. Please try again.');
    }
  };

  const handleHeroAction = (event: LiveEvent | undefined, isLive: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    if (isLive && event) {
      navigation.navigate('VideoPlayer', { liveEvent: event });
    } else if (event) {
      scheduleReminder(event);
    }
  };

  const handlePastBroadcastPlay = (event: LiveEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('VideoPlayer', { liveEvent: event });
  };

  const navigateToMedia = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.getParent()?.navigate('Media');
  };

  useEffect(() => {
    loadLiveEvents();
    startPulseAnimation();
  }, []);

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

  const loadLiveEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('live_events')
        .select('*')
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      if (data) setLiveEvents(data);
    } catch (error) {
      console.error('Error loading live events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLiveEvents();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (diffInDays === 0) return `Today at ${timeStr}`;
    if (diffInDays === 1) return `Tomorrow at ${timeStr}`;
    if (diffInDays === -1) return `Yesterday at ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCountdown = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const liveNow = liveEvents.filter(e => e.status === 'live');
  const upcoming = liveEvents.filter(e => e.status === 'scheduled');
  const pastEvents = liveEvents.filter(e => e.status === 'ended').slice(0, 5);

  const heroEvent = liveNow[0] || upcoming[0];
  const isLive = liveNow.length > 0;

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading live events...
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
        {/* Immersive Hero Section */}
        <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}>
          <Animated.View style={[styles.heroImageWrapper, { transform: [{ scale: heroImageScale }] }]}>
            <ImageBackground
              source={{ 
                uri: heroEvent?.thumbnail_url || 
                     'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200' 
              }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              {/* Dynamic Gradient Overlay */}
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

          {/* Hero Content */}
          <SafeAreaView style={styles.heroContent} edges={['top']}>
            {/* Top Bar */}
            <View style={styles.heroTopBar}>
              <Text style={styles.heroPageTitle}>Live</Text>
              {isLive && heroEvent?.viewer_count !== null && heroEvent.viewer_count > 0 && (
                <View style={styles.viewerPill}>
                  <Ionicons name="eye" size={14} color="#fff" />
                  <Text style={styles.viewerPillText}>
                    {heroEvent.viewer_count.toLocaleString()} watching
                  </Text>
                </View>
              )}
            </View>

            {/* Hero Main Content */}
            <View style={styles.heroMainContent}>
              {/* Live Indicator */}
              {isLive ? (
                <View style={styles.liveIndicatorContainer}>
                  <Animated.View 
                    style={[
                      styles.liveGlow,
                      { opacity: glowAnim }
                    ]}
                  />
                  <View style={styles.liveBadge}>
                    <Animated.View 
                      style={[
                        styles.liveDot,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
              ) : heroEvent ? (
                <View style={styles.upcomingBadge}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.upcomingBadgeText}>
                    {getCountdown(heroEvent.scheduled_start) || 'Coming Soon'}
                  </Text>
                </View>
              ) : null}

              {/* Title & Description */}
              {heroEvent ? (
                <>
                  <Text style={styles.heroTitle}>{heroEvent.title}</Text>
                  {heroEvent.description && (
                    <Text style={styles.heroDescription} numberOfLines={2}>
                      {heroEvent.description}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.heroTitle}>Kingdom Principles Radio</Text>
                  <Text style={styles.heroDescription}>
                    No live events right now. Check back soon!
                  </Text>
                </>
              )}

              {/* Large Action Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.heroButton,
                  isLive && styles.heroButtonLive,
                  pressed && styles.heroButtonPressed,
                ]}
                onPress={() => handleHeroAction(heroEvent, isLive)}
              >
                <LinearGradient
                  colors={isLive ? ['#ef4444', '#dc2626'] : [theme.colors.primary, '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroButtonGradient}
                >
                  <Ionicons 
                    name={isLive ? 'play' : 'notifications-outline'} 
                    size={24} 
                    color="#fff" 
                  />
                  <Text style={styles.heroButtonText}>
                    {isLive ? 'Watch Now' : 'Set Reminder'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Content Below Hero */}
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
          {/* Interactive Timeline - Upcoming Shows */}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Coming Up
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
                  {upcoming.length} scheduled
                </Text>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timelineScroll}
                decelerationRate="fast"
                snapToInterval={SCREEN_WIDTH * 0.75 + 16}
              >
                {upcoming.map((event, index) => (
                  <Pressable
                    key={event.id}
                    style={({ pressed }) => [
                      styles.timelineCard,
                      { backgroundColor: theme.colors.surface },
                      pressed && styles.timelineCardPressed,
                    ]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <Image
                      source={{ 
                        uri: event.thumbnail_url || 
                             'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' 
                      }}
                      style={styles.timelineThumbnail}
                    />
                    
                    {/* Countdown Chip */}
                    <View style={styles.countdownChip}>
                      <Ionicons name="time" size={12} color="#fff" />
                      <Text style={styles.countdownText}>
                        {getCountdown(event.scheduled_start) || 'Soon'}
                      </Text>
                    </View>

                    {event.is_featured && (
                      <View style={styles.featuredStar}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                      </View>
                    )}

                    <View style={styles.timelineInfo}>
                      <Text 
                        style={[styles.timelineTitle, { color: theme.colors.text }]} 
                        numberOfLines={2}
                      >
                        {event.title}
                      </Text>
                      <Text style={[styles.timelineTime, { color: theme.colors.primary }]}>
                        {formatDateTime(event.scheduled_start)}
                      </Text>
                      
                      <View style={styles.timelineActions}>
                        <Pressable 
                          style={[
                            styles.reminderBtn, 
                            { backgroundColor: reminders.has(event.id) ? theme.colors.primary : theme.colors.primaryLight }
                          ]}
                          onPress={() => scheduleReminder(event)}
                        >
                          <Ionicons 
                            name={reminders.has(event.id) ? 'notifications' : 'notifications-outline'} 
                            size={16} 
                            color={reminders.has(event.id) ? '#fff' : theme.colors.primary} 
                          />
                          <Text style={[
                            styles.reminderBtnText, 
                            { color: reminders.has(event.id) ? '#fff' : theme.colors.primary }
                          ]}>
                            {reminders.has(event.id) ? 'Reminder Set' : 'Remind Me'}
                          </Text>
                        </Pressable>
                        <Pressable 
                          style={styles.calendarBtn}
                          onPress={() => addToCalendar(event)}
                        >
                          <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Past Broadcasts - Story Cards */}
          {pastEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Recent Broadcasts
                </Text>
                <Pressable onPress={navigateToMedia}>
                  <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                    See All
                  </Text>
                </Pressable>
              </View>

              {pastEvents.map((event, index) => (
                <Pressable
                  key={event.id}
                  style={({ pressed }) => [
                    styles.storyCard,
                    pressed && styles.storyCardPressed,
                  ]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <ImageBackground
                    source={{ 
                      uri: event.thumbnail_url || 
                           'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' 
                    }}
                    style={styles.storyCardBg}
                    imageStyle={styles.storyCardBgImage}
                    blurRadius={20}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={styles.storyCardOverlay}
                    >
                      <Image
                        source={{ 
                          uri: event.thumbnail_url || 
                               'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' 
                        }}
                        style={styles.storyCardThumb}
                      />
                      
                      <View style={styles.storyCardContent}>
                        <Text style={styles.storyCardTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        <Text style={styles.storyCardTime}>
                          {formatDateTime(event.scheduled_start)}
                        </Text>
                        
                        {event.viewer_count !== null && event.viewer_count > 0 && (
                          <View style={styles.storyCardStats}>
                            <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.storyCardStatsText}>
                              {event.viewer_count.toLocaleString()} views
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.storyCardActions}>
                        <Pressable 
                          style={styles.storyPlayBtn}
                          onPress={() => handlePastBroadcastPlay(event)}
                        >
                          <Ionicons name="play" size={20} color="#fff" />
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </ImageBackground>

                  {/* Progress Indicator (mock - would be real progress) */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(index + 1) * 20}%` }]} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Empty State */}
          {liveNow.length === 0 && upcoming.length === 0 && pastEvents.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={[theme.colors.primaryLight, 'transparent']}
                  style={styles.emptyIconGlow}
                />
                <Ionicons name="videocam-outline" size={48} color={theme.colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Events Scheduled
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Check back soon for live streams, teachings, and special broadcasts
              </Text>
              <Pressable 
                style={styles.emptyButton}
                onPress={navigateToMedia}
              >
                <LinearGradient
                  colors={[theme.colors.primary, '#059669']}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Explore Videos</Text>
                </LinearGradient>
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

  // Hero Section
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

  // Content Container
  contentContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 28,
    minHeight: SCREEN_HEIGHT * 0.5,
  },

  // Section Styles
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Timeline Cards (Upcoming)
  timelineScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  timelineCard: {
    width: SCREEN_WIDTH * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  timelineCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  timelineThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  countdownChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredStar: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineInfo: {
    padding: 16,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  timelineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Story Cards (Past Broadcasts)
  storyCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  storyCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  storyCardBg: {
    width: '100%',
    height: 120,
  },
  storyCardBgImage: {
    borderRadius: 20,
  },
  storyCardOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  storyCardThumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
  },
  storyCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  storyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 21,
  },
  storyCardTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  storyCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyCardStatsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  storyCardActions: {
    justifyContent: 'center',
  },
  storyPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#047857',
    borderRadius: 2,
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
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
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
