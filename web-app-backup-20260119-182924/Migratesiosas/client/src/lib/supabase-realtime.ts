import { supabase } from './supabase';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// ============================================
// REALTIME NOTIFICATIONS (FIXED)
// ============================================

export class SupabaseRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceChannel: RealtimeChannel | null = null;
  private notificationHandlers: Set<(notification: any) => void> = new Set();
  private presenceHandlers: Set<(state: RealtimePresenceState) => void> = new Set();

  // Initialize realtime connection for user
  async initializeForUser(userId: string) {
    // Clean up existing channels
    this.cleanup();

    // Subscribe to notifications for this user
    const notificationChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          this.handleNewNotification(payload.new);
        }
      )
      .subscribe();

    this.channels.set('notifications', notificationChannel);

    // Initialize presence channel for online users
    this.initializePresence(userId);
  }

  // Initialize presence tracking (FIXED with proper config)
  private async initializePresence(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create presence channel with proper configuration
    this.presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId, // Required for presence tracking
        },
      },
    });

    // Set up presence event handlers
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        if (state) {
          this.handlePresenceUpdate(state);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // User joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User left
      });

    // Subscribe and track presence
    await this.presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        await this.presenceChannel?.track({
          userId,
          username: user.user_metadata?.username || 'Anonymous',
          onlineAt: new Date().toISOString(),
        }).catch(error => {
          console.error('Failed to track presence:', error);
        });
      }
    });
  }

  // Handle new notification (FIXED with browser capability check)
  private handleNewNotification(notification: any) {
    this.notificationHandlers.forEach(handler => handler(notification));
    
    // Check if browser supports notifications and has permission
    if (typeof Notification !== 'undefined' && 
        Notification.permission === 'granted' && 
        !document.hasFocus()) {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `notification-${notification.id}`,
        });
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }
  }

  // Handle presence updates
  private handlePresenceUpdate(state: RealtimePresenceState) {
    this.presenceHandlers.forEach(handler => handler(state));
  }

  // Register notification handler
  onNotification(handler: (notification: any) => void) {
    this.notificationHandlers.add(handler);
    
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  // Register presence handler
  onPresenceUpdate(handler: (state: RealtimePresenceState) => void) {
    this.presenceHandlers.add(handler);
    
    return () => {
      this.presenceHandlers.delete(handler);
    };
  }

  // Get online users count
  getOnlineUsersCount(): number {
    if (!this.presenceChannel) return 0;
    const state = this.presenceChannel.presenceState();
    return Object.keys(state).length;
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Clean up all channels
  cleanup() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();

    if (this.presenceChannel) {
      this.presenceChannel.untrack().catch(console.error);
      supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
  }
}

// ============================================
// COMMUNITY REALTIME
// ============================================

export class CommunityRealtimeService {
  private threadChannels: Map<number, RealtimeChannel> = new Map();
  private communityChannel: RealtimeChannel | null = null;

  // Subscribe to all community updates
  initializeCommunity() {
    this.communityChannel = supabase
      .channel('community-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communityThreads'
        },
        (payload) => {
          this.handleThreadUpdate(payload);
        }
      )
      .subscribe();
  }

  // Subscribe to specific thread comments
  subscribeToThread(threadId: number, onComment: (comment: any) => void) {
    // Don't duplicate subscriptions
    if (this.threadChannels.has(threadId)) return;

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communityComments',
          filter: `threadId=eq.${threadId}`
        },
        (payload) => {
          onComment(payload.new);
        }
      )
      .subscribe();

    this.threadChannels.set(threadId, channel);
  }

  // Unsubscribe from thread
  unsubscribeFromThread(threadId: number) {
    const channel = this.threadChannels.get(threadId);
    if (channel) {
      supabase.removeChannel(channel);
      this.threadChannels.delete(threadId);
    }
  }

  private handleThreadUpdate(payload: any) {
    // Emit events based on operation type
    const event = new CustomEvent('community-thread-update', {
      detail: {
        type: payload.eventType,
        thread: payload.new || payload.old,
        oldThread: payload.old
      }
    });
    window.dispatchEvent(event);
  }

  // Clean up
  cleanup() {
    if (this.communityChannel) {
      supabase.removeChannel(this.communityChannel);
      this.communityChannel = null;
    }

    this.threadChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.threadChannels.clear();
  }
}

// ============================================
// LIVE STREAMING REALTIME
// ============================================

export class LiveStreamRealtimeService {
  private chatChannel: RealtimeChannel | null = null;
  private streamStatusChannel: RealtimeChannel | null = null;

  // Initialize live chat
  initializeLiveChat(onMessage: (message: any) => void) {
    this.chatChannel = supabase
      .channel('live-chat')
      .on('broadcast', { event: 'message' }, (payload) => {
        onMessage(payload.payload);
      })
      .subscribe();
  }

  // Send chat message
  async sendChatMessage(message: string, username: string) {
    if (!this.chatChannel) return;

    await this.chatChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        id: Date.now(),
        username,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Subscribe to stream status updates
  initializeStreamStatus(onStatusChange: (status: any) => void) {
    this.streamStatusChannel = supabase
      .channel('stream-status')
      .on('broadcast', { event: 'status' }, (payload) => {
        onStatusChange(payload.payload);
      })
      .subscribe();
  }

  // Clean up
  cleanup() {
    if (this.chatChannel) {
      supabase.removeChannel(this.chatChannel);
      this.chatChannel = null;
    }

    if (this.streamStatusChannel) {
      supabase.removeChannel(this.streamStatusChannel);
      this.streamStatusChannel = null;
    }
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

export const realtimeService = new SupabaseRealtimeService();
export const communityRealtime = new CommunityRealtimeService();
export const liveStreamRealtime = new LiveStreamRealtimeService();

// Initialize on auth state change
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    realtimeService.initializeForUser(session.user.id);
    communityRealtime.initializeCommunity();
  } else if (event === 'SIGNED_OUT') {
    realtimeService.cleanup();
    communityRealtime.cleanup();
    liveStreamRealtime.cleanup();
  }
});