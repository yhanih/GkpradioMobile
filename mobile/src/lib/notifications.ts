import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { openPostFromNotification } from './notificationNavigation';

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

    const envProjectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    const easProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const legacyExpoProjectId = Constants.expoConfig?.extra?.expoProjectId as string | undefined;
    const projectId = envProjectId || easProjectId || legacyExpoProjectId;

    if (!projectId) {
      console.warn(
        'Push: missing Expo project id. Set extra.eas.projectId in app config or EXPO_PUBLIC_EXPO_PROJECT_ID.'
      );
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export type NotificationTapHandler = (data: Record<string, unknown>) => void;

function handleNotificationResponseData(data: Record<string, unknown> | undefined, onTap?: NotificationTapHandler) {
  if (!data) return;
  if (onTap) {
    onTap(data);
    return;
  }
  openPostFromNotification(data);
}

export async function consumeInitialNotificationResponse(onTap?: NotificationTapHandler): Promise<void> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return;
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    handleNotificationResponseData(data, onTap);
  } catch (error) {
    console.warn('Failed to read initial notification response:', error);
  }
}

export function setupNotificationListeners(onTap?: NotificationTapHandler) {
  try {
    void consumeInitialNotificationResponse(onTap);

    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      // Foreground notification — banner tap handled by response listener below.
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      handleNotificationResponseData(data, onTap);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  } catch {
    return () => {};
  }
}
