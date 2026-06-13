import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen } from './src/screens/HomeScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { MediaScreen } from './src/screens/MediaScreen';
import { HubScreen } from './src/screens/HubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { VideoPlayerScreen } from './src/screens/VideoPlayerScreen';
import { EpisodePlayerScreen } from './src/screens/EpisodePlayerScreen';
import { LikedPostsScreen } from './src/screens/LikedPostsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { TermsOfServiceScreen } from './src/screens/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { HelpCenterScreen } from './src/screens/HelpCenterScreen';
import { PromotionsScreen } from './src/screens/PromotionsScreen';
import { DailyScheduleScreen } from './src/screens/DailyScheduleScreen';
import { AudioPlayer } from './src/components/AudioPlayer';
import { TabletMaxWidth } from './src/components/TabletMaxWidth';
import { AudioProvider } from './src/contexts/AudioContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BookmarksProvider } from './src/contexts/BookmarksContext';
import { ToastProvider } from './src/components/Toast';
import { CartProvider } from './src/contexts/CartContext';
import { GlobalCartSheet } from './src/components/GlobalCartSheet';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { MerchStoreScreen } from './src/screens/MerchStoreScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { DonateScreen } from './src/screens/DonateScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { GameWebViewScreen } from './src/screens/GameWebViewScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { ConfirmEmailScreen } from './src/screens/auth/ConfirmEmailScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import {
  OnboardingScreen,
  checkOnboardingComplete,
  resetOnboardingComplete,
} from './src/screens/OnboardingScreen';
import { OnboardingGateProvider } from './src/contexts/OnboardingGateContext';
import { preloadOnboardingAssets } from './src/lib/onboardingAssets';
import * as Linking from 'expo-linking';
import { RootStackParamList, MainTabParamList } from './src/types/navigation';
import { supabase } from './src/lib/supabase';
import { fetchUnreadNotificationCount } from './src/lib/backend';
import { ensureNotificationChannel, ensureNotificationPermissions, setupNotificationListeners, initNotificationHandler } from './src/lib/notifications';
import {
  bindNotificationNavigationRef,
  flushPendingNotificationNavigation,
  openPostFromNotification,
  setPostsNavigationEnabled,
} from './src/lib/notificationNavigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
bindNotificationNavigationRef(navigationRef);

function withTabletMaxWidth<P extends object>(Screen: React.ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <TabletMaxWidth>
        <Screen {...props} />
      </TabletMaxWidth>
    );
  }
  const name = Screen.displayName ?? Screen.name ?? 'Screen';
  Wrapped.displayName = `TabletMaxWidth(${name})`;
  return Wrapped;
}

function MainTabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottomPad = Math.max(insets.bottom, 12);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const initCount = async () => {
      try {
        const count = await fetchUnreadNotificationCount(user.id);
        if (isMounted) setUnreadCount(count);
      } catch (err) {
        console.warn('Failed to fetch initial notification count:', err);
      }
    };
    initCount();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          try {
            const count = await fetchUnreadNotificationCount(user.id);
            if (isMounted) setUnreadCount(count);

            if (payload.eventType === 'INSERT') {
              const newNotif = payload.new as {
                id: string;
                message: string;
                post_id: string;
                type: string;
              };

              const preference = await AsyncStorage.getItem(NOTIFICATION_KEY);
              const notificationsEnabled = preference !== 'false';
              if (!notificationsEnabled) return;

              let title = 'New Notification';
              if (newNotif.type === 'comment') title = 'New Comment';
              else if (newNotif.type === 'like') title = 'New Like';
              else if (newNotif.type === 'pray') title = 'New Prayer';

              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body: newNotif.message,
                  sound: true,
                  data: {
                    post_id: String(newNotif.post_id),
                    type: newNotif.type,
                  },
                },
                trigger: null,
              });
            }
          } catch (err) {
            console.warn('Error handling real-time notification update:', err);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      <DeepLinkHandler />
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Community') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Games') {
              iconName = focused ? 'game-controller' : 'game-controller-outline';
            } else if (route.name === 'Live') {
              iconName = focused ? 'radio' : 'radio-outline';
            } else if (route.name === 'More') {
              iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
            }

            const iconSize = focused ? 28 : 26;
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabel:
            route.name === 'More'
              ? 'More'
              : route.name === 'Community'
                ? 'Community'
                : route.name === 'Games'
                  ? 'Games'
                  : route.name === 'Live'
                    ? 'Live Event'
                    : 'Home',
          headerShown: false,
          tabBarItemStyle: {
            paddingTop: 4,
            paddingBottom: 2,
          },
          tabBarStyle: {
            height: 68 + tabBarBottomPad,
            paddingBottom: tabBarBottomPad,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: theme.dark ? 0.22 : 0.1,
            shadowRadius: 16,
            elevation: 24,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen name="Home" component={withTabletMaxWidth(HomeScreen)} />
        <Tab.Screen name="Community" component={withTabletMaxWidth(CommunityScreen)} />
        <Tab.Screen name="Games" component={withTabletMaxWidth(GamesScreen)} />
        <Tab.Screen name="Live" component={withTabletMaxWidth(LiveScreen)} />
        <Tab.Screen
          name="More"
          component={withTabletMaxWidth(HubScreen)}
          options={{
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
      </Tab.Navigator>

      <AudioPlayer />
    </>
  );
}

const NOTIFICATION_KEY = '@gkp_notifications_enabled';

function CommunityPostNotifier() {
  const { user } = useAuth();
  const [notificationsReady, setNotificationsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const setupPermissions = async () => {
      try {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          if (isMounted) setNotificationsReady(false);
          return;
        }
        await ensureNotificationChannel();
        if (isMounted) setNotificationsReady(true);
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    };

    setupPermissions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notificationsReady) return;

    const channel = supabase
      .channel(`community-post-notifications-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const preference = await AsyncStorage.getItem(NOTIFICATION_KEY);
          const notificationsEnabled = preference !== 'false';
          if (!notificationsEnabled) return;

          const newPost = payload.new as {
            id?: string;
            title?: string;
            content?: string;
            author_id?: string;
            post_type?: string | null;
          };
          const postType = newPost.post_type ?? 'discussion';
          if (postType !== 'discussion') {
            return;
          }
          if (user?.id && newPost.author_id && String(newPost.author_id) === String(user.id)) {
            return;
          }

          const title = 'New Discussion';
          const body = newPost.title?.trim()
            ? `New discussion: ${newPost.title.trim()}`
            : newPost.content?.trim()
              ? newPost.content.trim().slice(0, 140)
              : 'Someone started a new discussion in the community.';

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
              data: newPost.id
                ? {
                    post_id: String(newPost.id),
                    type: 'discussion',
                  }
                : undefined,
            },
            trigger: null,
          });
        } catch (error) {
          console.error('Failed to schedule community notification:', error);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notificationsReady, user?.id]);

  return null;
}

function DeepLinkHandler() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const fragment = url.substring(hashIndex + 1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          } catch (e) {
            console.error('Failed to set session from deep link:', e);
            return;
          }

          if (type === 'recovery') {
            navigation.navigate('ResetPassword');
          }
          return;
        }
      }

      const parsed = Linking.parse(url);
      if (parsed.path === 'reset-password' || url.includes('reset-password')) {
        navigation.navigate('ResetPassword');
      }
    };

    const subscription = Linking.addEventListener('url', (event: { url: string }) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then(handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null;
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ConfirmEmail"
        component={ConfirmEmailScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ animation: 'fade', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="EpisodePlayer"
        component={EpisodePlayerScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="LikedPosts"
        component={LikedPostsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Promotions"
        component={PromotionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DailySchedule"
        component={DailyScheduleScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MerchStore"
        component={MerchStoreScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Donate"
        component={DonateScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Games"
        component={GamesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="GameWebView"
        component={GameWebViewScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Media"
        component={MediaScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[App] Onboarding check safety timeout reached. Unblocking onboarding gate.');
        setShowOnboarding(false);
      }
    }, 2000);

    (async () => {
      try {
        const complete = await checkOnboardingComplete();
        clearTimeout(timer);
        if (cancelled) return;

        if (complete) {
          setShowOnboarding(false);
        } else {
          // Only preload onboarding assets if onboarding is actually needed
          preloadOnboardingAssets().catch(() => undefined);
          setShowOnboarding(true);
        }
      } catch (err) {
        clearTimeout(timer);
        if (!cancelled) {
          setShowOnboarding(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const replayOnboarding = useCallback(async () => {
    await resetOnboardingComplete();
    await preloadOnboardingAssets().catch(() => undefined);
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    const cleanup = setupNotificationListeners((data) => {
      openPostFromNotification(data);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const enabled = !loading && showOnboarding === false;
    setPostsNavigationEnabled(enabled);
    return () => setPostsNavigationEnabled(false);
  }, [loading, showOnboarding]);

  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <OnboardingGateProvider replayOnboarding={replayOnboarding}>
      <CommunityPostNotifier />
      <RootNavigator />
      <GlobalCartSheet />
    </OnboardingGateProvider>
  );
}

const linking = {
  prefixes: [Linking.createURL('/'), 'gkpradio://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

function AppWithTheme() {
  const { isDark, theme } = useTheme();

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        linking={linking}
        onReady={flushPendingNotificationNavigation}
      >
        <AppContent />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  useEffect(() => {
    initNotificationHandler();

    const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (sentryDsn && !sentryDsn.includes('placeholder')) {
      try {
        const Sentry = require('@sentry/react-native');
        Sentry.init({
          dsn: sentryDsn,
          environment: __DEV__ ? 'development' : 'production',
          sendDefaultPii: false,
          tracesSampleRate: __DEV__ ? 1.0 : 0.1,
          enableAutoPerformanceTracing: true,
        });
      } catch (error) {
        console.warn('Sentry failed to initialize:', error);
      }
    } else {
      console.log('Sentry not configured - crash reporting disabled. Set EXPO_PUBLIC_SENTRY_DSN to enable.');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <BookmarksProvider>
              <AudioProvider>
                <ToastProvider>
                  <CartProvider>
                    <AppWithTheme />
                  </CartProvider>
                </ToastProvider>
              </AudioProvider>
            </BookmarksProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
