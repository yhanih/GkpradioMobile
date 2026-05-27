export { Avatar, avatarPropsFromUser } from './Avatar';
export type { AvatarProps } from './Avatar';
export { AvatarFallback } from './AvatarFallback';
export type { AvatarFallbackProps } from './AvatarFallback';
export { AvatarGroup } from './AvatarGroup';
export type { AvatarGroupProps, AvatarGroupUser } from './AvatarGroup';
export { AvatarVariantPicker } from './AvatarVariantPicker';
export type { AvatarVariantPickerProps } from './AvatarVariantPicker';
export {
  AVATAR_VARIANT_OPTIONS,
  APP_AVATAR_STYLE,
  DEFAULT_AVATAR_VARIANT,
  getAvatarVariantLabel,
  normalizeAvatarSeed,
} from './avatarVariants';
export type { AvatarVariantOption } from './avatarVariants';
export {
  AVATAR_PALETTES,
  AVATAR_SIZE_PX,
  getAvatarAccessibilityLabel,
  getAvatarColorSeed,
  getAvatarDimension,
  getAvatarInitials,
  getAvatarPalette,
  resolveAvatarSize,
} from './avatarUtils';
export type { AvatarPalette, AvatarSize, LegacyAvatarSize } from './avatarUtils';
export { DICEBEAR_API_VERSION, getDiceBearAvatarUrl } from './dicebearAvatar';
