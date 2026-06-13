import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Legacy manifest shape (SDK 49+ types omit `extra` on EmbeddedManifest). */
type LegacyExpoManifest = { extra?: Record<string, unknown> } | null | undefined;
const legacyExtra = (Constants.manifest as LegacyExpoManifest)?.extra;
const extra = (Constants.expoConfig?.extra ?? legacyExtra ?? {}) as Record<string, unknown>;

const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const extraSupabaseUrl = extra.supabaseUrl as string | undefined;
const supabaseUrlCandidate = envSupabaseUrl ?? extraSupabaseUrl;

const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  (extra.supabaseAnonKey as string | undefined);

function isValidHttpUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const supabaseUrl = isValidHttpUrl(supabaseUrlCandidate)
  ? supabaseUrlCandidate
  : isValidHttpUrl(extraSupabaseUrl)
    ? extraSupabaseUrl
    : undefined;

if (envSupabaseUrl && !isValidHttpUrl(envSupabaseUrl)) {
  console.warn('EXPO_PUBLIC_SUPABASE_URL is invalid. Falling back to app config extra.supabaseUrl.');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env, or set expo.extra.supabaseUrl and expo.extra.supabaseAnonKey in app.config.js.'
  );
}

const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
