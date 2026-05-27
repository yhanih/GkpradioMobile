import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { buildGamesUrl, type GkpGameId } from './games';

/** Opens the GKP Bible Games hub or a specific game in an in-app browser. */
export async function openGamesBrowser(
  gameId?: GkpGameId,
  playerName?: string,
): Promise<void> {
  const url = buildGamesUrl(gameId, playerName);

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
