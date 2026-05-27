import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PixelRatio,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
import { AvatarFallback } from './AvatarFallback';
import { AvatarShimmer } from './AvatarShimmer';
import { getDiceBearAvatarUrl } from './dicebearAvatar';
import { normalizeAvatarSeed } from './avatarVariants';
import {
  type AvatarSize,
  getAvatarAccessibilityLabel,
  getAvatarColorSeed,
  getAvatarDimension,
  getAvatarOnlineDotSize,
  resolveAvatarSize,
} from './avatarUtils';

export interface AvatarProps {
  /** User-uploaded profile image URL — takes priority over DiceBear */
  src?: string | null;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  /** DiceBear seed from `profiles.avatar_seed` — same Thumbs style, different character */
  avatarSeed?: string | null;
  size?: AvatarSize | 'small' | 'medium' | 'large' | 'xlarge';
  /** Anonymous community posts — no DiceBear, initials/icon fallback only */
  anonymous?: boolean;
  onPress?: () => void;
  showRing?: boolean;
  showOnlineIndicator?: boolean;
  showShimmer?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'image' | 'none';
  testID?: string;
}

type ImagePhase = 'idle' | 'loading' | 'loaded' | 'error';

function AvatarComponent({
  src,
  name,
  email,
  userId,
  avatarSeed,
  size = 'md',
  anonymous = false,
  onPress,
  showRing = true,
  showOnlineIndicator = false,
  showShimmer = true,
  style,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: AvatarProps) {
  const { isDark } = useTheme();
  const resolvedSize = resolveAvatarSize(size);
  const dimension = getAvatarDimension(resolvedSize);
  const radius = dimension / 2;

  const uploadedUri = useMemo(() => {
    const trimmed = src?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  }, [src]);

  const seed = useMemo(
    () =>
      normalizeAvatarSeed(
        avatarSeed,
        getAvatarColorSeed(userId, name, email),
      ),
    [avatarSeed, userId, name, email],
  );

  const dicebearUri = useMemo(() => {
    if (anonymous) return null;
    const pixelSize = Math.round(dimension * PixelRatio.get());
    return getDiceBearAvatarUrl(seed, pixelSize);
  }, [anonymous, seed, dimension]);

  const [preferUploaded, setPreferUploaded] = useState(Boolean(uploadedUri));

  useEffect(() => {
    setPreferUploaded(Boolean(uploadedUri));
  }, [uploadedUri]);

  const imageUri = useMemo(() => {
    if (anonymous) return null;
    if (uploadedUri && preferUploaded) return uploadedUri;
    return dicebearUri;
  }, [anonymous, uploadedUri, preferUploaded, dicebearUri]);

  const [imagePhase, setImagePhase] = useState<ImagePhase>(imageUri ? 'loading' : 'idle');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const uriKey = imageUri ?? '';

  useEffect(() => {
    fadeAnim.setValue(0);
    if (!imageUri || anonymous) {
      setImagePhase('idle');
      return;
    }
    setImagePhase('loading');
  }, [uriKey, anonymous, fadeAnim, imageUri]);

  const runFadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLoad = useCallback(() => {
    setImagePhase('loaded');
    runFadeIn();
  }, [runFadeIn]);

  const handleError = useCallback(() => {
    if (uploadedUri && preferUploaded && dicebearUri) {
      setPreferUploaded(false);
      fadeAnim.setValue(0);
      setImagePhase('loading');
      return;
    }
    setImagePhase('error');
    fadeAnim.setValue(0);
  }, [uploadedUri, preferUploaded, dicebearUri, fadeAnim]);

  const showImage = Boolean(imageUri) && !anonymous && imagePhase !== 'error';

  const showLoadingShimmer = showShimmer && showImage && imagePhase === 'loading';

  const showFallback = anonymous || imagePhase === 'error';

  const defaultA11yLabel = getAvatarAccessibilityLabel(name, { anonymous });
  const resolvedA11yLabel = accessibilityLabel ?? defaultA11yLabel;
  const resolvedRole = onPress ? 'button' : accessibilityRole ?? 'image';

  const ringStyle = useMemo(
    () =>
      showRing
        ? {
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.88)',
          }
        : null,
    [showRing, isDark],
  );

  const dotSize = getAvatarOnlineDotSize(resolvedSize);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const content = (
    <View
      style={[
        styles.root,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius,
        },
        ringStyle,
        style,
      ]}
      testID={testID}
    >
      {showFallback ? (
        <AvatarFallback
          name={name}
          email={email}
          userId={userId}
          size={resolvedSize}
          anonymous={anonymous}
          showRing={false}
        />
      ) : null}

      {showImage ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: imagePhase === 'loaded' ? fadeAnim : 0,
              borderRadius: radius,
              overflow: 'hidden',
            },
          ]}
        >
          <Image
            source={{ uri: imageUri! }}
            style={styles.image}
            resizeMode="cover"
            onLoad={handleLoad}
            onError={handleError}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      ) : null}

      {showLoadingShimmer ? (
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
          <AvatarShimmer size={dimension} />
        </View>
      ) : null}

      {showOnlineIndicator ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderWidth: dotSize > 10 ? 2 : 1.5,
            },
          ]}
        />
      ) : null}
    </View>
  );

  const wrapped = onPress ? (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={resolvedRole as 'button'}
      accessibilityLabel={resolvedA11yLabel}
      hitSlop={8}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{content}</Animated.View>
    </Pressable>
  ) : (
    <View
      accessible
      accessibilityRole={resolvedRole as 'image'}
      accessibilityLabel={resolvedA11yLabel}
    >
      {content}
    </View>
  );

  return wrapped;
}

function propsAreEqual(prev: AvatarProps, next: AvatarProps): boolean {
  return (
    prev.src === next.src &&
    prev.name === next.name &&
    prev.email === next.email &&
    prev.userId === next.userId &&
    prev.avatarSeed === next.avatarSeed &&
    prev.size === next.size &&
    prev.anonymous === next.anonymous &&
    prev.showRing === next.showRing &&
    prev.showOnlineIndicator === next.showOnlineIndicator &&
    prev.showShimmer === next.showShimmer &&
    prev.onPress === next.onPress
  );
}

export const Avatar = memo(AvatarComponent, propsAreEqual);

/** Convenience helper for feed/list rows */
export function avatarPropsFromUser(user?: {
  id?: string;
  fullname?: string | null;
  full_name?: string | null;
  avatarurl?: string | null;
  avatar_url?: string | null;
  avatarseed?: string | null;
  avatar_seed?: string | null;
  email?: string | null;
} | null) {
  if (!user) {
    return {
      name: null as string | null,
      src: null as string | null,
      userId: null as string | null,
      email: null as string | null,
    };
  }

  return {
    name: user.fullname ?? user.full_name ?? null,
    src: user.avatarurl ?? user.avatar_url ?? null,
    userId: user.id ?? null,
    email: user.email ?? null,
    avatarSeed: user.avatarseed ?? user.avatar_seed ?? null,
  };
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22c55e',
    borderColor: '#ffffff',
  },
});
