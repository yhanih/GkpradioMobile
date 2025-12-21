import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
  onFocus,
  onBlur,
  autoFocus = false,
  showCancelButton = false,
  onCancel,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const cancelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    Animated.timing(cancelAnim, {
      toValue: showCancelButton && isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showCancelButton, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    onChangeText('');
    Keyboard.dismiss();
    onCancel?.();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e4e4e7', '#047857'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            flex: 1,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? '#047857' : '#a1a1aa'}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a1a1aa"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <View style={styles.clearIconContainer}>
              <Ionicons name="close" size={14} color="#fff" />
            </View>
          </Pressable>
        )}
      </Animated.View>

      {showCancelButton && (
        <Animated.View
          style={[
            styles.cancelContainer,
            {
              opacity: cancelAnim,
              transform: [
                {
                  translateX: cancelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Ionicons name="close-circle" size={28} color="#71717a" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

export function CompactSearchBar({
  onPress,
  placeholder = 'Search...',
}: {
  onPress: () => void;
  placeholder?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.compactContainer,
        pressed && styles.compactPressed,
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Ionicons name="search" size={18} color="#a1a1aa" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#18181b',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  clearIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#a1a1aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelContainer: {
    marginLeft: 8,
  },
  cancelButton: {
    padding: 4,
  },
  compactContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPressed: {
    backgroundColor: '#e4e4e7',
  },
});
