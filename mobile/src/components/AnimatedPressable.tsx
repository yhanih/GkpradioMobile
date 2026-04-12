import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleValue?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  animationDuration?: number;
}

export function AnimatedPressable({
  children,
  style,
  onPress,
  scaleValue = 0.97,
  haptic = 'light',
  animationDuration = 100,
  disabled,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = (e: any) => {
    if (disabled) return;
    
    switch (haptic) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
    
    onPress?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      {...props}
    >
      <Animated.View
        style={[
          style as any,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function AnimatedCard({
  children,
  style,
  onPress,
  ...props
}: AnimatedPressableProps) {
  const { theme } = useTheme();
  const combinedStyle = style
    ? [{ backgroundColor: theme.colors.surface }, styles.card, ...(Array.isArray(style) ? style : [style])]
    : [{ backgroundColor: theme.colors.surface }, styles.card];
  return (
    <AnimatedPressable
      style={combinedStyle as ViewStyle | ViewStyle[]}
      scaleValue={0.98}
      haptic="light"
      onPress={onPress}
      accessible
      accessibilityRole="button"
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

export function AnimatedButton({
  children,
  style,
  onPress,
  variant = 'primary',
  ...props
}: AnimatedPressableProps & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const { theme } = useTheme();
  const buttonStyle =
    variant === 'primary'
      ? [styles.primaryButton, { backgroundColor: theme.colors.primary }]
      : variant === 'secondary'
        ? [
            styles.secondaryButton,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]
        : styles.ghostButton;

  const baseStyle = Array.isArray(buttonStyle) ? buttonStyle : [buttonStyle];
  const combinedStyle = style
    ? [...baseStyle, ...(Array.isArray(style) ? style : [style])]
    : baseStyle;
  return (
    <AnimatedPressable
      style={combinedStyle as ViewStyle | ViewStyle[]}
      scaleValue={0.96}
      haptic="medium"
      onPress={onPress}
      accessible
      accessibilityRole="button"
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ghostButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
