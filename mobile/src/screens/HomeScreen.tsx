import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  Animated,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../contexts/CartContext';
import { fetchStoreProducts } from '../lib/merch';
import type { Product } from '../types/product';

import {
  fetchHomeStats,
  fetchPodcasts,
  fetchVideos,
} from '../lib/backend';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, type Theme } from '../contexts/ThemeContext';

import { MediaRail } from '../components/MediaRail';
import { SponsorBanner } from '../components/SponsorBanner';
import { StatsStrip } from '../components/StatsStrip';
import { MinistryFieldsList } from '../components/MinistryFieldsList';
import { SkeletonList } from '../components/SkeletonLoader';
import { Category, getPostTypeForCategory } from '../constants/categories';

interface Episode {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  thumbnail_url?: string;
  audio_url?: string;
  duration?: number;
}

interface Video {
  id: string;
  title: string;
  created_at?: string;
  thumbnail_url?: string;
  video_url?: string;
  duration?: number;
}

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Scroll runway before sponsor strip — end-credits reveal after main content */
const END_CREDITS_RUNWAY_MIN = 128;
const END_CREDITS_RUNWAY_MAX = 240;
const SCROLL_BOTTOM_SAFE_PADDING = 100;

export function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const navigation = useNavigation<HomeNavigationProp>();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const endCreditsRunwayHeight = Math.min(
    END_CREDITS_RUNWAY_MAX,
    Math.max(END_CREDITS_RUNWAY_MIN, Math.round(windowHeight * 0.2)),
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');
  const { cartCount, addToCart, openCart } = useCart();

  // Data State
  const [featuredEpisodes, setFeaturedEpisodes] = useState<Episode[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [homeStats, setHomeStats] = useState({
    familyMembers: 0,
    prayersLifted: 0,
    mediaItems: 0,
  });
  const [spotlightProducts, setSpotlightProducts] = useState<Product[]>([]);
  const [merchLoading, setMerchLoading] = useState(true);

  // Animation State
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchStoreProducts();
        if (mounted) setSpotlightProducts(list.slice(0, 3));
      } catch (error) {
        if (__DEV__) {
          console.warn(
            '[HomeScreen] Merch spotlight unavailable:',
            error instanceof Error ? error.message : error,
          );
        }
        if (mounted) setSpotlightProducts([]);
      } finally {
        if (mounted) setMerchLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
    const fullName = user?.fullname?.trim();
    const emailName = user?.email?.split('@')?.[0];
    setUserName(fullName || emailName || 'Friend');
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshStats = async () => {
      try {
        const stats = await fetchHomeStats();
        if (mounted) setHomeStats(stats);
      } catch (error) {
        console.error('[HomeScreen] Error fetching home stats:', error);
      }
    };

    const queueStatsRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshStats();
      }, 250);
    };

    refreshStats();

    const channel = supabase
      .channel('home-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'podcasts' }, queueStatsRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, queueStatsRefresh)
      .subscribe();

    return () => {
      mounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    console.log('[HomeScreen] fetchData started');
    try {
      setLoading(true);

      const [podcastsRes, videosRes] = await Promise.all([
        fetchPodcasts(5),
        fetchVideos(3),
      ]);

      setFeaturedEpisodes(podcastsRes.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        description: p.description,
        created_at: p.created_at,
        thumbnail_url: p.thumbnail_url,
        audio_url: p.audio_url
      } as any)));

      setRecentVideos(videosRes.map((v: any) => ({
        id: String(v.id),
        title: v.title,
        created_at: v.created_at,
        thumbnail_url: v.thumbnail_url,
        video_url: v.video_url
      } as any)));

      console.log(`[HomeScreen] State updated: ${podcastsRes.length || 0} pods, ${videosRes.length || 0} vids`);

    } catch (error: any) {
      console.error('[HomeScreen] Error fetching dashboard data:', error);
      if (error && error.stack) console.error(error.stack);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleMinistryCategoryPress = (category: Category) => {
    const postType = getPostTypeForCategory(category.id);
    navigation.navigate('Community', {
      categoryId: category.id,
      mode: postType === 'prayer' ? 'prayers' : 'discussions',
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header with Greeting */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.brandingText}>GOD KINGDOM PRINCIPLES RADIO</Text>
            <Text style={styles.greetingText} numberOfLines={1}>{getGreeting()}, {userName}</Text>
          </View>
          <View style={styles.headerRightActions}>
            <Pressable
              style={({ pressed }) => [
                styles.headerCartButton,
                { backgroundColor: theme.colors.surface },
                pressed && styles.headerCartButtonPressed
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                openCart();
              }}
              accessibilityLabel="Open shopping cart"
              accessibilityRole="button"
            >
              <Ionicons name="cart-outline" size={22} color={theme.colors.text} />
              {cartCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>

            {user ? (
              <ProfileAvatar
                uri={user.avatarurl || null}
                name={user.fullname}
                email={user.email}
                userId={user.id}
                avatarSeed={user.avatarseed}
                size="medium"
                showBorder
                onPress={() => navigation.navigate('Profile')}
                showOnlineIndicator
                accessibilityLabel="Open profile"
                accessibilityRole="button"
              />
            ) : (
              <Pressable
                style={styles.signInAvatar}
                onPress={() => navigation.navigate('Login', { redirectBack: true })}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                <Text style={styles.signInAvatarText}>Sign in</Text>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: SCROLL_BOTTOM_SAFE_PADDING }}
        >
          <View style={{ height: 12 }} />

          {loading ? (
            <>
              {/* Welcome Text Skeleton */}
              <View style={styles.welcomeSection}>
                <View style={[styles.skeletonBar, { width: '60%', height: 28, marginBottom: 8 }]} />
                <View style={[styles.skeletonBar, { width: '80%', height: 28, marginBottom: 8 }]} />
                <View style={[styles.skeletonBar, { width: '100%', height: 22, marginBottom: 12 }]} />
              </View>

              {/* Stats Skeleton */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 32 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <View style={[styles.skeletonBar, { height: 40, width: 40, borderRadius: 20, marginBottom: 8 }]} />
                    <View style={[styles.skeletonBar, { height: 12, width: 60, borderRadius: 6 }]} />
                  </View>
                ))}
              </View>

              {/* Media Rails Skeleton */}
              <SkeletonList count={1} type="media" />
              <SkeletonList count={1} type="media" />
            </>
          ) : (
            <>
              {/* Brand Stats */}
              <StatsStrip
                familyMembers={homeStats.familyMembers}
                prayersLifted={homeStats.prayersLifted}
                mediaItems={homeStats.mediaItems}
              />

              {/* Ministry Fields (Brand Element from Web) */}
              <MinistryFieldsList onPressItem={handleMinistryCategoryPress} />

              {/* Podcast Rail */}
              {console.log('[HomeScreen] Rendering podcast rail, count:', featuredEpisodes.length)}
              {featuredEpisodes.length > 0 ? (
                <MediaRail
                  title="Faith on Demand"
                  type="podcast"
                  items={featuredEpisodes.map(ep => ({
                    id: ep.id,
                    title: ep.title,
                    subtitle: new Date(ep.created_at || new Date().toISOString()).toLocaleDateString(),
                    imageUrl: ep.thumbnail_url || undefined,
                    duration: ep.duration ? `${Math.floor(ep.duration / 60)}m` : undefined
                  }))}
                  onPressItem={(item) => {
                    const episode = featuredEpisodes.find(ep => ep.id === item.id);
                    if (episode) {
                      navigation.navigate('EpisodePlayer', { episode });
                    }
                  }}
                  onPressViewAll={() => navigation.navigate('Media')}
                />
              ) : null}

              {/* Video Rail */}
              {console.log('[HomeScreen] Rendering video rail, count:', recentVideos.length)}
              {recentVideos.length > 0 ? (
                <MediaRail
                  title="Watch & Learn"
                  type="video"
                  items={recentVideos.map(vid => ({
                    id: vid.id,
                    title: vid.title,
                    subtitle: 'GKP TV',
                    imageUrl: vid.thumbnail_url || undefined,
                    duration: vid.duration ? `${Math.floor(vid.duration / 60)}m` : undefined
                  }))}
                  onPressItem={(item) => {
                    const video = recentVideos.find(vid => vid.id === item.id);
                    if (video) {
                      navigation.navigate('VideoPlayer', { video });
                    }
                  }}
                  onPressViewAll={() => navigation.navigate('Media')}
                />
              ) : null}

              {/* Bible Games CTA */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('Games');
                }}
                style={({ pressed }) => [
                  styles.donateCard,
                  pressed && styles.donateCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Play GKP Bible Games"
              >
                <View style={styles.donateIconContainer}>
                  <Ionicons name="game-controller" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.donateTextContainer}>
                  <Text style={styles.donateTitle}>GKP Bible Games</Text>
                  <Text style={styles.donateSubtitle}>
                    Play & climb the Kingdom leaderboard
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </Pressable>

              {/* Support the Ministry CTA */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('Donate');
                }}
                style={({ pressed }) => [
                  styles.donateCard,
                  pressed && styles.donateCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Support GKP Radio with a donation"
              >
                <View style={styles.donateIconContainer}>
                  <Ionicons name="heart" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.donateTextContainer}>
                  <Text style={styles.donateTitle}>Support GKP Radio</Text>
                  <Text style={styles.donateSubtitle}>
                    Help us keep the gospel on the air
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </Pressable>

              {/* Ministry Merch Spotlight Rail */}
              <View style={styles.spotlightContainer}>
                <View style={styles.spotlightHeader}>
                  <Text style={styles.spotlightTitle}>Ministry Merch</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('MerchStore');
                    }}
                    style={({ pressed }) => [
                      styles.viewAllButton,
                      pressed && styles.viewAllButtonPressed,
                    ]}
                  >
                    <Text style={styles.viewAllText}>View Store</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.spotlightScroll}
                >
                  {merchLoading ? (
                    <View style={styles.spotlightLoading}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                  ) : null}
                  {!merchLoading &&
                    spotlightProducts.map((product) => (
                    <Pressable
                      key={product.id}
                      style={({ pressed }) => [
                        styles.spotlightCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                        pressed && styles.spotlightCardPressed,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('ProductDetail', { product });
                      }}
                    >
                      <Image source={{ uri: product.image }} style={styles.spotlightImage} />
                      <View style={styles.spotlightInfo}>
                        <Text style={styles.spotlightProductCategory} numberOfLines={1}>
                          {product.category.toUpperCase()}
                        </Text>
                        <Text style={styles.spotlightProductName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <View style={styles.spotlightFooter}>
                          <Text style={styles.spotlightPrice}>${product.price.toFixed(2)}</Text>
                          <Pressable
                            style={({ pressed }) => [
                              styles.spotlightAddButton,
                              { backgroundColor: theme.colors.primaryLight },
                              pressed && styles.spotlightAddButtonPressed,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              const size = product.sizes ? product.sizes[0] : undefined;
                              const color = product.colors ? product.colors[0] : undefined;
                              addToCart({
                                productId: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                category: product.category,
                                size,
                                color,
                                quantity: 1,
                              });
                            }}
                          >
                            <Ionicons name="add" size={16} color={theme.colors.primary} />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.endCreditsSection}>
            <LinearGradient
              colors={[`${theme.colors.background}00`, theme.colors.background]}
              style={styles.endCreditsFade}
              pointerEvents="none"
            />
            <View style={[styles.endCreditsRunway, { minHeight: endCreditsRunwayHeight }]} />
            <View style={styles.sponsorFooter}>
              <View style={styles.endCreditsRule} />
              <View style={styles.sponsorBannerShell}>
                <SponsorBanner variant="credits" />
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerCartButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    headerCartButtonPressed: {
      opacity: 0.7,
    },
    cartBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    cartBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    donateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      gap: 12,
    },
    donateCardPressed: {
      opacity: 0.7,
    },
    donateIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    donateTextContainer: {
      flex: 1,
    },
    donateTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    donateSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    endCreditsSection: {
      marginTop: 8,
    },
    endCreditsFade: {
      height: 48,
      marginBottom: -48,
    },
    endCreditsRunway: {
      width: '100%',
    },
    sponsorFooter: {
      marginHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 8,
      alignItems: 'center',
    },
    endCreditsRule: {
      width: 48,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      opacity: 0.55,
      marginBottom: 20,
      alignSelf: 'center',
    },
    sponsorBannerShell: {
      alignSelf: 'stretch',
      borderRadius: 8,
      overflow: 'hidden',
    },
    spotlightContainer: {
      marginTop: 12,
      marginBottom: 12,
    },
    spotlightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    spotlightTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewAllButtonPressed: {
      opacity: 0.7,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    spotlightLoading: {
      width: 120,
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spotlightScroll: {
      paddingLeft: 20,
      paddingRight: 20,
      gap: 12,
    },
    spotlightCard: {
      width: 160,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    spotlightCardPressed: {
      opacity: 0.95,
    },
    spotlightImage: {
      width: '100%',
      height: 120,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
    },
    spotlightInfo: {
      padding: 10,
    },
    spotlightProductCategory: {
      fontSize: 8,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    spotlightProductName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    spotlightFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    spotlightPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    spotlightAddButton: {
      width: 28,
      height: 28,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spotlightAddButtonPressed: {
      opacity: 0.7,
    },
    signInAvatar: {
      minWidth: 74,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    signInAvatarText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    brandingText: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 2,
    },
    greetingText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '600',
    },
    welcomeSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    skeletonBar: {
      backgroundColor: theme.colors.border,
      borderRadius: 8,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: '400',
      color: theme.colors.text,
    },
    welcomeBrand: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.warning,
      lineHeight: 34,
    },
    welcomeBrandSuffix: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      lineHeight: 34,
      marginBottom: 12,
    },
    welcomeSubtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
  });
}
