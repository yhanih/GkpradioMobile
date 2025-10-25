import 'dotenv/config';

export default {
  expo: {
    name: 'GKP Radio',
    slug: 'gkp-radio',
    version: '1.0.0',
    sdkVersion: '54.0.0',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#047857',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gkpradio.app',
      infoPlist: {
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      package: 'com.gkpradio.app',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
    web: {},
    plugins: ['expo-router'],
    scheme: 'gkpradio',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'your-project-id-here',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      azuracastBaseUrl: process.env.EXPO_PUBLIC_AZURACAST_BASE_URL || 'http://74.208.102.89:8080',
      azuracastStationId: process.env.EXPO_PUBLIC_AZURACAST_STATION_ID || '1',
    },
  },
};
