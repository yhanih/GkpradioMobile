// import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, unknown>;

const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ??
  (extra.supabaseUrl as string | undefined);

const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  (extra.supabaseAnonKey as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env, or set expo.extra.supabaseUrl and expo.extra.supabaseAnonKey in app.json.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
