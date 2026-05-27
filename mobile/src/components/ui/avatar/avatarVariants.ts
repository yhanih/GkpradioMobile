/**
 * Curated DiceBear seeds — same style (Thumbs), different characters.
 * @see https://www.dicebear.com/styles/thumbs/
 */
export const APP_AVATAR_STYLE = 'thumbs';

export interface AvatarVariantOption {
  /** Stored in `profiles.avatar_seed` — passed to DiceBear as `seed` */
  id: string;
  label: string;
}

/** Pick one of these — all render as Thumbs style, unique face per seed */
export const AVATAR_VARIANT_OPTIONS: readonly AvatarVariantOption[] = [
  { id: 'gkp-thumb-01', label: 'Character 1' },
  { id: 'gkp-thumb-02', label: 'Character 2' },
  { id: 'gkp-thumb-03', label: 'Character 3' },
  { id: 'gkp-thumb-04', label: 'Character 4' },
  { id: 'gkp-thumb-05', label: 'Character 5' },
  { id: 'gkp-thumb-06', label: 'Character 6' },
  { id: 'gkp-thumb-07', label: 'Character 7' },
  { id: 'gkp-thumb-08', label: 'Character 8' },
  { id: 'gkp-thumb-09', label: 'Character 9' },
  { id: 'gkp-thumb-10', label: 'Character 10' },
  { id: 'gkp-thumb-11', label: 'Character 11' },
  { id: 'gkp-thumb-12', label: 'Character 12' },
] as const;

const VARIANT_IDS = new Set(AVATAR_VARIANT_OPTIONS.map((v) => v.id));

export const DEFAULT_AVATAR_VARIANT = AVATAR_VARIANT_OPTIONS[0].id;

export function normalizeAvatarSeed(
  seed?: string | null,
  fallbackUserId?: string | null,
): string {
  const trimmed = seed?.trim();
  if (trimmed && VARIANT_IDS.has(trimmed)) {
    return trimmed;
  }
  if (fallbackUserId?.trim()) {
    return fallbackUserId.trim();
  }
  return DEFAULT_AVATAR_VARIANT;
}

export function getAvatarVariantLabel(seed?: string | null): string {
  const id = seed?.trim();
  return AVATAR_VARIANT_OPTIONS.find((v) => v.id === id)?.label ?? 'Your avatar';
}
