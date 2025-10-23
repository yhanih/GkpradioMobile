import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function PodcastsScreen() {
  const podcasts = [
    {
      id: 1,
      title: 'My Spouse, My Heart',
      hosts: 'Jeff & Suzie Spencer',
      description: 'Couples share their journey of love, trials, and triumph',
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
      episodes: 45,
      duration: '~45 min',
    },
    {
      id: 2,
      title: 'Kingdom Finances',
      hosts: 'Dr. Sarah Johnson',
      description: 'Biblical principles for financial freedom',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
      episodes: 32,
      duration: '~30 min',
    },
    {
      id: 3,
      title: 'Youth Uprising',
      hosts: 'Pastor Mike Thompson',
      description: 'Empowering the next generation',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
      episodes: 28,
      duration: '~25 min',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Podcasts</Text>
          <Text style={styles.subtitle}>
            Stream sermons, teachings, and conversations
          </Text>
        </View>

        <View style={styles.section}>
          {podcasts.map((podcast) => (
            <Pressable key={podcast.id} style={styles.podcastCard}>
              <Image source={{ uri: podcast.image }} style={styles.podcastImage} />
              <View style={styles.podcastInfo}>
                <Text style={styles.podcastTitle}>{podcast.title}</Text>
                <Text style={styles.podcastHosts}>{podcast.hosts}</Text>
                <Text style={styles.podcastDescription}>{podcast.description}</Text>
                <View style={styles.podcastMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="mic" size={14} color="#71717a" />
                    <Text style={styles.metaText}>{podcast.episodes} episodes</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={14} color="#71717a" />
                    <Text style={styles.metaText}>{podcast.duration}</Text>
                  </View>
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
    paddingHorizontal: 20,
  },
  podcastCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  podcastImage: {
    width: 120,
    height: 120,
  },
  podcastInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  podcastHosts: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 6,
    fontWeight: '500',
  },
  podcastDescription: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 8,
    lineHeight: 18,
  },
  podcastMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#71717a',
  },
});
