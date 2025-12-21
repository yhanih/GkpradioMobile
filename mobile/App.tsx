import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { MediaScreen } from './src/screens/MediaScreen';
import { HubScreen } from './src/screens/HubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { AudioPlayer } from './src/components/AudioPlayer';
import { AudioProvider } from './src/contexts/AudioContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { OnboardingScreen, checkOnboardingComplete } from './src/screens/OnboardingScreen';
import { RootStackParamList, MainTabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function ProfileScreenWrapper({
  showSignup,
  setShowSignup
}: {
  showSignup: boolean;
  setShowSignup: (show: boolean) => void;
}) {
  const { user } = useAuth();

  if (!user) {
    if (showSignup) {
      return <SignupScreen onNavigateToLogin={() => setShowSignup(false)} />;
    }
    return <LoginScreen onNavigateToSignup={() => setShowSignup(true)} />;
  }

  return <ProfileScreen />;
}

function MainTabs() {
  const { theme } = useTheme();
  
  return (
    <>
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

      <MiniPlayer />
      <AudioPlayer />
    </>
  );
}

function RootNavigator() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Profile"
        options={{
          animation: 'slide_from_right',
        }}
      >
        {() => (
          <ProfileScreenWrapper
            showSignup={showSignup}
            setShowSignup={setShowSignup}
          />
        )}
      </Stack.Screen>
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AudioProvider>
            <AppWithTheme />
          </AudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
