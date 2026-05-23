import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../utils/responsive';

/**
 * Keeps tab content from stretching edge-to-edge on tablets while staying full-bleed on phones.
 */
export function TabletMaxWidth({ children }: { children: React.ReactNode }) {
  const { isTablet, tabContentMaxWidth } = useResponsive();

  if (!isTablet) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { maxWidth: tabContentMaxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: '100%' },
  outer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
