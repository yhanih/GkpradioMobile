import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gkpradio.app',
  appName: 'GKP Radio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
    backgroundColor: '#F8FAFC'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#00A86B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#00A86B'
    },
    Keyboard: {
      resize: 'native',
      style: 'light',
      resizeOnFullScreen: true
    }
  }
};

export default config;
