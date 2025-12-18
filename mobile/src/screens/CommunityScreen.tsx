import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { PrayerRequest, Testimony } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'prayers' | 'testimonies';

export function CommunityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('prayers');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, users: 0 });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [prayersCount, testimoniesCount] = await Promise.all([
        supabase.from('prayercircles').select('id', { count: 'exact', head: true }).eq('is_testimony', false),
        supabase.from('prayercircles').select('id', { count: 'exact', head: true }).eq('is_testimony', true),
      ]);

      if (prayersCount.error) throw prayersCount.error;
      if (testimoniesCount.error) throw testimoniesCount.error;

      setStats({
        prayers: prayersCount.count || 0,
        testimonies: testimoniesCount.count || 0,
        users: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Unable to load statistics. Please try again.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [prayersData, testimoniesData] = await Promise.all([
        supabase
          .from('prayercircles')
          .select('*')
          .eq('is_testimony', false)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('prayercircles')
          .select('*')
          .eq('is_testimony', true)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (prayersData.error) throw prayersData.error;
      if (testimoniesData.error) throw testimoniesData.error;

      if (prayersData.data) setPrayers(prayersData.data);
      if (testimoniesData.data) setTestimonies(testimoniesData.data);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError('Unable to load community content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchStats()]);
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

  const renderPrayerRequest = (prayer: PrayerRequest) => (
    <View key={prayer.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="hand-right" size={20} color="#047857" />
        <Text style={styles.category}>Prayer Request</Text>
        {prayer.status === 'answered' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Answered</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {prayer.title}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {prayer.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.time}>{formatTimeAgo(prayer.created_at)}</Text>
        <View style={styles.cardActions}>
          <Ionicons name="heart-outline" size={18} color="#71717a" />
          <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
        </View>
      </View>
    </View>
  );

  const renderTestimony = (testimony: Testimony) => (
    <View key={testimony.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="sparkles" size={20} color="#047857" />
        <Text style={styles.category}>Testimony</Text>
        {testimony.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {testimony.title}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {testimony.content}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.time}>{formatTimeAgo(testimony.created_at)}</Text>
        <View style={styles.cardActions}>
          <Ionicons name="heart-outline" size={18} color="#71717a" />
          <Ionicons name="chatbubble-outline" size={18} color="#71717a" />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Share testimonies, lift prayers, and encourage one another
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.prayers}</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.testimonies}</Text>
            <Text style={styles.statLabel}>Testimonies</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="add-circle" size={32} color="#047857" />
            <Text style={styles.statLabel}>New Post</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'prayers' && styles.activeTab]}
            onPress={() => setActiveTab('prayers')}
          >
            <Text style={[styles.tabText, activeTab === 'prayers' && styles.activeTabText]}>
              Prayer Requests
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'testimonies' && styles.activeTab]}
            onPress={() => setActiveTab('testimonies')}
          >
            <Text style={[styles.tabText, activeTab === 'testimonies' && styles.activeTabText]}>
              Testimonies
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => { fetchData(); fetchStats(); }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#047857" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'prayers' && (
                <>
                  {prayers.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="hand-right-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No prayer requests yet</Text>
                      <Text style={styles.emptyStateText}>
                        Be the first to share a prayer request with the community
                      </Text>
                    </View>
                  ) : (
                    prayers.map(renderPrayerRequest)
                  )}
                </>
              )}

              {activeTab === 'testimonies' && (
                <>
                  {testimonies.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="sparkles-outline" size={48} color="#d4d4d8" />
                      <Text style={styles.emptyStateTitle}>No testimonies yet</Text>
                      <Text style={styles.emptyStateText}>
                        Share how God has worked in your life
                      </Text>
                    </View>
                  ) : (
                    testimonies.map(renderTestimony)
                  )}
                </>
              )}
            </>
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
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  activeTab: {
    backgroundColor: '#047857',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#71717a',
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  featuredBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#71717a',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
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
