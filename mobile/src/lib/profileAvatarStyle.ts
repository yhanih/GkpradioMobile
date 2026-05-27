import { supabase } from './supabase';
import { APP_AVATAR_STYLE, normalizeAvatarSeed } from '../components/ui/avatar/avatarVariants';

export type ProfileFieldsPatch = {
  full_name?: string | null;
  bio?: string | null;
  avatar_seed?: string | null;
};

/**
 * Persist profile fields for the signed-in user. Uses UPDATE first (RLS-safe), then upsert if no row exists.
 */
export async function saveProfileFields(
  userId: string,
  patch: ProfileFieldsPatch,
): Promise<{ error: Error | null }> {
  const payload: Record<string, unknown> = {
    avatar_style: APP_AVATAR_STYLE,
  };

  if (patch.full_name !== undefined) {
    payload.full_name = patch.full_name;
  }
  if (patch.bio !== undefined) {
    payload.bio = patch.bio;
  }
  if (patch.avatar_seed !== undefined) {
    payload.avatar_seed = patch.avatar_seed
      ? normalizeAvatarSeed(patch.avatar_seed, userId)
      : null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id');

  if (updateError) {
    return { error: updateError };
  }

  if (updated && updated.length > 0) {
    return { error: null };
  }

  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: userId,
    ...payload,
  });

  return { error: upsertError };
}

/** Sync avatar seed from auth metadata after email verification / first session. */
export async function syncAvatarFromAuthMetadata(
  userId: string,
  metadata?: Record<string, unknown> | null,
  fullName?: string | null,
): Promise<void> {
  const avatarSeed = metadata?.avatar_seed ?? metadata?.avatar_style;
  if (typeof avatarSeed !== 'string' && !fullName) {
    return;
  }

  const patch: ProfileFieldsPatch = {};
  if (typeof avatarSeed === 'string') {
    patch.avatar_seed = normalizeAvatarSeed(avatarSeed, userId);
  }
  if (fullName !== undefined) {
    patch.full_name = fullName;
  }

  const { error } = await saveProfileFields(userId, patch);
  if (error) {
    console.warn('[Profile] syncAvatarFromAuthMetadata:', error.message);
  }
}
