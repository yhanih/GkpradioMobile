import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import Constants from 'expo-constants';
import { navigateRoot } from './notificationNavigation';
import type { RootStackParamList } from '../types/navigation';

const DEFAULT_PROMOTIONS_URL = 'https://godkingdomprinciplesradio.com/promotions';

type PromotionsNavigation = NativeStackNavigationProp<RootStackParamList>;

function buildPromotionsUrl(): string {
  const extra = Constants.expoConfig?.extra as { promotionsUrl?: string } | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_PROMOTIONS_URL?.trim();
  const base = (fromEnv || extra?.promotionsUrl?.trim() || DEFAULT_PROMOTIONS_URL).replace(/\/$/, '');
  const joiner = base.includes('?') ? '&' : '?';
  const params = new URLSearchParams({ source: 'mobile', mobile: '1' });
  return `${base}${joiner}${params.toString()}`;
}

/**
 * Opens promotions inside the app (native toolbar + WebView).
 * Falls back to expo-web-browser only if stack navigation is unavailable.
 */
export async function openPromotionsBrowser(options?: {
  navigation?: any;
}): Promise<void> {
  const url = buildPromotionsUrl();
  const params = {
    url,
    title: 'Promotions',
    returnTab: 'Home' as const,
  };

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
    throw new Error('Could not open promotions');
  }
  await Linking.openURL(url);
}
