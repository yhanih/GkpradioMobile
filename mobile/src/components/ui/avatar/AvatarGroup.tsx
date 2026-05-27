import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar, AvatarProps } from './Avatar';
import {
  AvatarSize,
  getAvatarDimension,
  getAvatarOverlapOffset,
  resolveAvatarSize,
} from './avatarUtils';

export interface AvatarGroupUser {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  anonymous?: boolean;
}

export interface AvatarGroupProps {
  users: AvatarGroupUser[];
  max?: number;
  size?: AvatarSize | 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  onPressOverflow?: () => void;
  onPressAvatar?: (user: AvatarGroupUser, index: number) => void;
  showOverflowCount?: boolean;
}

function AvatarGroupComponent({
  users,
  max = 4,
  size = 'sm',
  style,
  onPressOverflow,
  onPressAvatar,
  showOverflowCount = true,
}: AvatarGroupProps) {
  const { theme, isDark } = useTheme();
  const resolvedSize = resolveAvatarSize(size);
  const dimension = getAvatarDimension(resolvedSize);
  const overlap = getAvatarOverlapOffset(resolvedSize);

  const visible = users.slice(0, max);
  const overflowCount = Math.max(0, users.length - max);

  const containerWidth = useMemo(() => {
    if (visible.length === 0) return 0;
    return dimension + overlap * Math.max(0, visible.length - 1) + (overflowCount > 0 ? overlap : 0);
  }, [visible.length, dimension, overlap, overflowCount]);

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={[styles.row, { width: containerWidth }, style]}>
      {visible.map((user, index) => {
        const avatarProps: AvatarProps = {
          src: user.src,
          name: user.name,
          email: user.email,
          userId: user.userId,
          size: resolvedSize,
          anonymous: user.anonymous,
          showRing: true,
          showShimmer: index === 0,
          onPress: onPressAvatar ? () => onPressAvatar(user, index) : undefined,
        };

        return (
          <View
            key={user.userId ?? user.email ?? `${user.name}-${index}`}
            style={[
              styles.item,
              {
                marginLeft: index === 0 ? 0 : -overlap,
                zIndex: visible.length - index,
              },
            ]}
          >
            <Avatar {...avatarProps} />
          </View>
        );
      })}

      {overflowCount > 0 && showOverflowCount ? (
        <Pressable
          onPress={onPressOverflow}
          disabled={!onPressOverflow}
          style={[
            styles.overflow,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              marginLeft: -overlap,
              zIndex: 0,
              backgroundColor: isDark ? theme.colors.surfaceSecondary : theme.colors.surface,
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.88)',
            },
          ]}
          accessibilityRole={onPressOverflow ? 'button' : 'text'}
          accessibilityLabel={`${overflowCount} more members`}
        >
          <Text
            style={[
              styles.overflowText,
              {
                fontSize: dimension <= 32 ? 11 : 13,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            +{overflowCount}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const AvatarGroup = memo(AvatarGroupComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    backgroundColor: 'transparent',
  },
  overflow: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  overflowText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
