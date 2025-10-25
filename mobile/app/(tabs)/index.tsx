import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [stats, setStats] = useState({ prayers: 0, testimonies: 0, content: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [prayersCount, testimoniesCount, podcastsCount, videosCount] = await Promise.all([
        supabase.from('prayer_requests').select('id', { count: 'exact', head: true }),
        supabase.from('testimonies').select('id', { count: 'exact', head: true }),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }),
        supabase.from('videos').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        prayers: prayersCount.count || 0,
        testimonies: testimoniesCount.count || 0,
        content: (podcastsCount.count || 0) + (videosCount.count || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#047857', '#059669', '#0d9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>GKP</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.radioName}>Kingdom Principles Radio</Text>
              </View>
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

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {loading ? (
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
  heroGradient: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  heroContent: {
    gap: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  radioName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 20,
  },
  liveButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  liveButtonText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#09090b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
});
