import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptimisticImageProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimisticImage({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  fallbackIcon = 'image-outline',
  onLoad,
  onError,
}: OptimisticImageProps) {
  const sourceKey = typeof source === 'object' && source !== null && 'uri' in source ? source.uri : String(source);
  const hasUriInitial = typeof source === 'object' && source !== null && 'uri' in source;
  const initialError = hasUriInitial && !((source as any).uri);
  const initialLoading = !initialError;

  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);

  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    const hasUri = typeof source === 'object' && 'uri' in source;
    if (hasUri && !source.uri) {
      setLoading(false);
      setError(true);
    } else {
      setLoading(true);
      setError(false);
    }
  }

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const handleLoad = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const isUri = typeof source === 'object' && 'uri' in source;

  return (
    <View style={[styles.container, style]}>
      {loading && !error && (
        <View style={[StyleSheet.absoluteFill, styles.placeholderContainer]}>
          {placeholder || (
            <View style={styles.defaultPlaceholder}>
              <ActivityIndicator size="small" color="#047857" />
            </View>
          )}
        </View>
      )}

      {error && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Ionicons name={fallbackIcon} size={32} color="#d4d4d8" />
        </View>
      )}

      {isUri && source.uri ? (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 0 : 1 }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : !isUri ? (
        <Image
          source={source as number}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 0 : 1 }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholderContainer: {
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});





