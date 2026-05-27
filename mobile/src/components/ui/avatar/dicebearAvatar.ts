/**
 * DiceBear HTTP API — Thumbs style only, PNG
 * @see https://www.dicebear.com/styles/thumbs/
 */
import { APP_AVATAR_STYLE } from './avatarVariants';

export const DICEBEAR_API_VERSION = '9.x';

const BRAND_BACKGROUNDS = 'ecfdf5,d1fae5,f0fdfa,ffdfbf,f1f4dc';

/**
 * Build a deterministic DiceBear Thumbs avatar URL.
 */
export function getDiceBearAvatarUrl(seed: string, pixelSize: number): string {
  const size = String(Math.max(16, Math.round(pixelSize)));
  const params = new URLSearchParams();
  params.set('seed', seed);
  params.set('size', size);
  params.set('backgroundColor', BRAND_BACKGROUNDS);
  params.set('backgroundType', 'solid');
  params.set('radius', '50');

  return `https://api.dicebear.com/${DICEBEAR_API_VERSION}/${APP_AVATAR_STYLE}/png?${params.toString()}`;
}
