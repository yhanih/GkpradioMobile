import { storage } from "./storage";
import { 
  type InsertNotification,
  type InsertNotificationPreference,
  type InsertNotificationQueue,
  type Notification
} from "@shared/schema";
import { EventEmitter } from "events";
import { 
  sendEmail, 
  createTagNotificationEmail, 
  createPrayerReplyEmail, 
  createEventReminderEmail 
} from "./mailersend";

// Notification types
export const NotificationTypes = {
  PRAYER_REPLY: "prayer_reply",
  PRAYER_JOINED: "prayer_joined", 
  MENTION: "mention",
  DIRECT_MESSAGE: "direct_message",
  ENCOURAGEMENT: "encouragement",
  HEALTH_UPDATE: "health_update",
  EVENT_REMINDER: "event_reminder",
  EVENT_CHANGED: "event_changed",
  CONTENT_FOLLOW: "content_follow",
  SYSTEM: "system"
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

// Notification event emitter
export const notificationEmitter = new EventEmitter();

// Emit notification event
export interface NotificationEvent {
  type: NotificationType;
  actorId: number;
  targetUserIds: number[];
  ref?: {
    type: "thread" | "comment" | "user" | "event" | "episode";
    id: number;
  };
  data?: Record<string, any>;
}

export function emitNotificationEvent(event: NotificationEvent) {
  console.log(`📢 Notification event: ${event.type} for ${event.targetUserIds.length} users`);
  notificationEmitter.emit("notification", event);
}

// Process notification events
notificationEmitter.on("notification", async (event: NotificationEvent) => {
  try {
    await processNotificationEvent(event);
  } catch (error) {
    console.error("Failed to process notification event:", error);
  }
});

async function processNotificationEvent(event: NotificationEvent) {
  const { type, actorId, targetUserIds, ref, data } = event;
  
  // Get actor information
  const actor = await storage.getUser(actorId);
  if (!actor) return;
  
  const actorName = actor.displayName || actor.username;
  
  // Generate notification content based on type
  const { title, body } = generateNotificationContent(type, actorName, data);
  
  // Create notifications for each target user
  for (const userId of targetUserIds) {
    // Check if user has this notification type enabled
    const preferences = await getUserPreferences(userId, type);
    if (!preferences.inApp) continue;
    
    // Check for duplicate notifications (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await supabaseStorage.getNotificationsByUser(userId, {
      type,
      since: oneHourAgo,
      refId: ref?.id
    });
    
    if (existing && existing.length > 0) continue; // Skip duplicate
    
    // Create notification
    const notification: InsertNotification = {
      userId,
      type,
      refType: ref?.type || null,
      refId: ref?.id || null,
      title,
      body,
      metadata: {
        actorId,
        actorName,
        ...data
      }
    };
    
    await supabaseStorage.createNotification(notification);
    
    // Add to queue for email/push if enabled
    if (preferences.email || preferences.push) {
      const queueItem: InsertNotificationQueue = {
        userId,
        type,
        payload: {
          notification,
          channels: {
            email: preferences.email,
            push: preferences.push
          }
        },
        scheduledFor: undefined
      };
      
      await supabaseStorage.createNotificationQueueItem(queueItem);
    }
  }
}

function generateNotificationContent(type: NotificationType, actorName: string, data?: Record<string, any>) {
  switch (type) {
    case NotificationTypes.PRAYER_REPLY:
      return {
        title: "New Prayer Reply",
        body: `${actorName} replied to your prayer request`
      };
    
    case NotificationTypes.PRAYER_JOINED:
      return {
        title: "Prayer Support",
        body: `${actorName} is praying for you`
      };
    
    case NotificationTypes.MENTION:
      return {
        title: "You were mentioned",
        body: `${actorName} mentioned you in a discussion`
      };
    
    case NotificationTypes.ENCOURAGEMENT:
      return {
        title: "Words of Encouragement",
        body: `${actorName} shared encouragement in a thread you follow`
      };
    
    case NotificationTypes.HEALTH_UPDATE:
      return {
        title: "Health & Wellness Update",
        body: `New update in Physical & Mental Health category`
      };
    
    case NotificationTypes.EVENT_REMINDER:
      return {
        title: data?.eventTitle || "Event Reminder",
        body: `Starting in ${data?.timeUntil || "soon"}`
      };
    
    case NotificationTypes.EVENT_CHANGED:
      return {
        title: "Event Updated",
        body: `${data?.eventTitle || "An event"} has been updated`
      };
    
    case NotificationTypes.CONTENT_FOLLOW:
      return {
        title: "New Content",
        body: `New ${data?.contentType || "content"} in ${data?.category || "a topic"} you follow`
      };
    
    case NotificationTypes.SYSTEM:
      return {
        title: data?.title || "System Notification",
        body: data?.message || "You have a new system notification"
      };
    
    default:
      return {
        title: "Notification",
        body: `${actorName} interacted with your content`
      };
  }
}

// Get user notification preferences
async function getUserPreferences(userId: number, type: NotificationType) {
  const prefs = await supabaseStorage.getNotificationPreference(userId, type);
  
  // Default preferences if none exist
  if (!prefs) {
    return {
      inApp: true,
      email: false,
      push: false,
      digest: "none",
      quietHours: null
    };
  }
  
  return prefs;
}

// API functions
export async function getNotifications(userId: number, options: {
  cursor?: string;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
}) {
  return await supabaseStorage.getNotifications(userId, options);
}

export async function markNotificationRead(userId: number, notificationId: number) {
  return await supabaseStorage.markNotificationRead(userId, notificationId);
}

export async function markAllNotificationsRead(userId: number) {
  return await supabaseStorage.markAllNotificationsRead(userId);
}

export async function getUnreadCount(userId: number): Promise<number> {
  return await supabaseStorage.getUnreadNotificationCount(userId);
}

export async function getUserNotificationPreferences(userId: number) {
  return await supabaseStorage.getUserNotificationPreferences(userId);
}

export async function updateNotificationPreference(
  userId: number, 
  type: NotificationType, 
  preferences: Partial<InsertNotificationPreference>
) {
  return await supabaseStorage.updateNotificationPreference(userId, type, preferences);
}

export async function subscribeToTopic(userId: number, topicKey: string) {
  return await supabaseStorage.subscribeToTopic(userId, topicKey);
}

export async function unsubscribeFromTopic(userId: number, topicKey: string) {
  return await supabaseStorage.unsubscribeFromTopic(userId, topicKey);
}

// Email notification processing
export async function processNotificationQueue() {
  try {
    // Skip processing entirely if no API token is available
    if (!process.env.MAILERSEND_API_TOKEN) {
      console.log('Skipping email queue processing: MAILERSEND_API_TOKEN not configured');
      return;
    }

    // Get pending email notifications from queue
    const pendingNotifications = await supabaseStorage.getPendingNotificationQueue(50);

    console.log(`Processing ${pendingNotifications.length} email notifications`);

    for (const queueItem of pendingNotifications) {
      try {
        const result = await processEmailNotification(queueItem);
        
        if (result.success) {
          // Remove successfully processed item from queue
          await supabaseStorage.deleteNotificationQueueItem(queueItem.id);
          console.log(`✅ Email notification ${queueItem.id} sent successfully`);
        } else if (result.shouldRetry) {
          // Keep item in queue for retry (temporary failure)
          console.log(`⏳ Email notification ${queueItem.id} will be retried: ${result.reason}`);
        } else {
          // Remove item that shouldn't be retried (permanent failure)
          await supabaseStorage.deleteNotificationQueueItem(queueItem.id);
          console.log(`❌ Email notification ${queueItem.id} permanently failed: ${result.reason}`);
        }
          
      } catch (error) {
        console.error(`Failed to process notification ${queueItem.id}:`, error);
        
        // Remove failed item from queue and log error
        console.error(`Removing failed notification ${queueItem.id} from queue:`, error);
        await supabaseStorage.deleteNotificationQueueItem(queueItem.id);
      }
    }
  } catch (error) {
    console.error('Failed to process notification queue:', error);
  }
}

async function processEmailNotification(queueItem: any): Promise<{success: boolean, shouldRetry: boolean, reason?: string}> {
  const { userId, type, payload } = queueItem;
  
  // Skip if email is not enabled for this notification
  if (!payload.channels?.email) {
    return { success: true, shouldRetry: false, reason: 'Email not enabled for this notification' };
  }

  // Check if API token is available
  if (!process.env.MAILERSEND_API_TOKEN) {
    console.log(`📧 Would send ${type} email notification to user ${userId} (API token not configured)`);
    return { success: false, shouldRetry: true, reason: 'MAILERSEND_API_TOKEN not configured' };
  }

  // Get user information
  const user = await supabaseStorage.getUser(userId);
    
  if (!user || !user.email) {
    return { success: false, shouldRetry: false, reason: `User ${userId} not found or has no email` };
  }

  const userEmail = user.email;
  const notification = payload.notification;
  
  // Create appropriate email based on notification type
  let emailParams;
  
  switch (type) {
    case NotificationTypes.MENTION:
      if (notification.metadata?.discussionTitle && notification.metadata?.discussionCategory && notification.refId) {
        emailParams = createTagNotificationEmail(
          userEmail,
          notification.metadata.actorName || 'Someone',
          notification.metadata.discussionTitle,
          notification.metadata.discussionCategory,
          notification.refId
        );
      }
      break;
      
    case NotificationTypes.PRAYER_REPLY:
      if (notification.metadata?.prayerTitle && notification.metadata?.replyContent && notification.refId) {
        emailParams = createPrayerReplyEmail(
          userEmail,
          notification.metadata.actorName || 'Someone',
          notification.metadata.prayerTitle,
          notification.metadata.replyContent,
          notification.refId
        );
      }
      break;
      
    case NotificationTypes.EVENT_REMINDER:
      if (notification.metadata?.eventTitle && notification.metadata?.eventTime) {
        emailParams = createEventReminderEmail(
          userEmail,
          notification.metadata.eventTitle,
          notification.metadata.eventTime,
          notification.metadata.eventDescription
        );
      }
      break;
      
    default:
      // Create generic email for other notification types
      emailParams = {
        to: userEmail,
        from: process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com',
        subject: notification.title,
        text: `Hello,

${notification.body}

Visit GKP Radio Community to see more details.

Blessings,
GKP Radio Community`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">GKP Radio Community</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${notification.title}</p>
            </div>
            
            <div style="padding: 30px; background: white;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hello,</p>
              
              <p>${notification.body}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.SITE_URL || 'https://godkingdomprinciplesradio.com'}" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit GKP Radio</a>
              </div>
              
              <p style="margin-top: 30px;">Blessings,<br><strong>GKP Radio Community</strong></p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
              <p>GKP Radio - Building Faith Communities Worldwide</p>
            </div>
          </div>
        `
      };
      break;
  }
  
  if (emailParams) {
    const success = await sendEmail(emailParams);
    if (success) {
      console.log(`📧 Email sent successfully for ${type} notification to ${userEmail}`);
      return { success: true, shouldRetry: false };
    } else {
      console.log(`📧 Failed to send ${type} email notification to ${userEmail}`);
      return { success: false, shouldRetry: true, reason: 'Failed to send email via MailerSend' };
    }
  } else {
    console.log(`📧 No email template available for notification type: ${type}`);
    return { success: false, shouldRetry: false, reason: `No email template available for ${type}` };
  }
}

// Enhanced notification event processing with email queue processing
export async function processNotificationEventWithEmail(event: NotificationEvent) {
  // Process the notification event as usual
  await processNotificationEvent(event);
  
  // Process email queue immediately for real-time notifications
  // This ensures emails are sent promptly for important notifications
  const priorityTypes: NotificationType[] = [NotificationTypes.MENTION, NotificationTypes.PRAYER_REPLY, NotificationTypes.EVENT_REMINDER];
  if (priorityTypes.includes(event.type)) {
    await processNotificationQueue();
  }
}

// Background email processor - should be called periodically
export function startEmailProcessor(intervalMinutes: number = 5) {
  console.log(`Starting email notification processor (every ${intervalMinutes} minutes)`);
  
  // Process immediately on startup
  processNotificationQueue();
  
  // Set up periodic processing
  setInterval(() => {
    processNotificationQueue();
  }, intervalMinutes * 60 * 1000);
}

// Enhanced mention notification with additional metadata
export async function sendMentionNotification(
  mentionedUserId: number,
  mentionerUserId: number,
  discussionId: number,
  discussionTitle: string,
  discussionCategory: string
) {
  const event: NotificationEvent = {
    type: NotificationTypes.MENTION,
    actorId: mentionerUserId,
    targetUserIds: [mentionedUserId],
    ref: {
      type: "thread",
      id: discussionId
    },
    data: {
      discussionTitle,
      discussionCategory
    }
  };
  
  await processNotificationEventWithEmail(event);
}

// Enhanced prayer reply notification
export async function sendPrayerReplyNotification(
  prayerAuthorUserId: number,
  replierUserId: number,
  prayerId: number,
  prayerTitle: string,
  replyContent: string
) {
  const event: NotificationEvent = {
    type: NotificationTypes.PRAYER_REPLY,
    actorId: replierUserId,
    targetUserIds: [prayerAuthorUserId],
    ref: {
      type: "comment",
      id: prayerId
    },
    data: {
      prayerTitle,
      replyContent
    }
  };
  
  await processNotificationEventWithEmail(event);
}

// Enhanced event reminder notification
export async function sendEventReminderNotification(
  userIds: number[],
  eventTitle: string,
  eventTime: string,
  eventDescription?: string
) {
  const event: NotificationEvent = {
    type: NotificationTypes.EVENT_REMINDER,
    actorId: 1, // System user ID
    targetUserIds: userIds,
    data: {
      eventTitle,
      eventTime,
      eventDescription
    }
  };
  
  await processNotificationEventWithEmail(event);
}