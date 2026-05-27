import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
import { Avatar } from './Avatar';
import {
  AVATAR_VARIANT_OPTIONS,
  DEFAULT_AVATAR_VARIANT,
  normalizeAvatarSeed,
} from './avatarVariants';

export interface AvatarVariantPickerProps {
  selectedSeed?: string | null;
  onSelect: (seed: string) => void;
  disabled?: boolean;
}

function AvatarVariantPickerComponent({
  selectedSeed,
  onSelect,
  disabled = false,
}: AvatarVariantPickerProps) {
  const { theme, isDark } = useTheme();
  const resolvedSelection = normalizeAvatarSeed(selectedSeed);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Choose your avatar</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        All avatars use the same friendly style — pick the character you like best.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVATAR_VARIANT_OPTIONS.map((variant, index) => {
          const selected = variant.id === resolvedSelection;

          return (
            <Pressable
              key={variant.id}
              onPress={() => {
                if (disabled) return;
                Haptics.selectionAsync();
                onSelect(variant.id);
              }}
              disabled={disabled}
              style={({ pressed }) => [
                styles.option,
                index > 0 && styles.optionSpacing,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
                selected && {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : theme.colors.primaryLight,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`${variant.label}`}
            >
              <Avatar
                avatarSeed={variant.id}
                size="lg"
                showRing
                showShimmer={index < 3}
              />
              <Text
                style={[
                  styles.optionLabel,
                  { color: selected ? theme.colors.primary : theme.colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {variant.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const AvatarVariantPicker = memo(AvatarVariantPickerComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingRight: 4,
    paddingBottom: 4,
  },
  option: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionSpacing: {
    marginLeft: 10,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
});
