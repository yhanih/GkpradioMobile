import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { PodcastsScreen } from './src/screens/PodcastsScreen';
import { VideoScreen } from './src/screens/VideoScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { AudioPlayer } from './src/components/AudioPlayer';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home';

              if (route.name === 'Home') {
                iconName = 'home';
              } else if (route.name === 'Community') {
                iconName = 'people';
              } else if (route.name === 'Podcasts') {
                iconName = 'mic';
              } else if (route.name === 'Video') {
                iconName = 'videocam';
              } else if (route.name === 'Live') {
                iconName = 'radio';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#047857',
            tabBarInactiveTintColor: '#71717a',
            headerShown: false,
            tabBarStyle: {
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: 'rgba(228, 228, 231, 0.5)',
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 10,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Community" component={CommunityScreen} />
          <Tab.Screen name="Podcasts" component={PodcastsScreen} />
          <Tab.Screen name="Video" component={VideoScreen} />
          <Tab.Screen name="Live" component={LiveScreen} />
        </Tab.Navigator>
        
        <AudioPlayer />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
