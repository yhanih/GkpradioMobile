import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AvatarShimmerProps {
  size: number;
}

export function AvatarShimmer({ size }: AvatarShimmerProps) {
  const { theme, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const radius = size / 2;
  const shimmerMid = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.45)';

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceSecondary,
        },
      ]}
    >
      <Animated.View style={[styles.shimmerTrack, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', shimmerMid, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmerTrack: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    width: '50%',
  },
});
