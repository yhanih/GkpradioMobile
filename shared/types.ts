// Type definitions for Supabase tables based on schema
// These match the database schema exactly

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio?: string | null;
  avatar?: string | null;
  city?: string | null;
  country?: string | null;
  emailVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Episode {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration: number;
  publishedAt: string | Date;
  featured: boolean;
  tags?: string[] | null;
  downloads: number;
  likes: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration: number;
  category: string;
  tags?: string[] | null;
  featured: boolean;
  views: number;
  likes: number;
  publishedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CommunityThread {
  id: number;
  title: string;
  content: string;
  category: string;
  authorId: number;
  tags?: string[] | null;
  viewCount: number;
  replyCount: number;
  lastActivityAt: string | Date;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

export interface CommunityComment {
  id: number;
  threadId: number;
  authorId: number;
  content: string;
  parentId?: number | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: string | Date;
}

export interface NotificationSettings {
  id: number;
  userId: number;
  communityReplies: boolean;
  communityMentions: boolean;
  episodeReleases: boolean;
  liveShows: boolean;
  generalAnnouncements: boolean;
  emailDigest: string;
  pushEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Sponsor {
  id: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  tier: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  photoUrl?: string | null;
  socialLinks?: any;
  displayOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string | null;
  eventType: string;
  startTime: string | Date;
  endTime: string | Date;
  location?: string | null;
  isRecurring: boolean;
  recurringPattern?: any;
  reminderMinutes?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StreamSchedule {
  id: number;
  showName: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  hosts?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PrayerRequest {
  id: number;
  name: string;
  email?: string | null;
  request: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: string | Date;
  unsubscribedAt?: string | Date | null;
}

export interface VideoComment {
  id: number;
  videoId: number;
  authorId: number;
  content: string;
  parentId?: number | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

export interface EpisodeComment {
  id: number;
  episodeId: number;
  authorId: number;
  content: string;
  parentId?: number | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

export interface LiveChatMessage {
  id: number;
  userId?: number | null;
  username: string;
  message: string;
  isModerated: boolean;
  createdAt: string | Date;
}

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  service: string;
  isActive: boolean;
  lastUsedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  variables?: string[] | null;
  category: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MediaUpload {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy?: number | null;
  associatedType?: string | null;
  associatedId?: number | null;
  createdAt: string | Date;
}

export interface UserSession {
  id: number;
  userId: number;
  sessionToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string | Date;
  createdAt: string | Date;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | Date;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt?: string | Date | null;
  createdAt: string | Date;
}