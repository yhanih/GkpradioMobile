import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const TERMS_PENDING_STORAGE_KEY = '@gkp_terms_acceptance_pending';

export async function fetchTermsAcceptedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('terms_accepted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Could not load terms acceptance status.');
  }

  return data?.terms_accepted_at ?? null;
}

export async function recordTermsAcceptance(userId: string): Promise<void> {
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ terms_accepted_at: now })
    .eq('id', userId)
    .select('id');

  if (updateError) {
    throw new Error(updateError.message || 'Could not save terms acceptance.');
  }

  if (!updated || updated.length === 0) {
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: userId,
      terms_accepted_at: now,
    });
    if (upsertError) {
      throw new Error(upsertError.message || 'Could not save terms acceptance.');
    }
  }

  await AsyncStorage.removeItem(TERMS_PENDING_STORAGE_KEY).catch(() => {});
}

export async function markTermsAcceptancePending(): Promise<void> {
  await AsyncStorage.setItem(TERMS_PENDING_STORAGE_KEY, '1');
}

export async function applyPendingTermsAcceptance(userId: string): Promise<void> {
  const pending = await AsyncStorage.getItem(TERMS_PENDING_STORAGE_KEY);
  if (pending !== '1') return;
  await recordTermsAcceptance(userId);
}
