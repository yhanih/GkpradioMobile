import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Remote push is not available in Expo Go on Android (SDK 53+). Avoid calling native token APIs there. */
function isExpoGoAndroid(): boolean {
  return Constants.appOwnership === 'expo' && Platform.OS === 'android';
}

/** Call once after the RN runtime is ready (e.g. inside a root useEffect). */
export function initNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Expo Go / partial native module — local scheduling may still be limited
  }
}

const DEFAULT_ANDROID_CHANNEL_ID = 'community-posts';

export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
      name: 'Community Posts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
  } catch (error) {
    console.error('Error configuring notification channel:', error);
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.granted) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGoAndroid()) {
    return null;
  }

  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      console.warn('Notification permissions not granted. Push notifications will not work.');
      return null;
    }
    await ensureNotificationChannel();

    if (Platform.OS === 'web') {
      return null;
    }

    // EAS `extra.eas.projectId` is the canonical Expo project UUID for push; avoid a stale `expoProjectId` winning.
    const envProjectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    const easProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const legacyExpoProjectId = Constants.expoConfig?.extra?.expoProjectId as string | undefined;
    const projectId = envProjectId || easProjectId || legacyExpoProjectId;

    // #region agent log
    fetch('http://127.0.0.1:7678/ingest/06ebe8b1-f553-462c-9985-421ab8769eec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1b6f67' },
      body: JSON.stringify({
        sessionId: '1b6f67',
        runId: 'push-register-pre',
        hypothesisId: 'H1-env-override',
        location: 'notifications.ts:registerForPushNotifications',
        message: 'push projectId resolution',
        data: {
          hasEnvProjectId: !!envProjectId,
          easProjectIdPresent: !!easProjectId,
          legacyExpoProjectIdPresent: !!legacyExpoProjectId,
          resolvedProjectId: projectId ?? null,
          appOwnership: Constants.appOwnership,
          configOwner: Constants.expoConfig?.owner ?? null,
          slug: Constants.expoConfig?.slug ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!projectId) {
      console.warn(
        'Push: missing Expo project id. Set extra.eas.projectId in app config or EXPO_PUBLIC_EXPO_PROJECT_ID.'
      );
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // #region agent log
    fetch('http://127.0.0.1:7678/ingest/06ebe8b1-f553-462c-9985-421ab8769eec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1b6f67' },
      body: JSON.stringify({
        sessionId: '1b6f67',
        runId: 'push-register-pre',
        hypothesisId: 'H3-token-ok',
        location: 'notifications.ts:registerForPushNotifications',
        message: 'push token success',
        data: { ok: true, tokenLength: token?.data?.length ?? 0 },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return token.data;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7678/ingest/06ebe8b1-f553-462c-9985-421ab8769eec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1b6f67' },
      body: JSON.stringify({
        sessionId: '1b6f67',
        runId: 'push-register-pre',
        hypothesisId: 'H2-experience-or-api',
        location: 'notifications.ts:registerForPushNotifications',
        message: 'push token error',
        data: { err: error instanceof Error ? error.message.slice(0, 400) : String(error).slice(0, 400) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export type NotificationTapHandler = (data: Record<string, unknown>) => void;

export function setupNotificationListeners(onTap?: NotificationTapHandler) {
  try {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Foreground notification — the handler above already shows the alert
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        if (data && onTap) {
          onTap(data);
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  } catch {
    return () => {};
  }
}
