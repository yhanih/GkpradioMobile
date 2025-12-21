import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorStateProps {
  type?: 'error' | 'network' | 'server' | 'notFound';
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const errorConfig = {
  error: {
    icon: 'alert-circle' as const,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    iconColor: '#ef4444',
    iconBg: '#fef2f2',
  },
  network: {
    icon: 'cloud-offline' as const,
    title: 'No Internet Connection',
    message: 'Please check your connection and try again.',
    iconColor: '#f97316',
    iconBg: '#fff7ed',
  },
  server: {
    icon: 'server' as const,
    title: 'Server Error',
    message: "We're having trouble connecting. Please try again later.",
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
  },
  notFound: {
    icon: 'search' as const,
    title: 'Not Found',
    message: "We couldn't find what you're looking for.",
    iconColor: '#64748b',
    iconBg: '#f8fafc',
  },
};

export function ErrorState({
  type = 'error',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  const config = errorConfig[type];

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.icon} size={48} color={config.iconColor} />
      </View>

      <Text style={styles.title}>{title || config.title}</Text>
      <Text style={styles.message}>{message || config.message}</Text>

      {onRetry && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          onPress={handleRetry}
        >
          <LinearGradient
            colors={['#047857', '#059669']}
            style={styles.retryGradient}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>{retryLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineContent}>
        <Ionicons name="alert-circle" size={20} color="#ef4444" />
        <Text style={styles.inlineMessage}>{message}</Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onRetry();
          }}
          style={styles.inlineRetry}
        >
          <Text style={styles.inlineRetryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  inlineMessage: {
    fontSize: 14,
    color: '#991b1b',
    flex: 1,
  },
  inlineRetry: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    marginLeft: 12,
  },
  inlineRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
