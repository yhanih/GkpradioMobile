import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Initialize Sentry for crash reporting (only if DSN is configured)
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn && !sentryDsn.includes('placeholder')) {
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: sentryDsn,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
      enableAutoPerformanceTracing: true,
    });
  } catch (error) {
    console.warn('Sentry failed to initialize:', error);
  }
} else {
  console.log('Sentry not configured - crash reporting disabled. Set EXPO_PUBLIC_SENTRY_DSN to enable.');
}

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
import { AudioPlayer } from './src/components/AudioPlayer';
import { AudioProvider } from './src/contexts/AudioContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BookmarksProvider } from './src/contexts/BookmarksContext';
import { ToastProvider } from './src/components/Toast';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import { OnboardingScreen, checkOnboardingComplete } from './src/screens/OnboardingScreen';
import * as Linking from 'expo-linking';
import { RootStackParamList, MainTabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();


function MainTabs() {
  const { theme } = useTheme();

  return (
    <>
      <DeepLinkHandler />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
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
              iconName = focused ? 'apps' : 'apps-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          headerShown: false,
          tabBarStyle: {
            height: 88,
            paddingBottom: 30,
            paddingTop: 12,
            borderTopWidth: 0,
            backgroundColor: theme.colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
            elevation: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Live" component={LiveScreen} />
        <Tab.Screen name="Media" component={MediaScreen} />
        <Tab.Screen name="Hub" component={HubScreen} />
      </Tab.Navigator>

      <AudioPlayer />
    </>
  );
}

function DeepLinkHandler() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
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

  if (loading || showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return <RootNavigator />;
}

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
      <NavigationContainer theme={navigationTheme}>
        <AppContent />
      </NavigationContainer>
    </>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <BookmarksProvider>
              <AudioProvider>
                <ToastProvider>
                  <AppWithTheme />
                </ToastProvider>
              </AudioProvider>
            </BookmarksProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
