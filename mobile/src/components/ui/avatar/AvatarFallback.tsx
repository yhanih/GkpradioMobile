import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  AvatarSize,
  getAvatarColorSeed,
  getAvatarDimension,
  getAvatarFontSize,
  getAvatarFontWeight,
  getAvatarInitials,
  getAvatarPalette,
  resolveAvatarSize,
} from './avatarUtils';

export interface AvatarFallbackProps {
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  size?: AvatarSize | 'small' | 'medium' | 'large' | 'xlarge';
  anonymous?: boolean;
  style?: ViewStyle;
  showRing?: boolean;
}

function AvatarFallbackComponent({
  name,
  email,
  userId,
  size = 'md',
  anonymous = false,
  style,
  showRing = true,
}: AvatarFallbackProps) {
  const resolvedSize = resolveAvatarSize(size);
  const dimension = getAvatarDimension(resolvedSize);
  const radius = dimension / 2;

  const seed = useMemo(
    () => getAvatarColorSeed(userId, name, email),
    [userId, name, email],
  );

  const palette = useMemo(
    () => getAvatarPalette(seed, { anonymous }),
    [seed, anonymous],
  );

  const initials = useMemo(
    () => (anonymous ? '' : getAvatarInitials(name, email)),
    [anonymous, name, email],
  );

  const fontSize = getAvatarFontSize(resolvedSize);
  const fontWeight = getAvatarFontWeight(resolvedSize);
  const iconSize = Math.round(dimension * 0.42);

  return (
    <View
      style={[
        styles.outer,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius,
        },
        showRing && styles.ring,
        style,
      ]}
    >
      <LinearGradient
        colors={[palette.gradient[0], palette.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius }]}
      >
        {anonymous ? (
          <Ionicons name="eye-off" size={iconSize} color={palette.text} />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                fontWeight,
                color: palette.text,
                lineHeight: fontSize * 1.15,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {initials}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

export const AvatarFallback = memo(AvatarFallbackComponent);

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    letterSpacing: 0.4,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
