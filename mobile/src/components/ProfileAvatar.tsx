/**
 * @deprecated Import from `../components/ui/avatar` instead.
 * Thin wrapper preserving the legacy ProfileAvatar API.
 */
import React from 'react';
import { Avatar, AvatarProps } from './ui/avatar';

interface ProfileAvatarProps {
  uri?: string | null;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  avatarSeed?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showBorder?: boolean;
  isAnonymous?: boolean;
  showOnlineIndicator?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}

export function ProfileAvatar({
  uri,
  name,
  email,
  userId,
  avatarSeed,
  size = 'medium',
  onPress,
  showBorder = false,
  isAnonymous = false,
  showOnlineIndicator = false,
  accessibilityLabel,
  accessibilityRole,
}: ProfileAvatarProps) {
  const avatarProps: AvatarProps = {
    src: uri,
    name,
    email,
    userId,
    avatarSeed,
    size,
    onPress,
    showRing: showBorder,
    anonymous: isAnonymous,
    showOnlineIndicator,
    accessibilityLabel,
    accessibilityRole: accessibilityRole as AvatarProps['accessibilityRole'],
  };

  return <Avatar {...avatarProps} />;
}
