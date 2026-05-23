import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Typical phone portrait upper bound (points). */
export const TABLET_MIN_WIDTH = 600;

/** Large tablet / small desktop. */
export const LARGE_TABLET_MIN_WIDTH = 900;

/** Max readable column width inside tabs (points). */
export const TAB_CONTENT_MAX_WIDTH = 780;

/** Max width for floating mini-player / sheets (points). */
export const FLOATING_UI_MAX_WIDTH = 720;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_MIN_WIDTH;
    const isLargeTablet = width >= LARGE_TABLET_MIN_WIDTH;
    const tabContentMaxWidth = Math.min(width - (isTablet ? 48 : 24), TAB_CONTENT_MAX_WIDTH);
    const floatingMaxWidth = Math.min(width - 24, FLOATING_UI_MAX_WIDTH);
    const horizontalGutter = isLargeTablet ? 32 : isTablet ? 24 : 20;

    return {
      width,
      height,
      isTablet,
      isLargeTablet,
      tabContentMaxWidth,
      floatingMaxWidth,
      horizontalGutter,
    };
  }, [width, height]);
}
