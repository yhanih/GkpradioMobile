export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Centralized avatar dimension scale — use everywhere for consistency. */
export const AVATAR_SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

/** Legacy ProfileAvatar size names → new scale */
export const LEGACY_AVATAR_SIZE_MAP = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
  xlarge: '2xl',
} as const satisfies Record<string, AvatarSize>;

export type LegacyAvatarSize = keyof typeof LEGACY_AVATAR_SIZE_MAP;

export interface AvatarPalette {
  gradient: readonly [string, string];
  text: string;
}

/** Premium muted palettes — cohesive with GKP emerald brand */
export const AVATAR_PALETTES: readonly AvatarPalette[] = [
  { gradient: ['#065f46', '#047857'], text: '#ecfdf5' },
  { gradient: ['#1e3a5f', '#2563eb'], text: '#eff6ff' },
  { gradient: ['#713f12', '#b45309'], text: '#fffbeb' },
  { gradient: ['#4c1d95', '#6d28d9'], text: '#f5f3ff' },
  { gradient: ['#1e293b', '#334155'], text: '#f1f5f9' },
  { gradient: ['#134e4a', '#0f766e'], text: '#f0fdfa' },
] as const;

const ANONYMOUS_PALETTE: AvatarPalette = {
  gradient: ['#52525b', '#3f3f46'],
  text: '#fafafa',
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveAvatarSize(size: AvatarSize | LegacyAvatarSize): AvatarSize {
  if (size in AVATAR_SIZE_PX) {
    return size as AvatarSize;
  }
  return LEGACY_AVATAR_SIZE_MAP[size as LegacyAvatarSize] ?? 'md';
}

export function getAvatarDimension(size: AvatarSize | LegacyAvatarSize): number {
  return AVATAR_SIZE_PX[resolveAvatarSize(size)];
}

export function getAvatarInitials(name?: string | null, email?: string | null): string {
  const base = (name?.trim() || email?.split('@')[0] || 'GK').trim();
  if (!base) return 'GK';

  const parts = base.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function getAvatarColorSeed(
  userId?: string | null,
  name?: string | null,
  email?: string | null,
): string {
  return userId?.trim() || name?.trim() || email?.trim() || 'gkp-member';
}

export function getAvatarPalette(
  seed: string,
  options?: { anonymous?: boolean },
): AvatarPalette {
  if (options?.anonymous) {
    return ANONYMOUS_PALETTE;
  }
  const index = hashString(seed) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index] ?? AVATAR_PALETTES[0];
}

export function getAvatarFontSize(size: AvatarSize): number {
  const px = AVATAR_SIZE_PX[size];
  if (px <= 24) return 10;
  if (px <= 32) return 12;
  if (px <= 40) return 14;
  if (px <= 48) return 16;
  if (px <= 64) return 20;
  return 28;
}

export function getAvatarFontWeight(size: AvatarSize): '600' | '700' {
  return AVATAR_SIZE_PX[size] >= 64 ? '700' : '600';
}

export function getAvatarOverlapOffset(size: AvatarSize): number {
  return Math.round(AVATAR_SIZE_PX[size] * 0.32);
}

export function getAvatarOnlineDotSize(size: AvatarSize): number {
  const px = AVATAR_SIZE_PX[size];
  if (px <= 24) return 7;
  if (px <= 32) return 9;
  if (px <= 40) return 10;
  if (px <= 48) return 11;
  if (px <= 64) return 13;
  return 16;
}

export function getAvatarAccessibilityLabel(
  name?: string | null,
  options?: { anonymous?: boolean },
): string {
  if (options?.anonymous) return 'Anonymous member';
  const trimmed = name?.trim();
  if (trimmed) return `${trimmed}'s profile picture`;
  return 'Member profile picture';
}
