import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function CommunityScreen() {
  const discussions = [
    {
      id: 1,
      category: 'Prayer Requests',
      icon: 'hand-right',
      title: 'Prayer Request: Healing for My Mother',
      author: 'Sarah@NashvilleUSA',
      time: '2 hours ago',
      replies: 18,
      badge: 'Hot',
    },
    {
      id: 2,
      category: 'Testimonies',
      icon: 'sparkles',
      title: 'Testimony: God\'s Provision in Hard Times',
      author: 'Michael@AtlantaUSA',
      time: '4 hours ago',
      replies: 32,
    },
    {
      id: 3,
      category: 'Youth Voices',
      icon: 'school',
      title: 'Youth Discussion: Faith in College',
      author: 'Emma@DallasUSA',
      time: '6 hours ago',
      replies: 25,
      badge: 'Hot',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Join 2,500+ believers sharing testimonies and lifting prayers
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>2.5K+</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>8.2K</Text>
            <Text style={styles.statLabel}>Discussions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>45K</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Discussions</Text>
          {discussions.map((item) => (
            <View key={item.id} style={styles.discussionCard}>
              <View style={styles.discussionHeader}>
                <Ionicons name={item.icon as any} size={20} color="#047857" />
                <Text style={styles.category}>{item.category}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.discussionTitle}>{item.title}</Text>
              <View style={styles.discussionFooter}>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.replyInfo}>
                <Ionicons name="chatbubbles-outline" size={16} color="#71717a" />
                <Text style={styles.replyCount}>{item.replies} replies</Text>
              </View>
            </View>
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
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 16,
  },
  discussionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  discussionHeader: {
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
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  author: {
    fontSize: 13,
    color: '#71717a',
  },
  dot: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  time: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  replyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717a',
  },
});
