import { db } from "./db";
import { eq, desc, and, sql, like, or, count as drizzleCount, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
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
import type { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  // Episode methods
  async getEpisodes(): Promise<Episode[]> {
    return db.select().from(schema.episodes).orderBy(desc(schema.episodes.createdAt));
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const result = await db.select().from(schema.episodes).where(eq(schema.episodes.id, id));
    return result[0];
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const result = await db.insert(schema.episodes).values(episode).returning();
    return result[0];
  }

  // Video methods
  async getVideos(options?: {
    category?: string;
    search?: string;
    sortBy?: 'recent' | 'popular' | 'trending' | 'views' | 'likes';
    limit?: number;
    offset?: number;
    userId?: number;
  }): Promise<Video[]> {
    const { category, search, sortBy = 'recent', limit = 20, offset = 0 } = options || {};
    
    let query = db.select().from(schema.videos);
    const conditions = [];
    
    if (category) {
      conditions.push(eq(schema.videos.category, category));
    }
    
    if (search) {
      conditions.push(
        or(
          like(schema.videos.title, `%${search}%`),
          like(schema.videos.description, `%${search}%`)
        )!
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }
    
    switch (sortBy) {
      case 'views':
        query = query.orderBy(desc(schema.videos.views)) as any;
        break;
      case 'likes':
        query = query.orderBy(desc(schema.videos.likes)) as any;
        break;
      case 'popular':
      case 'trending':
        query = query.orderBy(desc(schema.videos.views), desc(schema.videos.likes)) as any;
        break;
      default:
        query = query.orderBy(desc(schema.videos.createdAt)) as any;
    }
    
    query = query.limit(limit).offset(offset) as any;
    
    return query;
  }

  async getVideo(id: number, userId?: number): Promise<Video | undefined> {
    const result = await db.select().from(schema.videos).where(eq(schema.videos.id, id));
    return result[0];
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const result = await db.insert(schema.videos).values(video).returning();
    return result[0];
  }

  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video> {
    const result = await db.update(schema.videos)
      .set({ ...video, updatedAt: new Date() })
      .where(eq(schema.videos.id, id))
      .returning();
    return result[0];
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(schema.videos).where(eq(schema.videos.id, id));
  }

  async incrementVideoViews(id: number): Promise<void> {
    await db.update(schema.videos)
      .set({ views: sql`${schema.videos.views} + 1` })
      .where(eq(schema.videos.id, id));
  }

  // Video interaction methods
  async likeVideo(videoId: number, userId: number): Promise<void> {
    await db.insert(schema.videoLikes).values({ videoId, userId });
    await db.update(schema.videos)
      .set({ likes: sql`${schema.videos.likes} + 1` })
      .where(eq(schema.videos.id, videoId));
  }

  async unlikeVideo(videoId: number, userId: number): Promise<void> {
    await db.delete(schema.videoLikes)
      .where(and(eq(schema.videoLikes.videoId, videoId), eq(schema.videoLikes.userId, userId)));
    await db.update(schema.videos)
      .set({ likes: sql`${schema.videos.likes} - 1` })
      .where(eq(schema.videos.id, videoId));
  }

  async isVideoLikedByUser(videoId: number, userId: number): Promise<boolean> {
    const result = await db.select().from(schema.videoLikes)
      .where(and(eq(schema.videoLikes.videoId, videoId), eq(schema.videoLikes.userId, userId)));
    return result.length > 0;
  }

  async getVideoStats(videoId: number): Promise<{ views: number; likes: number; comments: number }> {
    const video = await db.select().from(schema.videos).where(eq(schema.videos.id, videoId));
    const commentCount = await db.select({ count: drizzleCount() })
      .from(schema.videoComments)
      .where(eq(schema.videoComments.videoId, videoId));
    
    return {
      views: video[0]?.views || 0,
      likes: video[0]?.likes || 0,
      comments: commentCount[0]?.count || 0,
    };
  }

  // Video category methods
  async getVideoCategories(): Promise<Array<{ name: string; count: number }>> {
    const result = await db.select({
      name: schema.videos.category,
      count: drizzleCount(),
    })
    .from(schema.videos)
    .groupBy(schema.videos.category);
    
    return result as Array<{ name: string; count: number }>;
  }

  // Playlist methods
  async createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist> {
    const result = await db.insert(schema.videoPlaylists).values(playlist).returning();
    return result[0];
  }

  async getPlaylists(creatorId?: number): Promise<VideoPlaylist[]> {
    if (creatorId) {
      return db.select().from(schema.videoPlaylists)
        .where(eq(schema.videoPlaylists.creatorId, creatorId))
        .orderBy(desc(schema.videoPlaylists.createdAt));
    }
    return db.select().from(schema.videoPlaylists).orderBy(desc(schema.videoPlaylists.createdAt));
  }

  async getPlaylist(id: number): Promise<VideoPlaylist | undefined> {
    const result = await db.select().from(schema.videoPlaylists)
      .where(eq(schema.videoPlaylists.id, id));
    return result[0];
  }

  async addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<void> {
    await db.insert(schema.videoPlaylistItems)
      .values({ playlistId, videoId, position });
  }

  async removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void> {
    await db.delete(schema.videoPlaylistItems)
      .where(and(
        eq(schema.videoPlaylistItems.playlistId, playlistId),
        eq(schema.videoPlaylistItems.videoId, videoId)
      ));
  }

  // Video comment methods
  async createVideoComment(comment: InsertVideoComment): Promise<VideoComment> {
    const result = await db.insert(schema.videoComments).values(comment).returning();
    return result[0];
  }

  async getVideoComments(videoId: number): Promise<VideoComment[]> {
    return db.select().from(schema.videoComments)
      .where(eq(schema.videoComments.videoId, videoId))
      .orderBy(asc(schema.videoComments.createdAt));
  }

  // Community Thread methods - note: IStorage uses string IDs for these
  async getCommunityThreads(options?: any): Promise<any[]> {
    const { category, limit = 20 } = options || {};
    
    let query = db.select().from(schema.communityThreads);
    
    if (category) {
      query = query.where(eq(schema.communityThreads.category, category)) as any;
    }
    
    return query.orderBy(desc(schema.communityThreads.createdAt)).limit(limit);
  }

  async getCommunityThreadsWithStats(): Promise<any[]> {
    return db.select().from(schema.communityThreads)
      .orderBy(desc(schema.communityThreads.createdAt));
  }

  async getCommunityThreadsByCategory(category: string): Promise<any[]> {
    return db.select().from(schema.communityThreads)
      .where(eq(schema.communityThreads.category, category))
      .orderBy(desc(schema.communityThreads.createdAt));
  }

  async searchCommunityThreads(query: string): Promise<any[]> {
    return db.select().from(schema.communityThreads)
      .where(
        or(
          like(schema.communityThreads.title, `%${query}%`),
          like(schema.communityThreads.content, `%${query}%`)
        )!
      )
      .orderBy(desc(schema.communityThreads.createdAt));
  }

  async getCommunityThread(id: string): Promise<CommunityThread | undefined> {
    const numId = parseInt(id);
    const result = await db.select().from(schema.communityThreads)
      .where(eq(schema.communityThreads.id, numId));
    return result[0];
  }

  async createCommunityThread(thread: InsertCommunityThread): Promise<CommunityThread> {
    const result = await db.insert(schema.communityThreads).values(thread).returning();
    return result[0];
  }

  async updateCommunityThreadActivity(id: string): Promise<void> {
    const numId = parseInt(id);
    await db.update(schema.communityThreads)
      .set({ updatedAt: new Date() })
      .where(eq(schema.communityThreads.id, numId));
  }

  // Community Comment methods
  async getCommunityComments(threadId: string): Promise<CommunityComment[]> {
    const numId = parseInt(threadId);
    return db.select().from(schema.communityComments)
      .where(eq(schema.communityComments.threadId, numId))
      .orderBy(asc(schema.communityComments.createdAt));
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const result = await db.insert(schema.communityComments).values(comment).returning();
    return result[0];
  }

  // Thread Likes methods
  async likeThread(like: InsertThreadLike): Promise<ThreadLike> {
    const result = await db.insert(schema.threadLikes).values(like).returning();
    return result[0];
  }

  async unlikeThread(threadId: string, userId: string): Promise<void> {
    const numThreadId = parseInt(threadId);
    const numUserId = parseInt(userId);
    await db.delete(schema.threadLikes)
      .where(and(
        eq(schema.threadLikes.threadId, numThreadId),
        eq(schema.threadLikes.userId, numUserId)
      ));
  }

  async isThreadLikedByUser(threadId: string, userId: string): Promise<boolean> {
    const numThreadId = parseInt(threadId);
    const numUserId = parseInt(userId);
    const result = await db.select().from(schema.threadLikes)
      .where(and(
        eq(schema.threadLikes.threadId, numThreadId),
        eq(schema.threadLikes.userId, numUserId)
      ));
    return result.length > 0;
  }

  async getThreadLikeCount(threadId: string): Promise<number> {
    const numThreadId = parseInt(threadId);
    const result = await db.select({ count: drizzleCount() })
      .from(schema.threadLikes)
      .where(eq(schema.threadLikes.threadId, numThreadId));
    return result[0]?.count || 0;
  }

  // Thread Follow methods
  async followThread(follow: InsertThreadFollow): Promise<ThreadFollow> {
    const result = await db.insert(schema.threadFollows).values(follow).returning();
    return result[0];
  }

  async unfollowThread(threadId: string, userId: string): Promise<void> {
    const numThreadId = parseInt(threadId);
    const numUserId = parseInt(userId);
    await db.delete(schema.threadFollows)
      .where(and(
        eq(schema.threadFollows.threadId, numThreadId),
        eq(schema.threadFollows.userId, numUserId)
      ));
  }

  async isThreadFollowedByUser(threadId: string, userId: string): Promise<boolean> {
    const numThreadId = parseInt(threadId);
    const numUserId = parseInt(userId);
    const result = await db.select().from(schema.threadFollows)
      .where(and(
        eq(schema.threadFollows.threadId, numThreadId),
        eq(schema.threadFollows.userId, numUserId)
      ));
    return result.length > 0;
  }

  async getFollowedThreadsByUser(userId: string): Promise<any[]> {
    const numUserId = parseInt(userId);
    return db.select()
      .from(schema.threadFollows)
      .where(eq(schema.threadFollows.userId, numUserId));
  }

  // Community Stats methods
  async getCommunityStats(): Promise<{
    totalMembers: number;
    totalDiscussions: number;
    totalPrayers: number;
    categoryStats: { category: string; count: number }[];
  }> {
    const [membersResult, discussionsResult, prayersResult, categoryResult] = await Promise.all([
      db.select({ count: drizzleCount() }).from(schema.users),
      db.select({ count: drizzleCount() }).from(schema.communityThreads),
      db.select({ count: drizzleCount() }).from(schema.communityThreads)
        .where(eq(schema.communityThreads.category, 'Prayer Requests')),
      db.select({
        category: schema.communityThreads.category,
        count: drizzleCount(),
      })
      .from(schema.communityThreads)
      .groupBy(schema.communityThreads.category),
    ]);
    
    return {
      totalMembers: membersResult[0]?.count || 0,
      totalDiscussions: discussionsResult[0]?.count || 0,
      totalPrayers: prayersResult[0]?.count || 0,
      categoryStats: categoryResult as { category: string; count: number }[],
    };
  }

  // Episode Comment methods
  async getEpisodeComments(episodeId: number): Promise<EpisodeComment[]> {
    return db.select().from(schema.episodeComments)
      .where(eq(schema.episodeComments.episodeId, episodeId))
      .orderBy(asc(schema.episodeComments.createdAt));
  }

  async createEpisodeComment(comment: InsertEpisodeComment): Promise<EpisodeComment> {
    const result = await db.insert(schema.episodeComments).values(comment).returning();
    return result[0];
  }

  // Calendar Event methods
  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return db.select().from(schema.calendarEvents)
      .where(
        and(
          sql`${schema.calendarEvents.startTime} >= ${startDate}`,
          sql`${schema.calendarEvents.startTime} <= ${endDate}`
        )
      )
      .orderBy(asc(schema.calendarEvents.startTime));
  }

  async getUpcomingCalendarEvents(limit: number): Promise<CalendarEvent[]> {
    return db.select().from(schema.calendarEvents)
      .where(sql`${schema.calendarEvents.startTime} >= NOW()`)
      .orderBy(asc(schema.calendarEvents.startTime))
      .limit(limit);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const result = await db.insert(schema.calendarEvents).values(event).returning();
    return result[0];
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(schema.calendarEvents)
      .where(eq(schema.calendarEvents.id, id));
    return result[0];
  }

  // Promotional order methods
  async createPromotionalOrder(order: InsertPromotionalOrder): Promise<PromotionalOrder> {
    const result = await db.insert(schema.promotionalOrders).values(order).returning();
    return result[0];
  }

  async getPromotionalOrders(): Promise<PromotionalOrder[]> {
    return db.select().from(schema.promotionalOrders)
      .orderBy(desc(schema.promotionalOrders.createdAt));
  }

  async getPromotionalOrderById(id: number): Promise<PromotionalOrder | undefined> {
    const result = await db.select().from(schema.promotionalOrders)
      .where(eq(schema.promotionalOrders.id, id));
    return result[0];
  }

  async updatePromotionalOrderStatus(id: number, status: string): Promise<PromotionalOrder> {
    const result = await db.update(schema.promotionalOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.promotionalOrders.id, id))
      .returning();
    return result[0];
  }

  // Chat message methods (optional)
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return db.select().from(schema.chatMessages)
      .orderBy(desc(schema.chatMessages.timestamp))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(schema.chatMessages).values(message).returning();
    return result[0];
  }

  // Program reminder methods (optional)
  async getUserReminders(userId: number): Promise<ProgramReminder[]> {
    return db.select().from(schema.programReminders)
      .where(eq(schema.programReminders.userId, userId))
      .orderBy(asc(schema.programReminders.programTime));
  }

  async createProgramReminder(reminder: InsertProgramReminder): Promise<ProgramReminder> {
    const result = await db.insert(schema.programReminders).values(reminder).returning();
    return result[0];
  }

  async deleteReminder(reminderId: number, userId: number): Promise<boolean> {
    const result = await db.delete(schema.programReminders)
      .where(and(
        eq(schema.programReminders.id, reminderId),
        eq(schema.programReminders.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  // Thread and comment deletion methods
  async deleteThread(threadId: number, userId: number): Promise<boolean> {
    const result = await db.delete(schema.communityThreads)
      .where(and(
        eq(schema.communityThreads.id, threadId),
        eq(schema.communityThreads.authorId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const result = await db.delete(schema.communityComments)
      .where(and(
        eq(schema.communityComments.id, commentId),
        eq(schema.communityComments.authorId, userId)
      ))
      .returning();
    return result.length > 0;
  }
}

export const postgresStorage = new PostgresStorage();
