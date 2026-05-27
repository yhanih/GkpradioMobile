import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { buildDonationUrl } from './donation';

/**
 * Opens the giving page in an isolated in-app browser so a stale Safari
 * sessionStorage draft cannot override the amount from the query string.
 */
export async function openDonationBrowser(amount: number): Promise<void> {
  const url = buildDonationUrl(amount);

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
    throw new Error('Could not open the giving page');
  }
  await Linking.openURL(url);
}
