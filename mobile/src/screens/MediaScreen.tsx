import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { Episode, Video } from '../types/database.types';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

type MediaNavProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

type TabType = 'podcasts' | 'videos';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'sermons', label: 'Sermons', icon: 'book' },
  { id: 'teachings', label: 'Teachings', icon: 'school' },
  { id: 'worship', label: 'Worship', icon: 'musical-notes' },
  { id: 'testimonies', label: 'Testimonies', icon: 'heart' },
  { id: 'youth', label: 'Youth', icon: 'people' },
];

const HEADER_HEIGHT = 72;
const AUDIO_PLAYER_HEIGHT = 100;

export function MediaScreen() {
  const navigation = useNavigation<MediaNavProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('podcasts');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [podcasts, setPodcasts] = useState<Episode[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkAnimations, setBookmarkAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(1)).current;
  const playButtonPulse = useRef(new Animated.Value(1)).current;

  const contentTopPadding = insets.top + HEADER_HEIGHT + 16;
  const contentBottomPadding = AUDIO_PLAYER_HEIGHT + insets.bottom + 32;

  useEffect(() => {
    fetchData();
    startPlayButtonPulse();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchData();
      }
    }, [])
  );

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'podcasts' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [activeTab]);

  const startPlayButtonPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonPulse, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [podcastsData, videosData] = await Promise.all([
        supabase
          .from('episodes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (podcastsData.error) throw podcastsData.error;
      if (videosData.error) throw videosData.error;

      if (podcastsData.data) setPodcasts(podcastsData.data);
      if (videosData.data) setVideos(videosData.data);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Unable to load media content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '~30 min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const filterByCategory = <T extends { category?: string | null }>(items: T[]): T[] => {
    if (selectedCategory === 'all') return items;
    return items.filter(item => 
      item.category?.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  };

  const getBookmarkAnimation = (id: string) => {
    if (!bookmarkAnimations[id]) {
      const anim = new Animated.Value(1);
      setBookmarkAnimations(prev => ({ ...prev, [id]: anim }));
      return anim;
    }
    return bookmarkAnimations[id];
  };

  const handleBookmarkToggle = async (contentType: 'episode' | 'video', contentId: string) => {
    if (!user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Sign In Required',
        'Please sign in to save bookmarks.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login' as any) }
        ]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const anim = getBookmarkAnimation(contentId);
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
    
    await toggleBookmark(contentType, contentId);
  };

  const filteredPodcasts = filterByCategory(podcasts);
  const filteredVideos = filterByCategory(videos);

  // Apply search filter if search query exists
  const searchFilteredPodcasts = searchQuery.trim()
    ? filteredPodcasts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredPodcasts;

  const searchFilteredVideos = searchQuery.trim()
    ? filteredVideos.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredVideos;

  const featuredContent = activeTab === 'podcasts' 
    ? searchFilteredPodcasts.find(p => p.is_featured) || searchFilteredPodcasts[0]
    : searchFilteredVideos.find(v => v.is_featured) || searchFilteredVideos[0];

  const continueWatching = searchFilteredVideos.slice(0, 4);
  const continuePlaying = searchFilteredPodcasts.slice(0, 4);

  const tabIndicatorTranslate = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading media...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Media</Text>
          {showSearch ? (
            <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    Haptics.selectionAsync();
                  }}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  Haptics.selectionAsync();
                }}
                style={styles.closeSearchButton}
              >
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <Pressable 
              style={[styles.searchButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                Haptics.selectionAsync();
                setShowSearch(true);
              }}
            >
              <Ionicons name="search" size={20} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: contentTopPadding,
          paddingBottom: contentBottomPadding 
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary} 
          />
        }
      >
        {/* Featured Hero */}
        {featuredContent && (
          <Pressable
            style={styles.heroContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (activeTab === 'podcasts') {
                navigation.navigate('EpisodePlayer', { episode: featuredContent as Episode });
              } else {
                navigation.navigate('VideoPlayer', { video: featuredContent as Video });
              }
            }}
            onPressIn={() => {
              Animated.spring(heroScaleAnim, {
                toValue: 0.98,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(heroScaleAnim, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Animated.View style={[styles.heroWrapper, { transform: [{ scale: heroScaleAnim }] }]}>
              <ImageBackground
                source={{
                  uri: featuredContent.thumbnail_url ||
                    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200',
                }}
                style={styles.heroImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                  locations={[0, 0.4, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.heroBadge}>
                      <Ionicons 
                        name={activeTab === 'podcasts' ? 'mic' : 'videocam'} 
                        size={12} 
                        color="#fff" 
                      />
                      <Text style={styles.heroBadgeText}>
                        {activeTab === 'podcasts' ? 'FEATURED EPISODE' : 'FEATURED VIDEO'}
                      </Text>
                    </View>
                    
                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {featuredContent.title}
                    </Text>
                    
                    {'author' in featuredContent && featuredContent.author && (
                      <Text style={styles.heroAuthor}>{featuredContent.author}</Text>
                    )}
                    
                    <View style={styles.heroMeta}>
                      <View style={styles.heroMetaItem}>
                        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroMetaText}>
                          {formatDuration(featuredContent.duration)}
                        </Text>
                      </View>
                      {featuredContent.category && (
                        <View style={styles.heroMetaItem}>
                          <Ionicons name="folder-outline" size={14} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.heroMetaText}>{featuredContent.category}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Play Button */}
                  <Animated.View 
                    style={[
                      styles.heroPlayButton,
                      { transform: [{ scale: playButtonPulse }] }
                    ]}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, '#059669']}
                      style={styles.heroPlayGradient}
                    >
                      <Ionicons name="play" size={32} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                </LinearGradient>
              </ImageBackground>
            </Animated.View>
          </Pressable>
        )}

        {/* Animated Tab Switcher */}
        <View style={styles.tabContainer}>
          <View style={[styles.tabBackground, { backgroundColor: theme.colors.surface }]}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { 
                  backgroundColor: theme.colors.primary,
                  transform: [{ translateX: tabIndicatorTranslate }],
                },
              ]}
            />
            <Pressable
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('podcasts');
              }}
            >
              <Ionicons
                name="mic"
                size={18}
                color={activeTab === 'podcasts' ? '#fff' : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'podcasts' ? '#fff' : theme.colors.textMuted },
                ]}
              >
                Podcasts
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeTab === 'podcasts' ? 'rgba(255,255,255,0.3)' : theme.colors.primaryLight }
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  { color: activeTab === 'podcasts' ? '#fff' : theme.colors.primary }
                ]}>
                  {podcasts.length}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('videos');
              }}
            >
              <Ionicons
                name="videocam"
                size={18}
                color={activeTab === 'videos' ? '#fff' : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'videos' ? '#fff' : theme.colors.textMuted },
                ]}
              >
                Videos
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeTab === 'videos' ? 'rgba(255,255,255,0.3)' : theme.colors.primaryLight }
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  { color: activeTab === 'videos' ? '#fff' : theme.colors.primary }
                ]}>
                  {videos.length}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === category.id
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    selectedCategory === category.id
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(category.id);
              }}
            >
              <Ionicons
                name={category.icon as any}
                size={14}
                color={selectedCategory === category.id ? '#fff' : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      selectedCategory === category.id ? '#fff' : theme.colors.text,
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick Access Section - Recent Videos */}
        {activeTab === 'videos' && continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recent Videos
              </Text>
              <Pressable 
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory('all');
                }}
              >
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                  See All
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueScroll}
            >
              {continueWatching.map((video) => (
                <Pressable
                  key={video.id}
                  style={({ pressed }) => [
                    styles.continueCard,
                    pressed && styles.continueCardPressed,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('VideoPlayer', { video });
                  }}
                >
                  <Image
                    source={{
                      uri: video.thumbnail_url ||
                        'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
                    }}
                    style={styles.continueThumbnail}
                  />
                  <View style={styles.continuePlayIcon}>
                    <Ionicons name="play" size={16} color="#fff" />
                  </View>
                  <View style={styles.continueDuration}>
                    <Text style={styles.continueDurationText}>
                      {formatDuration(video.duration)}
                    </Text>
                  </View>
                  <Text 
                    style={[styles.continueTitle, { color: theme.colors.text }]} 
                    numberOfLines={2}
                  >
                    {video.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Access Section - Recent Episodes */}
        {activeTab === 'podcasts' && continuePlaying.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recent Episodes
              </Text>
              <Pressable 
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory('all');
                }}
              >
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                  See All
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueScroll}
            >
              {continuePlaying.map((podcast) => (
                <Pressable
                  key={podcast.id}
                  style={({ pressed }) => [
                    styles.continueCard,
                    pressed && styles.continueCardPressed,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('EpisodePlayer', { episode: podcast });
                  }}
                >
                  <Image
                    source={{
                      uri: podcast.thumbnail_url ||
                        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
                    }}
                    style={styles.continueThumbnail}
                  />
                  <View style={styles.continuePlayIcon}>
                    <Ionicons name="play" size={16} color="#fff" />
                  </View>
                  <View style={styles.continueDuration}>
                    <Text style={styles.continueDurationText}>
                      {formatDuration(podcast.duration)}
                    </Text>
                  </View>
                  <Text 
                    style={[styles.continueTitle, { color: theme.colors.text }]} 
                    numberOfLines={2}
                  >
                    {podcast.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <Pressable 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
              onPress={fetchData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Main Content List */}
        {!error && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {activeTab === 'podcasts' ? 'All Episodes' : 'All Videos'}
              </Text>
              <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
                {activeTab === 'podcasts' ? searchFilteredPodcasts.length : searchFilteredVideos.length} items
              </Text>
            </View>

            {activeTab === 'podcasts' && (
              <>
                {searchFilteredPodcasts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="mic-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                      No podcasts yet
                    </Text>
                    <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
                      {selectedCategory === 'all' ? 'Check back soon for new episodes' : 'No episodes in this category'}
                    </Text>
                  </View>
                ) : (
                  searchFilteredPodcasts.map((podcast, index) => (
                    <Pressable
                      key={podcast.id}
                      style={({ pressed }) => [
                        styles.podcastCard,
                        { backgroundColor: theme.colors.surface },
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('EpisodePlayer', { episode: podcast });
                      }}
                    >
                      <View style={styles.podcastImageContainer}>
                        <Image
                          source={{
                            uri: podcast.thumbnail_url ||
                              'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
                          }}
                          style={styles.podcastImage}
                        />
                        <View style={styles.podcastPlayOverlay}>
                          <Ionicons name="play" size={20} color="#fff" />
                        </View>
                        {podcast.is_featured && (
                          <View style={[styles.featuredBadge, { backgroundColor: theme.colors.primary }]}>
                            <Ionicons name="star" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.podcastInfo}>
                        <Text style={[styles.podcastTitle, { color: theme.colors.text }]} numberOfLines={2}>
                          {podcast.title}
                        </Text>
                        {podcast.author && (
                          <Text style={[styles.podcastAuthor, { color: theme.colors.textMuted }]}>
                            {podcast.author}
                          </Text>
                        )}
                        <View style={styles.podcastMeta}>
                          <View style={[styles.durationPill, { backgroundColor: theme.colors.primaryLight }]}>
                            <Ionicons name="time" size={12} color={theme.colors.primary} />
                            <Text style={[styles.durationPillText, { color: theme.colors.primary }]}>
                              {formatDuration(podcast.duration)}
                            </Text>
                          </View>
                          <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                            {formatTimeAgo(podcast.created_at)}
                          </Text>
                        </View>
                      </View>
                      <Pressable 
                        style={styles.bookmarkButton}
                        onPress={() => handleBookmarkToggle('episode', podcast.id)}
                        hitSlop={10}
                      >
                        <Animated.View style={{ transform: [{ scale: bookmarkAnimations[podcast.id] || 1 }] }}>
                          <Ionicons 
                            name={isBookmarked('episode', podcast.id) ? 'bookmark' : 'bookmark-outline'} 
                            size={22} 
                            color={isBookmarked('episode', podcast.id) ? theme.colors.primary : theme.colors.textMuted} 
                          />
                        </Animated.View>
                      </Pressable>
                    </Pressable>
                  ))
                )}
              </>
            )}

            {activeTab === 'videos' && (
              <>
                {searchFilteredVideos.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconBg, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="videocam-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                      No videos yet
                    </Text>
                    <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
                      {selectedCategory === 'all' ? 'Check back soon for new content' : 'No videos in this category'}
                    </Text>
                  </View>
                ) : (
                  searchFilteredVideos.map((video) => (
                    <Pressable
                      key={video.id}
                      style={({ pressed }) => [
                        styles.videoCard,
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('VideoPlayer', { video });
                      }}
                    >
                      <View style={styles.videoThumbnailContainer}>
                        <Image
                          source={{
                            uri: video.thumbnail_url ||
                              'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600',
                          }}
                          style={styles.videoThumbnail}
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.6)']}
                          style={styles.videoGradient}
                        />
                        <View style={styles.videoPlayButton}>
                          <Ionicons name="play" size={28} color="#fff" />
                        </View>
                        <View style={styles.videoDuration}>
                          <Text style={styles.videoDurationText}>
                            {formatDuration(video.duration)}
                          </Text>
                        </View>
                        {video.is_featured && (
                          <View style={[styles.videoFeaturedBadge, { backgroundColor: theme.colors.primary }]}>
                            <Ionicons name="star" size={12} color="#fff" />
                            <Text style={styles.videoFeaturedText}>Featured</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.videoInfo, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.videoInfoHeader}>
                          <Text style={[styles.videoTitle, { color: theme.colors.text, flex: 1 }]} numberOfLines={2}>
                            {video.title}
                          </Text>
                          <Pressable 
                            style={styles.videoBookmarkButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleBookmarkToggle('video', video.id);
                            }}
                            hitSlop={10}
                          >
                            <Animated.View style={{ transform: [{ scale: bookmarkAnimations[video.id] || 1 }] }}>
                              <Ionicons 
                                name={isBookmarked('video', video.id) ? 'bookmark' : 'bookmark-outline'} 
                                size={20} 
                                color={isBookmarked('video', video.id) ? theme.colors.primary : theme.colors.textMuted} 
                              />
                            </Animated.View>
                          </Pressable>
                        </View>
                        <View style={styles.videoMetaRow}>
                          {video.category && (
                            <Text style={[styles.videoCategory, { color: theme.colors.primary }]}>
                              {video.category}
                            </Text>
                          )}
                          <Text style={[styles.videoDate, { color: theme.colors.textMuted }]}>
                            {formatTimeAgo(video.created_at)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </>
            )}
          </View>
        )}

      </ScrollView>
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: HEADER_HEIGHT,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 4,
  },
  closeSearchButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Hero Styles
  heroContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  heroWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 28,
  },
  heroAuthor: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  heroPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroPlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Styles
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Category Chips
  categoryScroll: {
    paddingLeft: 24,
    paddingRight: 16,
    marginBottom: 28,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Continue Cards
  continueScroll: {
    paddingLeft: 24,
    paddingRight: 16,
  },
  continueCard: {
    width: 160,
    marginRight: 14,
  },
  continueCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  continueThumbnail: {
    width: 160,
    height: 90,
    borderRadius: 14,
    marginBottom: 4,
  },
  continuePlayIcon: {
    position: 'absolute',
    top: 31,
    left: 66,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueDuration: {
    position: 'absolute',
    bottom: 34,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  continueDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  continueTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 24,
  },

  // Podcast Cards
  podcastCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  podcastImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  podcastImage: {
    width: 80,
    height: 80,
  },
  podcastPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  podcastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  podcastAuthor: {
    fontSize: 13,
    marginBottom: 8,
  },
  podcastMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  // Video Cards
  videoCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  videoThumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  videoFeaturedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  videoFeaturedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  videoInfo: {
    padding: 16,
  },
  videoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  videoBookmarkButton: {
    padding: 4,
    marginLeft: 8,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  videoDate: {
    fontSize: 13,
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Error State
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
