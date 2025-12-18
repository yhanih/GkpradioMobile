import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * ⚠️ IMPORTANT: Database Table Names (Dec 2024)
 * 
 * See mobile/SCHEMA_REFERENCE.md for complete schema documentation.
 * 
 * Current table names in Supabase:
 * - episodes (not podcasts)
 * - prayercircles (not prayer_requests) - NOTE: no is_testimony column yet
 * - users (not profiles)
 * - videos
 * - communitycomments
 * 
 * If you get "PGRST205: Could not find table" or "42703: column does not exist",
 * check SCHEMA_REFERENCE.md and update your queries.
 */

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Data features will not work. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
