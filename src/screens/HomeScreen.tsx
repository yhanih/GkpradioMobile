import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export function HomeScreen() {
  const stats = [
    { label: 'Members', value: '2.5K', icon: 'people', color: ['#3b82f6', '#2563eb'] as const },
    { label: 'Messages', value: '8.2K', icon: 'chatbubbles', color: ['#a855f7', '#9333ea'] as const },
    { label: 'Prayers', value: '45K', icon: 'heart', color: ['#047857', '#059669'] as const },
  ];

  const featuredContent = [
    {
      id: 1,
      title: 'Kingdom Principles: Understanding Your Purpose',
      speaker: 'Pastor James Williams',
      category: 'Teaching',
      duration: '45 min',
      image: 'https://images.unsplash.com/photo-1629143949694-606987575b07?w=600',
      likes: 245,
      comments: 32,
    },
    {
      id: 2,
      title: 'Financial Freedom Through Faith',
      speaker: 'Dr. Sarah Johnson',
      category: 'Finance',
      duration: '38 min',
      image: 'https://images.unsplash.com/photo-1612350275854-f96a246cfc2a?w=600',
      likes: 189,
      comments: 24,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#047857', '#059669', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>GKP</Text>
                  </View>
                  <View>
                    <Text style={styles.welcomeText}>Welcome back!</Text>
                    <Text style={styles.radioName}>Kingdom Principles Radio</Text>
                  </View>
                </View>
                <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.7)" />
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
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <LinearGradient
                  colors={stat.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <Ionicons name={stat.icon as any} size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(4, 120, 87, 0.1)' }]}>
                <Ionicons name="chatbubbles" size={20} color="#047857" />
              </View>
              <Text style={styles.quickActionTitle}>Prayer Request</Text>
              <Text style={styles.quickActionSubtitle}>Share your needs</Text>
            </Pressable>

            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="heart" size={20} color="#a855f7" />
              </View>
              <Text style={styles.quickActionTitle}>Testimony</Text>
              <Text style={styles.quickActionSubtitle}>Share God's work</Text>
            </Pressable>
          </View>
        </View>

        {/* Featured Content */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Content</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          {featuredContent.map((content) => (
            <Pressable key={content.id} style={styles.contentCard}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: content.image }} style={styles.contentImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.imageGradient}
                />
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{content.category}</Text>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{content.duration}</Text>
                </View>
              </View>

              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {content.title}
                </Text>
                <Text style={styles.contentSpeaker}>{content.speaker}</Text>

                <View style={styles.contentActions}>
                  <View style={styles.contentStats}>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="heart-outline" size={16} color="#71717a" />
                      <Text style={styles.actionText}>{content.likes}</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#71717a" />
                      <Text style={styles.actionText}>{content.comments}</Text>
                    </Pressable>
                  </View>
                  <Pressable>
                    <Ionicons name="share-outline" size={18} color="#71717a" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
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
  heroContainer: {
    overflow: 'hidden',
  },
  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroContent: {
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '600',
  },
  radioName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  liveButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveButtonText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '600',
    color: '#09090b',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#71717a',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    height: 208,
    position: 'relative',
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  contentInfo: {
    padding: 20,
    backgroundColor: '#fff',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 6,
  },
  contentSpeaker: {
    fontSize: 14,
    color: '#71717a',
    fontWeight: '500',
    marginBottom: 16,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
  },
});
