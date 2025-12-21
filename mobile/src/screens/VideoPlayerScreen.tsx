import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useAuth } from '../contexts/AuthContext';

type VideoPlayerRouteProp = RouteProp<RootStackParamList, 'VideoPlayer'>;
type VideoPlayerNavProp = NativeStackNavigationProp<RootStackParamList, 'VideoPlayer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VideoPlayerScreen() {
  const navigation = useNavigation<VideoPlayerNavProp>();
  const route = useRoute<VideoPlayerRouteProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  
  const { video, liveEvent } = route.params;
  const content = video || liveEvent;
  
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const videoSource = video?.video_url || liveEvent?.video_url || '';
  
  if (!videoSource) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Video URL not available</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    if (player) {
      const subscription = player.addListener('statusChange', (payload) => {
        setIsLoading(payload.status === 'loading');
      });
      return () => subscription.remove();
    }
  }, [player]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const toggleControls = () => {
    setShowControls(prev => !prev);
    if (!showControls) {
      resetControlsTimeout();
    }
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    resetControlsTimeout();
  };

  const handleBookmark = async () => {
    if (!user || !video) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleBookmark('video', video.id);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.pause();
    navigation.goBack();
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: content?.title || 'GKP Radio Video',
        message: `Check out "${content?.title}" on GKP Radio!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!content || !videoSource) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Video not available</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <Pressable style={styles.videoContainer} onPress={toggleControls}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        
        {showControls && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.2, 0.8, 1]}
              style={StyleSheet.absoluteFill}
            />
            
            <SafeAreaView style={styles.topControls} edges={['top']}>
              <Pressable style={styles.controlButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </Pressable>
              
              <View style={styles.topRight}>
                <Pressable style={styles.controlButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </Pressable>
                {video && user && (
                  <Pressable style={styles.controlButton} onPress={handleBookmark}>
                    <Ionicons 
                      name={isBookmarked('video', video.id) ? 'bookmark' : 'bookmark-outline'} 
                      size={24} 
                      color="#fff" 
                    />
                  </Pressable>
                )}
              </View>
            </SafeAreaView>
            
            <View style={styles.centerControls}>
              <Pressable style={styles.playPauseButton} onPress={handlePlayPause}>
                <Ionicons 
                  name={player.playing ? 'pause' : 'play'} 
                  size={48} 
                  color="#fff" 
                />
              </Pressable>
            </View>
            
            <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
              <View style={styles.videoInfo}>
                {liveEvent && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {content.title}
                </Text>
                {content.description && (
                  <Text style={styles.videoDescription} numberOfLines={1}>
                    {content.description}
                  </Text>
                )}
                {video?.duration && (
                  <Text style={styles.videoDuration}>
                    {formatDuration(video.duration)}
                  </Text>
                )}
              </View>
            </SafeAreaView>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  videoInfo: {
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  videoDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  videoDuration: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#047857',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
