import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function VideoScreen() {
  const videos = [
    {
      id: 1,
      title: 'Sunday Service: Walking in Divine Purpose',
      channel: 'GKP Radio',
      views: '2.5K',
      duration: '1:24:30',
      image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
      timestamp: '2 days ago',
    },
    {
      id: 2,
      title: 'Marriage Workshop: Building on the Rock',
      channel: 'Jeff & Suzie Spencer',
      views: '1.8K',
      duration: '45:20',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
      timestamp: '5 days ago',
    },
    {
      id: 3,
      title: 'Youth Conference: Generation Rising',
      channel: 'GKP Youth',
      views: '3.2K',
      duration: '52:15',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600',
      timestamp: '1 week ago',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Videos</Text>
          <Text style={styles.subtitle}>
            Watch sermons, teachings, and events
          </Text>
        </View>

        <View style={styles.section}>
          {videos.map((video) => (
            <Pressable key={video.id} style={styles.videoCard}>
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: video.image }} style={styles.thumbnail} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.thumbnailGradient}
                />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
              </View>

              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.channelName}>{video.channel}</Text>
                <View style={styles.videoMeta}>
                  <Text style={styles.metaText}>{video.views} views</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{video.timestamp}</Text>
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
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 6,
    lineHeight: 21,
  },
  channelName: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 4,
    fontWeight: '500',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#71717a',
  },
  metaDot: {
    fontSize: 12,
    color: '#a1a1aa',
  },
});
