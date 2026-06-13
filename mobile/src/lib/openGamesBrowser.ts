import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { buildGamesUrl, type GkpGameId } from './games';
import { navigateRoot } from './notificationNavigation';
import type { RootStackParamList } from '../types/navigation';

type GamesNavigation = NativeStackNavigationProp<RootStackParamList>;

/** Opens a game in the in-app WebView (Return to Radio toolbar). */
export async function openGamesBrowser(
  gameId?: GkpGameId,
  playerName?: string,
  options?: {
    navigation?: any;
    title?: string;
  },
): Promise<void> {
  const url = buildGamesUrl(gameId, playerName);
  const title = options?.title ?? (gameId ? undefined : 'GKP Bible Games');

  const params = { url, title, hideHeader: true };

  if (options?.navigation) {
    try {
      options.navigation.navigate('GameWebView', params);
      return;
    } catch {
      // Fall through to root navigator.
    }
  }

  if (navigateRoot('GameWebView', params)) {
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      dismissButtonStyle: 'done',
      enableBarCollapsing: true,
    });
    return;
  } catch {
    // Fall back to system browser if the in-app browser is unavailable.
  }

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Could not open GKP Bible Games');
  }
  await Linking.openURL(url);
}
