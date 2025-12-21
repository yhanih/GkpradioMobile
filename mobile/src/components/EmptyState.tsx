import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'default' | 'search' | 'error' | 'offline';
}

const TYPE_CONFIG = {
  default: {
    icon: 'document-text-outline' as const,
    colors: ['#ecfdf5', '#d1fae5'] as const,
    iconColor: '#047857',
  },
  search: {
    icon: 'search-outline' as const,
    colors: ['#f0f9ff', '#e0f2fe'] as const,
    iconColor: '#0284c7',
  },
  error: {
    icon: 'alert-circle-outline' as const,
    colors: ['#fef2f2', '#fee2e2'] as const,
    iconColor: '#dc2626',
  },
  offline: {
    icon: 'cloud-offline-outline' as const,
    colors: ['#fafafa', '#f4f4f5'] as const,
    iconColor: '#71717a',
  },
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  type = 'default',
}: EmptyStateProps) {
  const config = TYPE_CONFIG[type];
  const displayIcon = icon || config.icon;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.colors}
        style={styles.iconContainer}
      >
        <Ionicons name={displayIcon} size={48} color={config.iconColor} />
      </LinearGradient>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction();
          }}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

export function EmptyBookmarks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="bookmark-outline"
      title="No Saved Posts Yet"
      message="Posts you bookmark will appear here for easy access later."
      actionLabel="Explore Community"
      onAction={onAction}
    />
  );
}

export function EmptyPosts({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="chatbubbles-outline"
      title="No Posts Yet"
      message="Be the first to share something with the community!"
      actionLabel="Create Post"
      onAction={onAction}
    />
  );
}

export function EmptyEvents() {
  return (
    <EmptyState
      icon="calendar-outline"
      title="No Upcoming Events"
      message="Check back soon for new live events and broadcasts."
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      type="search"
      title="No Results Found"
      message={`We couldn't find anything matching "${query}". Try different keywords.`}
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something Went Wrong"
      message="We couldn't load the content. Please check your connection and try again."
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      type="offline"
      title="You're Offline"
      message="Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
