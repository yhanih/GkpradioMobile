import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { getStoreWebShopUrl, normalizeStoreCheckoutUrl } from './storeUrls';

export function getMerchStoreWebUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_MERCH_STORE_WEB_URL?.trim();
  const extra = Constants.expoConfig?.extra as { merchStoreWebUrl?: string } | undefined;
  const candidate = fromEnv || extra?.merchStoreWebUrl?.trim();
  if (candidate) {
    return normalizeStoreCheckoutUrl(candidate.replace(/\/$/, ''));
  }
  return getStoreWebShopUrl().replace(/\/$/, '');
}

/** Opens the ministry store on the website (fallback when the in-app catalog API is down). */
export async function openMerchStoreBrowser(): Promise<void> {
  const url = `${getMerchStoreWebUrl()}?source=mobile`;

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
    throw new Error('Could not open the ministry store in your browser');
  }
  await Linking.openURL(url);
}
