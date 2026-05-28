/* eslint-env node */
/**
 * Omit expo-dev-client from store-style EAS builds (production + preview) so
 * Play builds are standard release binaries. Local / development profile keeps dev client.
 */
const easProfile = process.env.EAS_BUILD_PROFILE;
const includeDevClient = !easProfile || easProfile === 'development';

const plugins = [
  ...(includeDevClient ? ['expo-dev-client'] : []),
  'expo-web-browser',
  'expo-notifications',
  ['expo-font'],
  ['expo-video'],
  [
    'expo-av',
    {
      microphonePermission: 'GKP Radio needs microphone access for audio features.',
    },
  ],
  [
    'expo-audio',
    {
      microphonePermission: 'GKP Radio needs microphone access for audio features.',
      enableBackgroundPlayback: true,
      enableBackgroundRecording: false,
    },
  ],
  [
    'expo-build-properties',
    {
      android: {
        usesCleartextTraffic: true,
      },
      ios: {
        deploymentTarget: '15.1',
      },
    },
  ],
];

module.exports = {
  expo: {
    name: 'GKP Radio',
    slug: 'gkp-radio',
    version: '1.0.5',
    description:
      'God Kingdom Principles Radio - Broadcasting Truth, Building Community, Transforming Lives',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    owner: 'buildright-studio-llc',
    scheme: 'gkpradio',
    primaryColor: '#047857',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gkpradio.mobile',
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        // Lets `Linking.canOpenURL` / system resolve mail & web URLs reliably when needed.
        LSApplicationQueriesSchemes: ['mailto', 'http', 'https', 'itms-apps'],
        NSCameraUsageDescription:
          'GKP Radio needs access to your camera to share moments from our community.',
        NSMicrophoneUsageDescription: 'GKP Radio needs access to your microphone for audio features.',
        NSPhotoLibraryUsageDescription:
          'GKP Radio needs access to your photo library to share images.',
        // audio: live/background radio; remote-notification: APNs for community push
        UIBackgroundModes: ['audio', 'remote-notification'],
        NSAppTransportSecurity: {
          NSExceptionDomains: {
            '74.208.102.89': {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: false,
            },
          },
        },
      },
      associatedDomains: ['applinks:gkpradio.com'],
    },
    android: {
      package: 'com.gkpradio.mobile',
      versionCode: 5,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#047857',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'POST_NOTIFICATIONS',
        'WAKE_LOCK',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'gkpradio.com',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      supabaseUrl: 'https://hgjwpebygzrnkcaflcqh.supabase.co',
      supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnandwZWJ5Z3pybmtjYWZsY3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTIxMzUsImV4cCI6MjA5MTM2ODEzNX0.Hkzd5aR8aktcxAhtb8JK0Xu0H888Ec775jZGpjkI5Ww',
      azuracastBaseUrl: 'http://74.208.102.89:8080',
      privacyPolicyUrl: 'https://godkingdomprinciplesradio.com/privacy',
      /** Set via EAS env / .env: EXPO_PUBLIC_SENTRY_DSN (optional; omit or leave empty to disable) */
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      eas: {
        projectId: '794ab331-d1c6-4158-ac8e-14ce9b083568',
      },
      /** Settings → Share App link (override with EXPO_PUBLIC_APP_SHARE_URL) */
      appShareUrl: process.env.EXPO_PUBLIC_APP_SHARE_URL || 'https://gkpradio.com',
      /** Full App Store URL or set iosAppStoreId / EXPO_PUBLIC_IOS_APP_STORE_ID */
      appStoreUrl: process.env.EXPO_PUBLIC_APP_STORE_URL || '',
      iosAppStoreId: process.env.EXPO_PUBLIC_IOS_APP_STORE_ID || '',
      playStoreUrl:
        process.env.EXPO_PUBLIC_PLAY_STORE_URL ||
        'https://play.google.com/store/apps/details?id=com.gkpradio.mobile',
      wordpressApiBaseUrl:
        process.env.EXPO_PUBLIC_WORDPRESS_API_BASE_URL ||
        'https://godkingdomprinciplesradio.com/apis/wp-json',
      donateUrl:
        process.env.EXPO_PUBLIC_DONATE_URL ||
        'https://godkingdomprinciplesradio.com/donate',
      merchStoreWebUrl:
        process.env.EXPO_PUBLIC_MERCH_STORE_WEB_URL ||
        'https://godkingdomprinciplesradio.com/apis/shop',
      gamesWebUrl:
        process.env.EXPO_PUBLIC_GAMES_WEB_URL ||
        'https://godkingdomprinciplesradio.com/games',
      gamesApiUrl:
        process.env.EXPO_PUBLIC_GAMES_API_URL ||
        'https://godkingdomprinciplesradio.com/api/games',
    },
    plugins,
  },
};
