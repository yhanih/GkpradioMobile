import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AudioPlayerProvider } from '../contexts/AudioPlayerContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AudioPlayerProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AudioPlayerProvider>
    </SafeAreaProvider>
  );
}
