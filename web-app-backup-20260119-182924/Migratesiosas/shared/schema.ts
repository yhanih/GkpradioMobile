import { pgTable, text, serial, integer, boolean, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  avatar: text("avatar"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"), // in seconds
  hostName: text("host_name"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").array(),
  isLive: boolean("is_live").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull(), // Worship, Youth, Healing, Teachings
  duration: integer("duration"), // in seconds
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  hostName: text("host_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Video likes/reactions
export const videoLikes = pgTable("video_likes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserVideo: unique().on(table.videoId, table.userId),
}));

// Video comments
export const videoComments = pgTable("video_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"), // for nested replies
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video playlists
export const videoPlaylists = pgTable("video_playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Video playlist items
export const videoPlaylistItems = pgTable("video_playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => videoPlaylists.id).notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityThreads = pgTable("community_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category").notNull(), // Prayer Requests, Praise Reports, Testimonies, etc.
  authorId: integer("author_id").references(() => users.id).notNull(),
  taggedSpouseId: integer("tagged_spouse_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"), // for nested replies - self reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodeComments = pgTable("episode_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  episodeId: integer("episode_id").references(() => episodes.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Community thread likes/reactions
export const threadLikes = pgTable("thread_likes", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Community thread follows 
export const threadFollows = pgTable("thread_follows", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  communityThreads: many(communityThreads),
  communityComments: many(communityComments),
  episodeComments: many(episodeComments),
  threadLikes: many(threadLikes),
  threadFollows: many(threadFollows),
  videoLikes: many(videoLikes),
  videoComments: many(videoComments),
  videoPlaylists: many(videoPlaylists),
  discussionTags: many(discussionTags),
}));

export const videosRelations = relations(videos, ({ many }) => ({
  likes: many(videoLikes),
  comments: many(videoComments),
  playlistItems: many(videoPlaylistItems),
}));

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
  video: one(videos, {
    fields: [videoLikes.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoLikes.userId],
    references: [users.id],
  }),
}));

export const videoCommentsRelations = relations(videoComments, ({ one, many }) => ({
  video: one(videos, {
    fields: [videoComments.videoId],
    references: [videos.id],
  }),
  author: one(users, {
    fields: [videoComments.authorId],
    references: [users.id],
  }),
  parent: one(videoComments, {
    fields: [videoComments.parentId],
    references: [videoComments.id],
    relationName: "VideoCommentParent",
  }),
  replies: many(videoComments, {
    relationName: "VideoCommentParent",
  }),
}));

export const videoPlaylistsRelations = relations(videoPlaylists, ({ one, many }) => ({
  creator: one(users, {
    fields: [videoPlaylists.creatorId],
    references: [users.id],
  }),
  items: many(videoPlaylistItems),
}));

export const videoPlaylistItemsRelations = relations(videoPlaylistItems, ({ one }) => ({
  playlist: one(videoPlaylists, {
    fields: [videoPlaylistItems.playlistId],
    references: [videoPlaylists.id],
  }),
  video: one(videos, {
    fields: [videoPlaylistItems.videoId],
    references: [videos.id],
  }),
}));

export const threadLikesRelations = relations(threadLikes, ({ one }) => ({
  thread: one(communityThreads, {
    fields: [threadLikes.threadId],
    references: [communityThreads.id],
  }),
  user: one(users, {
    fields: [threadLikes.userId],
    references: [users.id],
  }),
}));

export const threadFollowsRelations = relations(threadFollows, ({ one }) => ({
  thread: one(communityThreads, {
    fields: [threadFollows.threadId],
    references: [communityThreads.id],
  }),
  user: one(users, {
    fields: [threadFollows.userId],
    references: [users.id],
  }),
}));


export const communityThreadsRelations = relations(communityThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [communityThreads.authorId],
    references: [users.id],
  }),
  comments: many(communityComments),
  likes: many(threadLikes),
  follows: many(threadFollows),
  tags: many(discussionTags),
}));

export const communityCommentsRelations = relations(communityComments, ({ one, many }) => ({
  author: one(users, {
    fields: [communityComments.authorId],
    references: [users.id],
  }),
  thread: one(communityThreads, {
    fields: [communityComments.threadId],
    references: [communityThreads.id],
  }),
  parent: one(communityComments, {
    fields: [communityComments.parentId],
    references: [communityComments.id],
    relationName: "CommentParent",
  }),
  replies: many(communityComments, {
    relationName: "CommentParent",
  }),
}));

export const episodesRelations = relations(episodes, ({ many }) => ({
  comments: many(episodeComments),
}));

export const episodeCommentsRelations = relations(episodeComments, ({ one }) => ({
  author: one(users, {
    fields: [episodeComments.authorId],
    references: [users.id],
  }),
  episode: one(episodes, {
    fields: [episodeComments.episodeId],
    references: [episodes.id],
  }),
}));

// Notifications system tables
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // prayer_reply, prayer_joined, mention, direct_message, etc.
  refType: text("ref_type"), // thread, comment, user, event, etc.
  refId: integer("ref_id"), // ID of the referenced entity
  title: text("title").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"), // additional data like actor name, counts, etc.
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // prayer_reply, mentions, etc.
  inApp: boolean("in_app").default(true),
  email: boolean("email").default(false),
  push: boolean("push").default(false),
  digest: text("digest").default("none"), // none, daily, weekly
  quietHours: jsonb("quiet_hours"), // {start: "22:00", end: "08:00"}
}, (table) => ({
  uniqueUserType: unique().on(table.userId, table.type),
}));

export const notificationChannels = pgTable("notification_channels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  email: text("email"),
  pushToken: text("push_token"),
  webpushKeys: jsonb("webpush_keys"), // {endpoint, keys: {p256dh, auth}}
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUser: unique().on(table.userId),
}));

export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  scheduledFor: timestamp("scheduled_for").defaultNow().notNull(),
  attempts: integer("attempts").default(0),
  status: text("status").default("pending"), // pending, processing, done, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userTopicSubscriptions = pgTable("user_topic_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  topicKey: text("topic_key").notNull(), // prayer_requests, testimonies, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserTopic: unique().on(table.userId, table.topicKey),
}));

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // stream urls, meeting links, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => calendarEvents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  response: text("response").notNull(), // yes, no, maybe
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserEvent: unique().on(table.eventId, table.userId),
}));

export const calendarReminders = pgTable("calendar_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => calendarEvents.id).notNull(),
  offsetMinutes: integer("offset_minutes").notNull(), // minutes before event
  method: text("method").notNull(), // in_app, email, push
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  username: text("username").notNull(),
  userId: integer("user_id").references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Program reminders table  
export const programReminders = pgTable("program_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  programTitle: text("program_title").notNull(),
  programTime: text("program_time").notNull(),
  reminderType: text("reminder_type").notNull(), // 'email', 'notification', 'both'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discussion tagging system
export const discussionTags = pgTable("discussion_tags", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").references(() => communityThreads.id).notNull(),
  taggedUserId: integer("tagged_user_id").references(() => users.id), // nullable for email-only tags
  taggedEmail: text("tagged_email"), // nullable for username tags
  tagCategory: text("tag_category"), // husband, wife, friend, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Promotional orders table
export const promotionalOrders = pgTable("promotional_orders", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  phone: text("phone"),
  websiteUrl: text("website_url"),
  socialMediaLinks: text("social_media_links"),
  ministryDescription: text("ministry_description").notNull(),
  message: text("message"),
  packageType: text("package_type").notNull(), // Faith Starter, Kingdom Growth, Divine Premium
  packagePrice: text("package_price").notNull(), // $99, $249, $499
  status: text("status").default("pending"), // pending, reviewed, approved, rejected, active, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const notificationChannelsRelations = relations(notificationChannels, ({ one }) => ({
  user: one(users, {
    fields: [notificationChannels.userId],
    references: [users.id],
  }),
}));

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  user: one(users, {
    fields: [notificationQueue.userId],
    references: [users.id],
  }),
}));

export const userTopicSubscriptionsRelations = relations(userTopicSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userTopicSubscriptions.userId],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  creator: one(users, {
    fields: [calendarEvents.creatorId],
    references: [users.id],
  }),
  rsvps: many(eventRsvps),
  reminders: many(calendarReminders),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventRsvps.eventId],
    references: [calendarEvents.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const calendarRemindersRelations = relations(calendarReminders, ({ one }) => ({
  user: one(users, {
    fields: [calendarReminders.userId],
    references: [users.id],
  }),
  event: one(calendarEvents, {
    fields: [calendarReminders.eventId],
    references: [calendarEvents.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const programRemindersRelations = relations(programReminders, ({ one }) => ({
  user: one(users, {
    fields: [programReminders.userId],
    references: [users.id],
  }),
}));

export const discussionTagsRelations = relations(discussionTags, ({ one }) => ({
  discussion: one(communityThreads, {
    fields: [discussionTags.discussionId],
    references: [communityThreads.id],
  }),
  taggedUser: one(users, {
    fields: [discussionTags.taggedUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  city: true,
  country: true,
  bio: true,
  avatar: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).pick({
  title: true,
  description: true,
  audioUrl: true,
  duration: true,
  hostName: true,
  thumbnailUrl: true,
  tags: true,
  isLive: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  videoUrl: true,
  thumbnailUrl: true,
  category: true,
  duration: true,
  tags: true,
  hostName: true,
  isNew: true,
  isFeatured: true,
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).pick({
  videoId: true,
  userId: true,
});

export const insertVideoCommentSchema = createInsertSchema(videoComments).pick({
  content: true,
  videoId: true,
  authorId: true,
  parentId: true,
});

export const insertVideoPlaylistSchema = createInsertSchema(videoPlaylists).pick({
  name: true,
  description: true,
  creatorId: true,
  isPublic: true,
});

export const insertVideoPlaylistItemSchema = createInsertSchema(videoPlaylistItems).pick({
  playlistId: true,
  videoId: true,
  position: true,
});

export const insertCommunityThreadSchema = createInsertSchema(communityThreads).pick({
  title: true,
  content: true,
  category: true,
  authorId: true,
  taggedSpouseId: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).pick({
  content: true,
  threadId: true,
  authorId: true,
  parentId: true,
});

export const insertEpisodeCommentSchema = createInsertSchema(episodeComments).pick({
  content: true,
  episodeId: true,
  authorId: true,
});

export const insertThreadLikeSchema = createInsertSchema(threadLikes).pick({
  threadId: true,
  userId: true,
});

export const insertThreadFollowSchema = createInsertSchema(threadFollows).pick({
  threadId: true,
  userId: true,
});


// Notification insert schemas
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  refType: true,
  refId: true,
  title: true,
  body: true,
  metadata: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).pick({
  userId: true,
  type: true,
  inApp: true,
  email: true,
  push: true,
  digest: true,
  quietHours: true,
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).pick({
  userId: true,
  email: true,
  pushToken: true,
  webpushKeys: true,
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).pick({
  userId: true,
  type: true,
  payload: true,
  scheduledFor: true,
});

export const insertUserTopicSubscriptionSchema = createInsertSchema(userTopicSubscriptions).pick({
  userId: true,
  topicKey: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  creatorId: true,
  isPublic: true,
  tags: true,
  metadata: true,
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).pick({
  eventId: true,
  userId: true,
  response: true,
});

export const insertCalendarReminderSchema = createInsertSchema(calendarReminders).pick({
  userId: true,
  eventId: true,
  offsetMinutes: true,
  method: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
  username: true,
  userId: true,
  isVerified: true,
});

export const insertProgramReminderSchema = createInsertSchema(programReminders).pick({
  userId: true,
  programTitle: true,
  programTime: true,
  reminderType: true,
  isActive: true,
});

export const insertDiscussionTagSchema = createInsertSchema(discussionTags).pick({
  discussionId: true,
  taggedUserId: true,
  taggedEmail: true,
  tagCategory: true,
});

export const insertPromotionalOrderSchema = createInsertSchema(promotionalOrders).pick({
  businessName: true,
  contactPerson: true,
  contactEmail: true,
  phone: true,
  websiteUrl: true,
  socialMediaLinks: true,
  ministryDescription: true,
  message: true,
  packageType: true,
  packagePrice: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertCommunityThread = z.infer<typeof insertCommunityThreadSchema>;
export type CommunityThread = typeof communityThreads.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertEpisodeComment = z.infer<typeof insertEpisodeCommentSchema>;
export type EpisodeComment = typeof episodeComments.$inferSelect;
export type InsertThreadLike = z.infer<typeof insertThreadLikeSchema>;
export type ThreadLike = typeof threadLikes.$inferSelect;
export type InsertThreadFollow = z.infer<typeof insertThreadFollowSchema>;
export type ThreadFollow = typeof threadFollows.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;
export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoComment = z.infer<typeof insertVideoCommentSchema>;
export type VideoComment = typeof videoComments.$inferSelect;
export type InsertVideoPlaylist = z.infer<typeof insertVideoPlaylistSchema>;
export type VideoPlaylist = typeof videoPlaylists.$inferSelect;
export type InsertVideoPlaylistItem = z.infer<typeof insertVideoPlaylistItemSchema>;
export type VideoPlaylistItem = typeof videoPlaylistItems.$inferSelect;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type UserTopicSubscription = typeof userTopicSubscriptions.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type CalendarReminder = typeof calendarReminders.$inferSelect;

// Insert types
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type InsertUserTopicSubscription = z.infer<typeof insertUserTopicSubscriptionSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type InsertCalendarReminder = z.infer<typeof insertCalendarReminderSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ProgramReminder = typeof programReminders.$inferSelect;
export type InsertProgramReminder = z.infer<typeof insertProgramReminderSchema>;
export type DiscussionTag = typeof discussionTags.$inferSelect;
export type InsertDiscussionTag = z.infer<typeof insertDiscussionTagSchema>;
export type PromotionalOrder = typeof promotionalOrders.$inferSelect;
export type InsertPromotionalOrder = z.infer<typeof insertPromotionalOrderSchema>;
