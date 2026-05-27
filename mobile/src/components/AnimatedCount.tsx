import React, { useEffect } from 'react';
import { StyleSheet, TextInput, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** Smooth ease-out — numbers decelerate gently at the end */
const COUNT_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface AnimatedCountProps {
  target: number;
  style?: StyleProp<TextStyle>;
  /** Total animation time in ms */
  duration?: number;
  /** Stagger start (ms) for cascading row animations */
  delay?: number;
}

export function AnimatedCount({
  target,
  style,
  duration = 2200,
  delay = 0,
}: AnimatedCountProps) {
  const count = useSharedValue(0);

  useEffect(() => {
    count.value = withDelay(
      delay,
      withTiming(target, {
        duration,
        easing: COUNT_EASING,
      })
    );
  }, [target, duration, delay, count]);

  const animatedProps = useAnimatedProps(() => {
    const value = Math.round(count.value);
    const text = String(value);
    return {
      text,
      defaultValue: text,
    };
  });

  return (
    <AnimatedTextInput
      editable={false}
      focusable={false}
      showSoftInputOnFocus={false}
      caretHidden
      underlineColorAndroid="transparent"
      selectTextOnFocus={false}
      contextMenuHidden
      style={[styles.text, style]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'right',
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
});
