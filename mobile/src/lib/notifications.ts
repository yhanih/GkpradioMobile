import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

    // Get the push token
    const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ||
      Constants.expoConfig?.extra?.expoProjectId ||
      Constants.expoConfig?.extra?.eas?.projectId ||
      '3cc18e67-a1d7-4f5a-bcc5-48e3dde78f96'; // Fallback

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      // Handle notification when app is in foreground
    }
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      // Handle notification tap
    }
  );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
