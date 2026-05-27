import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItem,
} from 'react-native';

const BANNER_BG = '#000000';
const LABEL_COLOR = '#FFFFFF';
const SLIDE_TEXT_COLOR = '#888888';
const DOT_INACTIVE = '#444444';
const PILL_ACTIVE = '#FFC107';

const DOT_SIZE = 5;
const PILL_WIDTH = 15;
const PILL_HEIGHT = 5;
const AUTO_ADVANCE_MS = 5000;
const REPEAT_COUNT = 5;

export type SponsorSlide = {
  id: string;
  /** Uppercase line shown in the carousel area (default: ADVERTISE HERE) */
  label?: string;
  onPress?: () => void;
};

export const DEFAULT_SPONSOR_SLIDES: SponsorSlide[] = [
  { id: 'slot-1', label: 'ADVERTISE HERE' },
  { id: 'slot-2', label: 'ADVERTISE HERE' },
  { id: 'slot-3', label: 'ADVERTISE HERE' },
];

interface SponsorBannerProps {
  slides?: SponsorSlide[];
  autoAdvanceMs?: number;
  /** `credits` — quieter, centered layout for end-of-scroll placement */
  variant?: 'bar' | 'credits';
}

function SponsorPagination({
  count,
  activeIndex,
  centered = false,
}: {
  count: number;
  activeIndex: number;
  centered?: boolean;
}) {
  if (count <= 1) return null;

  return (
    <View
      style={[styles.pagination, centered && styles.paginationCredits]}
      accessibilityRole="tablist"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.pageIndicator,
              isActive ? styles.pageIndicatorActive : styles.pageIndicatorInactive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          />
        );
      })}
    </View>
  );
}

function SlideMarqueeText({ label }: { label: string }) {
  const text = label.toUpperCase();
  const repeated = Array.from({ length: REPEAT_COUNT }, () => text).join('     ');
  return (
    <Text style={styles.slideText} numberOfLines={1}>
      {repeated}
    </Text>
  );
}

export function SponsorBanner({
  slides = DEFAULT_SPONSOR_SLIDES,
  autoAdvanceMs = AUTO_ADVANCE_MS,
  variant = 'bar',
}: SponsorBannerProps) {
  const isCredits = variant === 'credits';
  const listRef = useRef<FlatList<SponsorSlide>>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onCarouselLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setCarouselWidth(w);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || autoAdvanceMs <= 0 || carouselWidth <= 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToOffset({
          offset: next * carouselWidth,
          animated: true,
        });
        return next;
      });
    }, autoAdvanceMs);

    return () => clearInterval(timer);
  }, [slides.length, autoAdvanceMs, carouselWidth]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (carouselWidth <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
      setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
    },
    [carouselWidth, slides.length],
  );

  const renderItem: ListRenderItem<SponsorSlide> = useCallback(
    ({ item }) => {
      const label = (item.label ?? 'ADVERTISE HERE').toUpperCase();
      const content = <SlideMarqueeText label={label} />;

      if (!item.onPress) {
        return (
          <View style={[styles.slide, { width: carouselWidth }]}>{content}</View>
        );
      }

      return (
        <Pressable
          style={[styles.slide, { width: carouselWidth }]}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={`Sponsor: ${label}`}
        >
          {content}
        </Pressable>
      );
    },
    [carouselWidth],
  );

  if (slides.length === 0) return null;

  return (
    <View
      style={[styles.bar, isCredits && styles.barCredits]}
      accessibilityRole="header"
      accessibilityLabel="Sponsored by"
    >
      <Text style={[styles.label, isCredits && styles.labelCredits]}>SPONSORED BY</Text>

      <View
        style={[styles.carouselWrap, isCredits && styles.carouselWrapCredits]}
        onLayout={onCarouselLayout}
      >
        {carouselWidth > 0 ? (
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: carouselWidth,
              offset: carouselWidth * index,
              index,
            })}
          />
        ) : null}
      </View>

      <SponsorPagination
        count={slides.length}
        activeIndex={activeIndex}
        centered={isCredits}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BANNER_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
    gap: 8,
  },
  label: {
    color: LABEL_COLOR,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  carouselWrap: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  slide: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideText: {
    color: SLIDE_TEXT_COLOR,
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
  },
  pageIndicator: {
    borderRadius: PILL_HEIGHT / 2,
  },
  pageIndicatorInactive: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_INACTIVE,
  },
  pageIndicatorActive: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    backgroundColor: PILL_ACTIVE,
  },
  barCredits: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
    minHeight: 72,
  },
  labelCredits: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.2,
    opacity: 0.72,
    textAlign: 'center',
  },
  carouselWrapCredits: {
    width: '100%',
    minHeight: 18,
    alignItems: 'center',
  },
  paginationCredits: {
    alignSelf: 'center',
    paddingLeft: 0,
    paddingTop: 2,
  },
});
