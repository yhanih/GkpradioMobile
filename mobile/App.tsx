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
import { TermsOfServiceScreen } from './src/screens/TermsOfServiceScreen';
import { AudioPlayer } from './src/components/AudioPlayer';
import { TabletMaxWidth } from './src/components/TabletMaxWidth';
import { AudioProvider } from './src/contexts/AudioContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BookmarksProvider } from './src/contexts/BookmarksContext';
import { ToastProvider } from './src/components/Toast';
import { CartProvider } from './src/contexts/CartContext';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { MerchStoreScreen } from './src/screens/MerchStoreScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { DonateScreen } from './src/screens/DonateScreen';
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
import * as Linking from 'expo-linking';
import { RootStackParamList, MainTabParamList } from './src/types/navigation';
import { supabase } from './src/lib/supabase';
import { ensureNotificationChannel, ensureNotificationPermissions, setupNotificationListeners, initNotificationHandler } from './src/lib/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

  return (
    <>
      <DeepLinkHandler />
      <Tab.Navigator
        initialRouteName="Community"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Community') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Live') {
              iconName = focused ? 'radio' : 'radio-outline';
            } else if (route.name === 'Media') {
              iconName = focused ? 'play-circle' : 'play-circle-outline';
            } else if (route.name === 'Hub') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            const iconSize = focused ? 28 : 26;
            return <Ionicons name={iconName} size={iconSize} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabel:
            route.name === 'Hub'
              ? 'Settings'
              : route.name === 'Community'
                ? 'Community'
                : route.name === 'Live'
                  ? 'Live'
                  : route.name === 'Media'
                    ? 'Media'
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
        <Tab.Screen name="Live" component={withTabletMaxWidth(LiveScreen)} />
        <Tab.Screen name="Media" component={withTabletMaxWidth(MediaScreen)} />
        <Tab.Screen name="Hub" component={withTabletMaxWidth(HubScreen)} />
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
      .channel('community-post-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        try {
          const preference = await AsyncStorage.getItem(NOTIFICATION_KEY);
          const notificationsEnabled = preference !== 'false';
          if (!notificationsEnabled) return;

          const newPost = payload.new as { title?: string; content?: string; author_id?: string };
          if (user?.id && newPost.author_id && String(newPost.author_id) === String(user.id)) {
            return;
          }

          const title = newPost.title?.trim()
            ? `New community post: ${newPost.title.trim()}`
            : 'New community message';
          const body = newPost.content?.trim()
            ? newPost.content.trim().slice(0, 140)
            : 'Someone posted a new message in the community.';

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
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
        name="TermsOfService"
        component={TermsOfServiceScreen}
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
    </Stack.Navigator>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete);
    });
  }, []);

  const replayOnboarding = useCallback(async () => {
    await resetOnboardingComplete();
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    const cleanup = setupNotificationListeners((data) => {
      const postId = data.post_id as string | undefined;
      if (postId && navigationRef.isReady()) {
        navigationRef.navigate('PostDetail', { threadId: postId });
      }
    });
    return cleanup;
  }, []);

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
      <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
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
