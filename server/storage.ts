// Storage interface definition for database operations
import type {
  User, 
  InsertUser,
  Episode,
  InsertEpisode,
  Video,
  InsertVideo,
  CommunityThread,
  InsertCommunityThread,
  CommunityComment,
  InsertCommunityComment,
  EpisodeComment,
  InsertEpisodeComment,
  ThreadLike,
  InsertThreadLike,
  ThreadFollow,
  InsertThreadFollow,
  VideoLike,
  InsertVideoLike,
  VideoComment,
  InsertVideoComment,
  VideoPlaylist,
  InsertVideoPlaylist,
  VideoPlaylistItem,
  InsertVideoPlaylistItem,
  CalendarEvent,
  InsertCalendarEvent,
  ChatMessage,
  InsertChatMessage,
  ProgramReminder,
  InsertProgramReminder,
  PromotionalOrder,
  InsertPromotionalOrder,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Episode methods
  getEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  
  // Video methods
  getVideos(options?: {
    category?: string;
    search?: string;
    sortBy?: 'recent' | 'popular' | 'trending' | 'views' | 'likes';
    limit?: number;
    offset?: number;
    userId?: number; // for checking if user liked videos
  }): Promise<Video[]>;
  getVideo(id: number, userId?: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  incrementVideoViews(id: number): Promise<void>;
  
  // Video interaction methods
  likeVideo(videoId: number, userId: number): Promise<void>;
  unlikeVideo(videoId: number, userId: number): Promise<void>;
  isVideoLikedByUser(videoId: number, userId: number): Promise<boolean>;
  getVideoStats(videoId: number): Promise<{
    views: number;
    likes: number;
    comments: number;
  }>;
  
  // Video category methods
  getVideoCategories(): Promise<Array<{
    name: string;
    count: number;
  }>>;
  
  // Video playlist methods
  createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist>;
  getPlaylists(creatorId?: number): Promise<VideoPlaylist[]>;
  getPlaylist(id: number): Promise<VideoPlaylist | undefined>;
  addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<void>;
  removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void>;
  
  // Video comment methods
  createVideoComment(comment: InsertVideoComment): Promise<VideoComment>;
  getVideoComments(videoId: number): Promise<VideoComment[]>;
  
  // Community Thread methods
  getCommunityThreads(options?: {
    category?: string;
    search?: string;
    sortBy?: string;
  }): Promise<any[]>;
  getCommunityThreadsWithStats(): Promise<any[]>;
  getCommunityThreadsByCategory(category: string): Promise<any[]>;
  searchCommunityThreads(query: string): Promise<any[]>;
  getCommunityThread(id: string): Promise<CommunityThread | undefined>;
  createCommunityThread(thread: InsertCommunityThread): Promise<CommunityThread>;
  updateCommunityThreadActivity(id: string): Promise<void>;
  
  // Community Comment methods
  getCommunityComments(threadId: string): Promise<CommunityComment[]>;
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;
  
  // Thread Likes methods
  likeThread(like: InsertThreadLike): Promise<ThreadLike>;
  unlikeThread(threadId: string, userId: string): Promise<void>;
  isThreadLikedByUser(threadId: string, userId: string): Promise<boolean>;
  getThreadLikeCount(threadId: string): Promise<number>;
  
  // Thread Follow methods
  followThread(follow: InsertThreadFollow): Promise<ThreadFollow>;
  unfollowThread(threadId: string, userId: string): Promise<void>;
  isThreadFollowedByUser(threadId: string, userId: string): Promise<boolean>;
  getFollowedThreadsByUser(userId: string): Promise<any[]>;
  
  
  // Community Stats methods
  getCommunityStats(): Promise<{
    totalMembers: number;
    totalDiscussions: number;
    totalPrayers: number;
    categoryStats: { category: string; count: number }[];
  }>;
  
  // Episode Comment methods
  getEpisodeComments(episodeId: number): Promise<EpisodeComment[]>;
  createEpisodeComment(comment: InsertEpisodeComment): Promise<EpisodeComment>;

  // Calendar Event methods
  getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getUpcomingCalendarEvents(limit: number): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  
  // Promotional Order methods
  createPromotionalOrder(order: InsertPromotionalOrder): Promise<PromotionalOrder>;
  getPromotionalOrders(): Promise<PromotionalOrder[]>;
  getPromotionalOrderById(id: number): Promise<PromotionalOrder | undefined>;
  updatePromotionalOrderStatus(id: number, status: string): Promise<PromotionalOrder>;
  
  // Chat Message methods (optional, for compatibility)
  getChatMessages?(limit?: number): Promise<ChatMessage[]>;
  createChatMessage?(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Program Reminder methods (optional, for compatibility)
  getUserReminders?(userId: number): Promise<ProgramReminder[]>;
  createProgramReminder?(reminder: InsertProgramReminder): Promise<ProgramReminder>;
  deleteReminder?(reminderId: number, userId: number): Promise<boolean>;
  
  // Thread and Comment deletion methods
  deleteThread?(threadId: number, userId: number): Promise<boolean>;
  deleteComment?(commentId: number, userId: number): Promise<boolean>;
}

// Use Supabase storage implementation for all database operations
import { supabaseStorage } from "./storage-supabase";

// Export the Supabase storage implementation for database operations
// This ensures all database operations go through Supabase
export const storage = supabaseStorage;