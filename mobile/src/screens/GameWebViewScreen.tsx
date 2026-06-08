import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';

type GameWebViewRoute = RouteProp<RootStackParamList, 'GameWebView'>;
type GameWebViewNav = NativeStackNavigationProp<RootStackParamList, 'GameWebView'>;

export function GameWebViewScreen() {
  const navigation = useNavigation<GameWebViewNav>();
  const route = useRoute<GameWebViewRoute>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const { url, title, returnTab = 'Live' } = route.params;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const returnLabel = returnTab === 'Home' ? 'Back to Home' : 'Return to Radio';
  const returnIcon = returnTab === 'Home' ? 'home' : 'radio';

  const handleReturn = () => {
    navigation.navigate('MainTabs', { screen: returnTab });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.toolbar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Pressable
          onPress={handleReturn}
          style={({ pressed }) => [styles.returnButton, pressed && styles.returnButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={returnLabel}
        >
          <Ionicons name={returnIcon} size={20} color="#fff" />
          <Text style={styles.returnButtonText}>{returnLabel}</Text>
        </Pressable>
        {title ? (
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close game"
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}

      {isFocused && (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      gap: 8,
    },
    returnButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      maxWidth: '46%',
    },
    returnButtonPressed: {
      opacity: 0.88,
    },
    returnButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    closeButton: {
      padding: 4,
    },
    loadingWrap: {
      ...StyleSheet.absoluteFill,
      top: 56,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      backgroundColor: theme.colors.background,
    },
    webview: {
      flex: 1,
    },
  });
}
