import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { theme, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const shimmerMid = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)';

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
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

export function SkeletonCard() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Skeleton width={140} height={100} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonPostCard() {
  const { theme } = useTheme();
  return (
    <View style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.postHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.postHeaderText}>
          <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={16} style={{ marginTop: 12, marginBottom: 8 }} />
      <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
      <View style={styles.postFooter}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function SkeletonEventCard() {
  const { theme } = useTheme();
  return (
    <View style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}>
      <Skeleton width="100%" height={160} borderRadius={16} />
      <View style={styles.eventContent}>
        <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
        <View style={styles.eventFooter}>
          <Skeleton width={100} height={36} borderRadius={18} />
          <Skeleton width={100} height={36} borderRadius={18} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonMediaCard() {
  return (
    <View style={styles.mediaCard}>
      <Skeleton width={140} height={140} borderRadius={12} />
      <Skeleton width={120} height={14} style={{ marginTop: 10 }} />
      <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonList({ count = 3, type = 'post' }: { count?: number; type?: 'post' | 'card' | 'event' | 'media' }) {
  const { theme } = useTheme();
  const items = Array.from({ length: count }, (_, i) => i);

  const renderItem = (index: number) => {
    switch (type) {
      case 'card':
        return <SkeletonCard key={index} />;
      case 'event':
        return <SkeletonEventCard key={index} />;
      case 'media':
        return <SkeletonMediaCard key={index} />;
      case 'post':
      default:
        return <SkeletonPostCard key={index} />;
    }
  };

  return (
    <View style={[styles.list, { backgroundColor: theme.colors.background }]}>
      {items.map(renderItem)}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    flex: 1,
    width: '50%',
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  eventCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventContent: {
    padding: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaCard: {
    width: 140,
    marginRight: 12,
  },
  list: {
    paddingHorizontal: 20,
  },
});
