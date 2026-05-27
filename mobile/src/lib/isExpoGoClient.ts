import Constants from 'expo-constants';

/** True when running inside the Expo Go host app (not a standalone/dev client build). */
export function isExpoGoClient(): boolean {
  return Constants.appOwnership === 'expo';
}
