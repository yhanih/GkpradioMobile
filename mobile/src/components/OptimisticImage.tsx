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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [typeof source === 'object' ? source.uri : source]);

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
      ) : (
        <Image
          source={source as number}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 0 : 1 }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

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


