import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    // For development/Expo Go, this won't work - requires development build
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) {
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn('Notification permissions not granted. Push notifications will not work.');
        return null;
      }
    }

    // Get the push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '3cc18e67-a1d7-4f5a-bcc5-48e3dde78f96', // Replace with your Expo project ID
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
