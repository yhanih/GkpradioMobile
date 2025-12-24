import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileAvatarProps {
  uri?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showBorder?: boolean;
  isAnonymous?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}

const SIZES = {
  small: 32,
  medium: 40,
  large: 56,
  xlarge: 96,
};

const ICON_SIZES = {
  small: 16,
  medium: 20,
  large: 28,
  xlarge: 48,
};

export function ProfileAvatar({
  uri,
  size = 'medium',
  onPress,
  showBorder = false,
  isAnonymous = false,
  accessibilityLabel,
  accessibilityRole
}: ProfileAvatarProps) {
  const dimension = SIZES[size];
  const iconSize = ICON_SIZES[size];
  const borderRadius = dimension / 2;

  const avatarContent = () => {
    if (isAnonymous) {
      return (
        <LinearGradient
          colors={['#71717a', '#52525b']}
          style={[
            styles.container,
            {
              width: dimension,
              height: dimension,
              borderRadius,
            },
            showBorder && styles.border,
          ]}
        >
          <Ionicons name="eye-off" size={iconSize} color="#fff" />
        </LinearGradient>
      );
    }

    if (uri) {
      return (
        <View
          style={[
            styles.container,
            {
              width: dimension,
              height: dimension,
              borderRadius,
            },
            showBorder && styles.border,
          ]}
        >
          <Image
            source={{ uri }}
            style={[
              styles.image,
              {
                width: dimension,
                height: dimension,
                borderRadius,
              },
            ]}
          />
        </View>
      );
    }

    return (
      <LinearGradient
        colors={['#047857', '#059669']}
        style={[
          styles.container,
          {
            width: dimension,
            height: dimension,
            borderRadius,
          },
          showBorder && styles.border,
        ]}
      >
        <Ionicons name="person" size={iconSize} color="#fff" />
      </LinearGradient>
    );
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole as any || 'button'}
      >
        {avatarContent()}
      </Pressable>
    );
  }

  return avatarContent();
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e4e4e7',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  border: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
