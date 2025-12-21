import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { LiveEvent } from '../types/database.types';

export function LiveScreen() {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLiveEvents();
  }, []);

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

  // Separate events by status
  const liveNow = liveEvents.filter(e => e.status === 'live');
  const upcoming = liveEvents.filter(e => e.status === 'scheduled');
  const pastEvents = liveEvents.filter(e => e.status === 'ended').slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Loading live events...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Events</Text>
          <Text style={styles.subtitle}>
            Watch services, teachings, and special events live
          </Text>
        </View>

        {/* Live Now Section */}
        {liveNow.length > 0 ? (
          <View style={styles.section}>
            {liveNow.map(event => (
              <Pressable
                key={event.id}
                style={styles.liveNowCard}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.liveNowGradient}
                >
                  <View style={styles.liveNowHeader}>
                    <View style={styles.liveIndicatorRow}>
                      <View style={styles.liveIndicator} />
                      <Text style={styles.liveText}>LIVE NOW</Text>
                    </View>
                    {event.viewer_count !== null && event.viewer_count > 0 && (
                      <View style={styles.viewerBadge}>
                        <Ionicons name="people" size={14} color="#fff" />
                        <Text style={styles.viewerCount}>{event.viewer_count}</Text>
                      </View>
                    )}
                  </View>

                  <Image
                    source={{ uri: event.thumbnail_url || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' }}
                    style={styles.liveNowThumbnail}
                  />

                  <View style={styles.liveNowInfo}>
                    <Text style={styles.liveNowTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.liveNowDescription} numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}
                    <Pressable style={styles.watchNowButton}>
                      <Ionicons name="play-circle" size={24} color="#fff" />
                      <Text style={styles.watchNowText}>Watch Now</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {upcoming.map(event => (
                <Pressable
                  key={event.id}
                  style={styles.upcomingCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Image
                    source={{ uri: event.thumbnail_url || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' }}
                    style={styles.upcomingThumbnail}
                  />
                  {event.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#fff" />
                    </View>
                  )}
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingTitle} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.upcomingTime}>
                      {formatDateTime(event.scheduled_start)}
                    </Text>
                    <Pressable style={styles.reminderButton}>
                      <Ionicons name="notifications-outline" size={16} color="#047857" />
                      <Text style={styles.reminderText}>Set Reminder</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Past Broadcasts */}
        {pastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Broadcasts</Text>
            {pastEvents.map(event => (
              <Pressable
                key={event.id}
                style={styles.pastEventCard}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Image
                  source={{ uri: event.thumbnail_url || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800' }}
                  style={styles.pastEventThumbnail}
                />
                <View style={styles.pastEventInfo}>
                  <Text style={styles.pastEventTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.pastEventTime}>{formatDateTime(event.scheduled_start)}</Text>
                  {event.viewer_count !== null && event.viewer_count > 0 && (
                    <View style={styles.viewedBadge}>
                      <Ionicons name="eye-outline" size={14} color="#71717a" />
                      <Text style={styles.viewedText}>{event.viewer_count} viewers</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty State */}
        {liveNow.length === 0 && upcoming.length === 0 && pastEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#d4d4d8" />
            <Text style={styles.emptyTitle}>No live events right now</Text>
            <Text style={styles.emptyText}>
              Check back soon for upcoming live streams and events
            </Text>
            <Pressable style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Browse Videos</Text>
            </Pressable>
          </View>
        )}

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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#71717a',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  // Live Now Card Styles
  liveNowCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  liveNowGradient: {
    padding: 20,
  },
  liveNowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  liveNowThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 16,
  },
  liveNowInfo: {
    gap: 8,
  },
  liveNowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  liveNowDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  watchNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  watchNowText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Upcoming Events Styles
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  upcomingCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  upcomingThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#047857',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  upcomingInfo: {
    padding: 16,
  },
  upcomingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
    lineHeight: 24,
  },
  upcomingTime: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 12,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f4f4f5',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reminderText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  // Past Events Styles
  pastEventCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  pastEventThumbnail: {
    width: 120,
    height: 90,
  },
  pastEventInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  pastEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
    lineHeight: 20,
  },
  pastEventTime: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 6,
  },
  viewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewedText: {
    fontSize: 12,
    color: '#71717a',
  },
  // Empty State Styles
  emptyState: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#047857',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

