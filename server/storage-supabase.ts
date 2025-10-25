import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  type User, 
  type InsertUser,
  type Episode,
  type InsertEpisode,
  type Video,
  type InsertVideo,
  type CommunityThread,
  type InsertCommunityThread,
  type CommunityComment,
  type InsertCommunityComment,
  type EpisodeComment,
  type InsertEpisodeComment,
  type ThreadLike,
  type InsertThreadLike,
  type ThreadFollow,
  type InsertThreadFollow,
  type VideoLike,
  type InsertVideoLike,
  type VideoComment,
  type InsertVideoComment,
  type VideoPlaylist,
  type InsertVideoPlaylist,
  type VideoPlaylistItem,
  type InsertVideoPlaylistItem,
  type CalendarEvent,
  type InsertCalendarEvent,
  type ChatMessage,
  type InsertChatMessage,
  type ProgramReminder,
  type InsertProgramReminder,
  type PromotionalOrder,
  type InsertPromotionalOrder,
  type Notification,
  type InsertNotification,
  type NotificationPreference,
  type InsertNotificationPreference,
  type NotificationQueue,
  type InsertNotificationQueue,
} from "@shared/schema";
import type { IStorage } from "./storage";

// Initialize Supabase Admin Client for server-side operations (optional)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('Supabase credentials not provided. Some features may not work. Using Drizzle storage instead.');
}

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  // Episode methods
  async getEpisodes(): Promise<Episode[]> {
    const { data, error } = await this.supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Episode[];
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const { data, error } = await this.supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Episode;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const { data, error } = await this.supabase
      .from('episodes')
      .insert(insertEpisode)
      .select()
      .single();
    
    if (error) throw error;
    return data as Episode;
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
    let query = this.supabase.from('videos').select('*');

    // Add category filter
    if (options?.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }

    // Add search filter
    if (options?.search) {
      query = query.or(
        `title.ilike.%${options.search}%,description.ilike.%${options.search}%`
      );
    }

    // Add sorting
    if (options?.sortBy === 'popular') {
      query = query.order('likes', { ascending: false }).order('views', { ascending: false });
    } else if (options?.sortBy === 'trending') {
      // For trending, we can use a combination of views and likes
      // Supabase doesn't support complex expressions in order, so we'll use likes as primary
      query = query.order('likes', { ascending: false });
    } else if (options?.sortBy === 'views') {
      query = query.order('views', { ascending: false });
    } else if (options?.sortBy === 'likes') {
      query = query.order('likes', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Add pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Video[];
  }

  async getVideo(id: number, userId?: number): Promise<Video | undefined> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Video;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const { data, error } = await this.supabase
      .from('videos')
      .insert(insertVideo)
      .select()
      .single();
    
    if (error) throw error;
    return data as Video;
  }

  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video> {
    const { data, error } = await this.supabase
      .from('videos')
      .update(video)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Video;
  }

  async deleteVideo(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async incrementVideoViews(id: number): Promise<void> {
    const { data: video, error: fetchError } = await this.supabase
      .from('videos')
      .select('views')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    const { error } = await this.supabase
      .from('videos')
      .update({ views: (video.views || 0) + 1 })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Video interaction methods
  async likeVideo(videoId: number, userId: number): Promise<void> {
    // Add to video_likes table
    const { error: likeError } = await this.supabase
      .from('video_likes')
      .insert({ videoId, userId });
    
    if (likeError && likeError.code !== '23505') { // Ignore duplicate key error
      throw likeError;
    }

    // Increment likes count on video
    const { data: video, error: fetchError } = await this.supabase
      .from('videos')
      .select('likes')
      .eq('id', videoId)
      .single();
    
    if (fetchError) throw fetchError;

    const { error: updateError } = await this.supabase
      .from('videos')
      .update({ likes: (video.likes || 0) + 1 })
      .eq('id', videoId);
    
    if (updateError) throw updateError;
  }

  async unlikeVideo(videoId: number, userId: number): Promise<void> {
    // Remove from video_likes table
    const { error: unlikeError } = await this.supabase
      .from('video_likes')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', userId);
    
    if (unlikeError) throw unlikeError;

    // Decrement likes count on video
    const { data: video, error: fetchError } = await this.supabase
      .from('videos')
      .select('likes')
      .eq('id', videoId)
      .single();
    
    if (fetchError) throw fetchError;

    const { error: updateError } = await this.supabase
      .from('videos')
      .update({ likes: Math.max((video.likes || 0) - 1, 0) })
      .eq('id', videoId);
    
    if (updateError) throw updateError;
  }

  async isVideoLikedByUser(videoId: number, userId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  async getVideoStats(videoId: number): Promise<{
    views: number;
    likes: number;
    comments: number;
  }> {
    const { data: video, error: videoError } = await this.supabase
      .from('videos')
      .select('views, likes')
      .eq('id', videoId)
      .single();
    
    if (videoError) throw videoError;

    const { count, error: commentError } = await this.supabase
      .from('video_comments')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);
    
    if (commentError) throw commentError;

    return {
      views: video?.views || 0,
      likes: video?.likes || 0,
      comments: count || 0,
    };
  }

  // Video category methods
  async getVideoCategories(): Promise<Array<{ name: string; count: number }>> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('category');
    
    if (error) throw error;

    // Count categories manually
    const categoryCounts = new Map<string, number>();
    for (const video of data) {
      if (video.category) {
        categoryCounts.set(video.category, (categoryCounts.get(video.category) || 0) + 1);
      }
    }

    return Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count }));
  }

  // Video playlist methods
  async createPlaylist(playlist: InsertVideoPlaylist): Promise<VideoPlaylist> {
    const { data, error } = await this.supabase
      .from('video_playlists')
      .insert(playlist)
      .select()
      .single();
    
    if (error) throw error;
    return data as VideoPlaylist;
  }

  async getPlaylists(creatorId?: number): Promise<VideoPlaylist[]> {
    let query = this.supabase
      .from('video_playlists')
      .select('*');
    
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    } else {
      query = query.eq('isPublic', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as VideoPlaylist[];
  }

  async getPlaylist(id: number): Promise<VideoPlaylist | undefined> {
    const { data, error } = await this.supabase
      .from('video_playlists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as VideoPlaylist;
  }

  async addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<void> {
    const { error } = await this.supabase
      .from('video_playlist_items')
      .insert({
        playlistId,
        videoId,
        position,
      });
    
    if (error) throw error;
  }

  async removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void> {
    const { error } = await this.supabase
      .from('video_playlist_items')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId);
    
    if (error) throw error;
  }

  // Video comment methods
  async createVideoComment(comment: InsertVideoComment): Promise<VideoComment> {
    const { data, error } = await this.supabase
      .from('video_comments')
      .insert(comment)
      .select()
      .single();
    
    if (error) throw error;
    return data as VideoComment;
  }

  async getVideoComments(videoId: number): Promise<VideoComment[]> {
    const { data, error } = await this.supabase
      .from('video_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as VideoComment[];
  }

  // Community Thread methods
  async getCommunityThreads(options?: {
    category?: string;
    search?: string;
    sortBy?: string;
  }): Promise<any[]> {
    if (options?.search) {
      return await this.searchCommunityThreads(options.search);
    }
    if (options?.category && options.category !== 'All') {
      return await this.getCommunityThreadsByCategory(options.category);
    }
    return await this.getCommunityThreadsWithStats();
  }

  async getCommunityThreadsWithStats(): Promise<any[]> {
    const { data: threads, error } = await this.supabase
      .from('communitythreads')
      .select('*')
      .order('updatedat', { ascending: false });
    
    if (error) throw error;
    if (!threads) return [];

    // Get unique user IDs
    const userIds = Array.from(new Set(threads.map(t => t.userid).filter(Boolean)));
    
    // Fetch all users in one query
    let usersMap: Record<number, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, username, fullname, city, country')
        .in('id', userIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    // Get stats for each thread
    const threadsWithStats = await Promise.all(
      threads.map(async (thread: any) => {
        const { count: commentCount } = await this.supabase
          .from('communitycomments')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);
        
        const { count: likeCount } = await this.supabase
          .from('threadlikes')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        const user = usersMap[thread.userid];
        
        return {
          ...thread,
          authorId: thread.userid,
          authorUsername: user?.username,
          authorDisplayName: user?.fullname,
          authorCity: user?.city,
          authorCountry: user?.country,
          commentCount: commentCount || 0,
          likeCount: likeCount || 0,
          createdAt: thread.createdat,
          updatedAt: thread.updatedat,
        };
      })
    );

    return threadsWithStats;
  }

  async getCommunityThreadsByCategory(category: string): Promise<any[]> {
    if (category === "All") {
      return await this.getCommunityThreadsWithStats();
    }

    const { data: threads, error } = await this.supabase
      .from('communitythreads')
      .select('*')
      .eq('category', category)
      .order('updatedat', { ascending: false });
    
    if (error) throw error;
    if (!threads) return [];

    // Get unique user IDs
    const userIds = Array.from(new Set(threads.map(t => t.userid).filter(Boolean)));
    
    // Fetch all users in one query
    let usersMap: Record<number, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, username, fullname, city, country')
        .in('id', userIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    // Get stats for each thread
    const threadsWithStats = await Promise.all(
      threads.map(async (thread: any) => {
        const { count: commentCount } = await this.supabase
          .from('communitycomments')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);
        
        const { count: likeCount } = await this.supabase
          .from('threadlikes')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        const user = usersMap[thread.userid];

        return {
          ...thread,
          authorId: thread.userid,
          authorUsername: user?.username,
          authorDisplayName: user?.fullname,
          authorCity: user?.city,
          authorCountry: user?.country,
          commentCount: commentCount || 0,
          likeCount: likeCount || 0,
          createdAt: thread.createdat,
          updatedAt: thread.updatedat,
        };
      })
    );

    return threadsWithStats;
  }

  async searchCommunityThreads(query: string): Promise<any[]> {
    const { data: threads, error } = await this.supabase
      .from('communitythreads')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updatedat', { ascending: false });
    
    if (error) throw error;
    if (!threads) return [];

    // Get unique user IDs
    const userIds = Array.from(new Set(threads.map(t => t.userid).filter(Boolean)));
    
    // Fetch all users in one query
    let usersMap: Record<number, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, username, fullname, city, country')
        .in('id', userIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    // Get stats for each thread
    const threadsWithStats = await Promise.all(
      threads.map(async (thread: any) => {
        const { count: commentCount } = await this.supabase
          .from('communitycomments')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);
        
        const { count: likeCount } = await this.supabase
          .from('threadlikes')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        const user = usersMap[thread.userid];

        return {
          ...thread,
          authorId: thread.userid,
          authorUsername: user?.username,
          authorDisplayName: user?.fullname,
          authorCity: user?.city,
          authorCountry: user?.country,
          commentCount: commentCount || 0,
          likeCount: likeCount || 0,
          createdAt: thread.createdat,
          updatedAt: thread.updatedat,
        };
      })
    );

    return threadsWithStats;
  }

  async getCommunityThread(id: string): Promise<CommunityThread | undefined> {
    const { data, error } = await this.supabase
      .from('communitythreads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    
    // Transform Supabase row to app's expected format
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      authorId: data.userid,
      taggedSpouseId: data.taggedspouseid,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    } as CommunityThread;
  }

  async createCommunityThread(insertThread: InsertCommunityThread): Promise<CommunityThread> {
    // Map from app's camelCase to Supabase's lowercase column names
    const supabaseThread = {
      title: insertThread.title,
      content: insertThread.content,
      category: insertThread.category,
      userid: insertThread.authorId,
      taggedspouseid: insertThread.taggedSpouseId || null,
    };

    const { data, error } = await this.supabase
      .from('communitythreads')
      .insert(supabaseThread)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform Supabase row to app's expected format
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      authorId: data.userid,
      taggedSpouseId: data.taggedspouseid,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    } as CommunityThread;
  }

  async updateCommunityThreadActivity(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('communitythreads')
      .update({ updatedat: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Community Comment methods
  async getCommunityComments(threadId: string): Promise<CommunityComment[]> {
    const { data, error } = await this.supabase
      .from('communitycomments')
      .select('*')
      .eq('threadid', threadId)
      .order('createdat', { ascending: false });
    
    if (error) throw error;
    return data as CommunityComment[];
  }

  async createCommunityComment(insertComment: InsertCommunityComment): Promise<CommunityComment> {
    // Map from app's camelCase to Supabase's lowercase column names
    const supabaseComment = {
      content: insertComment.content,
      threadid: insertComment.threadId,
      userid: insertComment.authorId,
      parentid: insertComment.parentId || null,
    };

    const { data, error } = await this.supabase
      .from('communitycomments')
      .insert(supabaseComment)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update thread activity (cast to string as actual DB uses UUIDs)
    await this.updateCommunityThreadActivity(String(insertComment.threadId));
    
    // Transform back to app format
    return {
      id: data.id,
      content: data.content,
      threadId: data.threadid,
      authorId: data.userid,
      parentId: data.parentid,
      createdAt: data.createdat,
    } as CommunityComment;
  }

  // Thread Likes methods
  async likeThread(like: InsertThreadLike): Promise<ThreadLike> {
    // Map from app's camelCase to Supabase's lowercase column names
    const supabaseLike = {
      threadid: like.threadId,
      userid: like.userId,
    };

    const { data, error } = await this.supabase
      .from('threadlikes')
      .insert(supabaseLike)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to app format
    return {
      id: data.id,
      threadId: data.threadid,
      userId: data.userid,
      createdAt: data.createdat,
    } as ThreadLike;
  }

  async unlikeThread(threadId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('threadlikes')
      .delete()
      .eq('threadid', threadId)
      .eq('userid', userId);
    
    if (error) throw error;
  }

  async isThreadLikedByUser(threadId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('threadlikes')
      .select('*')
      .eq('threadid', threadId)
      .eq('userid', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  async getThreadLikeCount(threadId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('threadlikes')
      .select('*', { count: 'exact', head: true })
      .eq('threadid', threadId);
    
    if (error) throw error;
    return count || 0;
  }

  // Thread Follow methods
  async followThread(follow: InsertThreadFollow): Promise<ThreadFollow> {
    // Map from app's camelCase to Supabase's lowercase column names
    const supabaseFollow = {
      threadid: follow.threadId,
      userid: follow.userId,
    };

    const { data, error } = await this.supabase
      .from('threadfollows')
      .insert(supabaseFollow)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to app format
    return {
      id: data.id,
      threadId: data.threadid,
      userId: data.userid,
      createdAt: data.createdat,
    } as ThreadFollow;
  }

  async unfollowThread(threadId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('threadfollows')
      .delete()
      .eq('threadid', threadId)
      .eq('userid', userId);
    
    if (error) throw error;
  }

  async isThreadFollowedByUser(threadId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('threadfollows')
      .select('*')
      .eq('threadid', threadId)
      .eq('userid', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  async getFollowedThreadsByUser(userId: string): Promise<any[]> {
    const { data: follows, error } = await this.supabase
      .from('threadfollows')
      .select('threadid, createdat')
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    
    if (error) throw error;
    if (!follows || follows.length === 0) return [];

    // Get thread IDs
    const threadIds = follows.map(f => f.threadid);
    
    // Fetch threads
    const { data: threads } = await this.supabase
      .from('communitythreads')
      .select('*')
      .in('id', threadIds);
    
    if (!threads) return [];

    // Get unique user IDs
    const userIds = Array.from(new Set(threads.map(t => t.userid).filter(Boolean)));
    
    // Fetch all users in one query
    let usersMap: Record<number, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, username, fullname, city, country')
        .in('id', userIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    // Get stats for each thread
    const threadsWithStats = await Promise.all(
      threads.map(async (thread: any) => {
        const { count: commentCount } = await this.supabase
          .from('communitycomments')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);
        
        const { count: likeCount } = await this.supabase
          .from('threadlikes')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        const user = usersMap[thread.userid];

        return {
          ...thread,
          authorId: thread.userid,
          authorUsername: user?.username,
          authorDisplayName: user?.fullname,
          authorCity: user?.city,
          authorCountry: user?.country,
          commentCount: commentCount || 0,
          likeCount: likeCount || 0,
          createdAt: thread.createdat,
          updatedAt: thread.updatedat,
        };
      })
    );

    return threadsWithStats.filter(Boolean);
  }

  // Community Stats methods
  async getCommunityStats(): Promise<{
    totalMembers: number;
    totalDiscussions: number;
    totalPrayers: number;
    categoryStats: { category: string; count: number }[];
  }> {
    const { count: memberCount } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: discussionCount } = await this.supabase
      .from('communitythreads')
      .select('*', { count: 'exact', head: true });
    
    const { count: prayerCount } = await this.supabase
      .from('communitythreads')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'Prayer Requests');
    
    // Get category counts
    const { data: threads, error } = await this.supabase
      .from('communitythreads')
      .select('category');
    
    if (error) throw error;

    const categoryCounts = new Map<string, number>();
    for (const thread of threads) {
      if (thread.category) {
        categoryCounts.set(thread.category, (categoryCounts.get(thread.category) || 0) + 1);
      }
    }
    
    const categoryStats = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count }));

    return {
      totalMembers: memberCount || 0,
      totalDiscussions: discussionCount || 0,
      totalPrayers: prayerCount || 0,
      categoryStats,
    };
  }

  // Episode Comment methods
  async getEpisodeComments(episodeId: number): Promise<EpisodeComment[]> {
    const { data, error } = await this.supabase
      .from('episode_comments')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as EpisodeComment[];
  }

  async createEpisodeComment(insertComment: InsertEpisodeComment): Promise<EpisodeComment> {
    const { data, error } = await this.supabase
      .from('episode_comments')
      .insert(insertComment)
      .select()
      .single();
    
    if (error) throw error;
    return data as EpisodeComment;
  }

  // Calendar Event methods
  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .gte('startTime', startDate.toISOString())
      .lte('endTime', endDate.toISOString())
      .order('startTime', { ascending: true });
    
    if (error) throw error;
    return data as CalendarEvent[];
  }

  async getUpcomingCalendarEvents(limit: number): Promise<CalendarEvent[]> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .gt('startTime', new Date().toISOString())
      .order('startTime', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as CalendarEvent[];
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert(insertEvent)
      .select()
      .single();
    
    if (error) throw error;
    return data as CalendarEvent;
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as CalendarEvent;
  }

  // Chat Message methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert(insertMessage)
      .select()
      .single();
    
    if (error) throw error;
    return data as ChatMessage;
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    // Return in ascending order (oldest first)
    return (data as ChatMessage[]).reverse();
  }

  // Program Reminder methods
  async createProgramReminder(insertReminder: InsertProgramReminder): Promise<ProgramReminder> {
    const { data, error } = await this.supabase
      .from('program_reminders')
      .insert(insertReminder)
      .select()
      .single();
    
    if (error) throw error;
    return data as ProgramReminder;
  }

  async getProgramRemindersByUser(userId: number): Promise<ProgramReminder[]> {
    const { data, error } = await this.supabase
      .from('program_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as ProgramReminder[];
  }

  // Alias method for compatibility
  async getUserReminders(userId: number): Promise<ProgramReminder[]> {
    const { data, error } = await this.supabase
      .from('program_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('isActive', true)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as ProgramReminder[];
  }

  async deleteProgramReminder(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('program_reminders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Method to delete reminder with user ID verification
  async deleteReminder(reminderId: number, userId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('program_reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data && data.length > 0;
  }

  async getProgramReminderByDetails(userId: number, programType: string, programName: string): Promise<ProgramReminder | undefined> {
    const { data, error } = await this.supabase
      .from('program_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('programType', programType)
      .eq('programName', programName)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as ProgramReminder;
  }

  // Promotional Order methods
  async createPromotionalOrder(insertOrder: InsertPromotionalOrder): Promise<PromotionalOrder> {
    const { data, error } = await this.supabase
      .from('promotional_orders')
      .insert(insertOrder)
      .select()
      .single();
    
    if (error) throw error;
    return data as PromotionalOrder;
  }

  async getPromotionalOrders(): Promise<PromotionalOrder[]> {
    const { data, error } = await this.supabase
      .from('promotional_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as PromotionalOrder[];
  }

  async getPromotionalOrderById(id: number): Promise<PromotionalOrder | undefined> {
    const { data, error } = await this.supabase
      .from('promotional_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as PromotionalOrder;
  }

  async updatePromotionalOrderStatus(id: number, status: string): Promise<PromotionalOrder> {
    const { data, error } = await this.supabase
      .from('promotional_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as PromotionalOrder;
  }

  // Notification methods
  async getNotificationsByUser(userId: number, options: {
    type?: string;
    since?: Date;
    refId?: number;
  }): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId);
    
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.since) {
      query = query.gt('createdat', options.since.toISOString());
    }
    if (options.refId) {
      query = query.eq('refid', options.refId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  }

  async createNotificationQueueItem(queueItem: InsertNotificationQueue): Promise<NotificationQueue> {
    const { data, error } = await this.supabase
      .from('notification_queue')
      .insert(queueItem)
      .select()
      .single();
    
    // If table doesn't exist, return a mock object instead of throwing
    if (error?.code === 'PGRST205') {
      console.log('notification_queue table not found - skipping queue item creation');
      return { id: 0, ...queueItem } as NotificationQueue;
    }
    if (error) throw error;
    return data as NotificationQueue;
  }

  async getNotificationPreference(userId: number, type: string): Promise<NotificationPreference | undefined> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('userid', userId)
      .eq('type', type)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as NotificationPreference;
  }

  async getNotifications(userId: number, options: {
    cursor?: string;
    type?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId);
    
    if (options.type) {
      query = query.eq('type', options.type);
    }
    if (options.unreadOnly) {
      query = query.is('readat', null);
    }
    if (options.cursor) {
      query = query.gt('id', parseInt(options.cursor));
    }
    
    const { data, error } = await query
      .order('createdat', { ascending: false })
      .limit(options.limit || 20);
    
    if (error) throw error;
    return data as Notification[];
  }

  async markNotificationRead(userId: number, notificationId: number): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ readat: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('userid', userId);
    
    if (error) throw error;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ readat: new Date().toISOString() })
      .eq('userid', userId)
      .is('readat', null);
    
    if (error) throw error;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userid', userId)
      .is('readat', null);
    
    if (error) throw error;
    return count || 0;
  }

  async getUserNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('userid', userId);
    
    if (error) throw error;
    return data as NotificationPreference[];
  }

  async updateNotificationPreference(
    userId: number,
    type: string,
    preferences: Partial<InsertNotificationPreference>
  ): Promise<void> {
    // Try to update existing preference
    const existing = await this.getNotificationPreference(userId, type);
    
    if (existing) {
      const { error } = await this.supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('userId', userId)
        .eq('type', type);
      
      if (error) throw error;
    } else {
      // Create new preference
      const { error } = await this.supabase
        .from('notification_preferences')
        .insert({ userId, type, ...preferences });
      
      if (error) throw error;
    }
  }

  async subscribeToTopic(userId: number, topicKey: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_topic_subscriptions')
      .insert({ userId, topicKey });
    
    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
    return true;
  }

  async unsubscribeFromTopic(userId: number, topicKey: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_topic_subscriptions')
      .delete()
      .eq('userId', userId)
      .eq('topicKey', topicKey);
    
    if (error) throw error;
  }

  async getPendingNotificationQueue(limit: number): Promise<NotificationQueue[]> {
    const { data, error } = await this.supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(limit);
    
    // If table doesn't exist, return empty array instead of throwing
    if (error?.code === 'PGRST205') {
      console.log('notification_queue table not found - skipping queue processing');
      return [];
    }
    if (error) throw error;
    return data as NotificationQueue[];
  }

  async deleteNotificationQueueItem(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('notification_queue')
      .delete()
      .eq('id', id);
    
    // If table doesn't exist, just return
    if (error?.code === 'PGRST205') {
      console.log('notification_queue table not found - skipping deletion');
      return;
    }
    if (error) throw error;
  }

  // Thread deletion method
  async deleteThread(threadId: number, userId: number): Promise<boolean> {
    // First verify the thread belongs to the user
    const { data: thread, error: fetchError } = await this.supabase
      .from('communitythreads')
      .select('authorId')
      .eq('id', threadId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') return false; // Thread not found
      throw fetchError;
    }
    
    if (thread.authorId !== userId) {
      return false; // User doesn't own this thread
    }
    
    // Delete all related data first (cascade delete)
    // Delete comments
    await this.supabase
      .from('communitycomments')
      .delete()
      .eq('threadId', threadId);
    
    // Delete likes
    await this.supabase
      .from('thread_likes')
      .delete()
      .eq('threadId', threadId);
    
    // Delete follows
    await this.supabase
      .from('thread_follows')
      .delete()
      .eq('threadId', threadId);
    
    // Delete discussion tags
    await this.supabase
      .from('discussion_tags')
      .delete()
      .eq('discussionId', threadId);
    
    // Finally delete the thread
    const { error: deleteError } = await this.supabase
      .from('communitythreads')
      .delete()
      .eq('id', threadId);
    
    if (deleteError) throw deleteError;
    return true;
  }

  // Comment deletion method
  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    // First verify the comment belongs to the user
    const { data: comment, error: fetchError } = await this.supabase
      .from('communitycomments')
      .select('authorId')
      .eq('id', commentId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') return false; // Comment not found
      throw fetchError;
    }
    
    if (comment.authorId !== userId) {
      return false; // User doesn't own this comment
    }
    
    // Delete any child comments (replies)
    await this.supabase
      .from('communitycomments')
      .delete()
      .eq('parentId', commentId);
    
    // Delete the comment
    const { error: deleteError } = await this.supabase
      .from('communitycomments')
      .delete()
      .eq('id', commentId);
    
    if (deleteError) throw deleteError;
    return true;
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();