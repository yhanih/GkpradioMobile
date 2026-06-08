import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  BackendNotification,
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/backend';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar } from '../components/ui/avatar';

type NotificationsNavProp = NativeStackNavigationProp<RootStackParamList>;

function getNotificationIcon(type: BackendNotification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'like':
      return 'heart';
    case 'pray':
      return 'hand-left';
    case 'comment':
      return 'chatbubble';
    case 'discussion':
      return 'chatbubbles';
    default:
      return 'notifications';
  }
}

function getNotificationIconColor(type: BackendNotification['type']): string {
  switch (type) {
    case 'like':
      return '#ef4444';
    case 'pray':
      return '#047857';
    case 'comment':
      return '#2563eb';
    case 'discussion':
      return '#047857';
    default:
      return '#71717a';
  }
}

export function NotificationsScreen() {
  const navigation = useNavigation<NotificationsNavProp>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setError('Please sign in to view your notifications');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const items = await fetchUserNotifications(user.id);
      setNotifications(items);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchNotifications();
      }
    }, [fetchNotifications, loading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationPress = (notification: BackendNotification) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PostDetail', { threadId: notification.post_id });

    if (!notification.is_read) {
      markNotificationRead(notification.id, user.id)
        .then(() => {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, is_read: true } : item
            )
          );
        })
        .catch((err) => {
          console.warn('Failed to mark notification read:', err);
        });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || notifications.every((n) => n.is_read)) return;

    Haptics.selectionAsync();
    try {
      await markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const renderNotification = (notification: BackendNotification) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type);

    return (
      <Pressable
        key={notification.id}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: notification.is_read
              ? theme.colors.surface
              : theme.dark
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(4, 120, 87, 0.06)',
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => handleNotificationPress(notification)}
        accessibilityRole="button"
        accessibilityLabel={`${notification.message}. Open post.`}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatarWrap}>
            <Avatar
              src={notification.actor?.avatarurl}
              name={notification.actor?.fullname}
              userId={notification.actor_id}
              avatarSeed={notification.actor?.avatarseed}
              size="sm"
              showRing
            />
            <View style={[styles.typeBadge, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name={iconName} size={12} color={iconColor} />
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={3}>
              {notification.message}
            </Text>
            <Text style={[styles.time, { color: theme.colors.textMuted }]}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>

          {!notification.is_read && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
      </Pressable>
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sign In Required</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            Please sign in to view your notifications
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: theme.colors.primary }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 88 }} />
        )}
      </View>

      {error && !loading ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#ef4444'} />
          <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchNotifications}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Notifications Yet</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            When someone likes, prays for, or replies to your posts, you'll see it here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        >
          {notifications.map(renderNotification)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    minWidth: 88,
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardContent: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  time: {
    fontSize: 13,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
