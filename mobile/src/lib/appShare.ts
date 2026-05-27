import { Alert, Linking, Platform, Share } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';

const DEFAULT_SHARE_URL = 'https://gkpradio.com';
const ANDROID_PACKAGE = 'com.gkpradio.mobile';

function extraString(key: string): string {
  const value = Constants.expoConfig?.extra?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Public link shared via Settings → Share App */
export function getAppShareUrl(): string {
  return (
    process.env.EXPO_PUBLIC_APP_SHARE_URL?.trim() ||
    extraString('appShareUrl') ||
    DEFAULT_SHARE_URL
  );
}

/** Full App Store listing URL (set EXPO_PUBLIC_APP_STORE_URL when live on the store) */
export function getAppStoreListingUrl(): string | null {
  const explicit =
    process.env.EXPO_PUBLIC_APP_STORE_URL?.trim() || extraString('appStoreUrl');
  if (explicit) return explicit;

  const iosAppId =
    process.env.EXPO_PUBLIC_IOS_APP_STORE_ID?.trim() || extraString('iosAppStoreId');
  if (iosAppId) {
    return `https://apps.apple.com/app/id${iosAppId}`;
  }

  return null;
}

export function getPlayStoreListingUrl(): string {
  return (
    process.env.EXPO_PUBLIC_PLAY_STORE_URL?.trim() ||
    extraString('playStoreUrl') ||
    `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
  );
}

export function getStoreListingUrl(): string | null {
  if (Platform.OS === 'ios') return getAppStoreListingUrl();
  if (Platform.OS === 'android') return getPlayStoreListingUrl();
  return getAppStoreListingUrl() ?? getPlayStoreListingUrl();
}

/** Prefer native store deep links on device; fall back to https. */
export async function openStoreListing(): Promise<boolean> {
  const httpsUrl = getStoreListingUrl();
  if (!httpsUrl) {
    Alert.alert(
      'Coming Soon',
      'GKP Radio is not listed in the app store yet. Share the website link with friends for now.'
    );
    return false;
  }

  const candidates: string[] =
    Platform.OS === 'ios'
      ? [
          (() => {
            const iosAppId =
              process.env.EXPO_PUBLIC_IOS_APP_STORE_ID?.trim() || extraString('iosAppStoreId');
            return iosAppId ? `itms-apps://apps.apple.com/app/id${iosAppId}` : null;
          })(),
          httpsUrl,
        ].filter((url): url is string => Boolean(url))
      : Platform.OS === 'android'
        ? [`market://details?id=${ANDROID_PACKAGE}`, httpsUrl]
        : [httpsUrl];

  for (const url of candidates) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) continue;
      await Linking.openURL(url);
      return true;
    } catch {
      // try next candidate
    }
  }

  Alert.alert('Could not open store', 'Please try again later.');
  return false;
}

const SHARE_MESSAGE =
  'Check out GKP Radio — faith-based live radio, media, and a supportive community.';

/** Run after Pressable completes so iOS share sheet / Linking are not swallowed. */
export function runAfterPress(action: () => void | Promise<void>): void {
  setTimeout(() => {
    void Promise.resolve(action()).catch((error) => {
      console.error('Deferred settings action failed:', error);
    });
  }, 0);
}

export async function shareApp(): Promise<void> {
  const url = getAppShareUrl();

  // iOS: pass a single message string (url + message together is unreliable).
  // Android: include title + message with URL.
  const content =
    Platform.OS === 'ios'
      ? { message: `${SHARE_MESSAGE}\n\n${url}` }
      : { message: `${SHARE_MESSAGE}\n\n${url}`, title: 'Share GKP Radio' };

  const result = await Share.share(content);

  if (result.action === Share.dismissedAction) {
    return;
  }
}

export async function rateApp(): Promise<void> {
  let usedNativeReview = false;

  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      usedNativeReview = true;
    }
  } catch (error) {
    console.warn('Native in-app review unavailable:', error);
  }

  const storeUrl = getStoreListingUrl();

  if (storeUrl) {
    Alert.alert(
      usedNativeReview ? 'Thank you!' : 'Rate GKP Radio',
      usedNativeReview
        ? 'If the rating prompt did not appear, you can leave a review in the App Store.'
        : 'Would you like to rate GKP Radio in the store?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: Platform.OS === 'ios' ? 'Open App Store' : 'Open Play Store',
          onPress: () => {
            void openStoreListing();
          },
        },
      ]
    );
    return;
  }

  if (!usedNativeReview) {
    Alert.alert(
      'Thank you!',
      'GKP Radio is not on the app store yet. Share the app link with others from Settings → Share App.'
    );
  }
}
