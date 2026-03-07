import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  useDerivedValue 
} from 'react-native-reanimated';
import { TextInput } from 'react-native-gesture-handler';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCountProps {
  target: number;
  style?: any;
}

export function AnimatedCount({ target, style }: AnimatedCountProps) {
  const count = useSharedValue(0);

  useEffect(() => {
    count.value = withTiming(target, { duration: 1500 });
  }, [target]);

  const displayText = useDerivedValue(() => {
    return Math.floor(count.value).toString();
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      text: displayText.value,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={displayText.value}
      style={[styles.text, style]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#8E8E93',
    padding: 0,
    margin: 0,
  }
});
