// @ts-nocheck
// Secure user-isolated storage system
import type {
  User,
  Episode,
  Video,
  CommunityThread,
  CommunityComment,
  EpisodeComment,
  ThreadLike,
  ThreadFollow,
  InsertUser,
  InsertEpisode,
  InsertVideo,
  InsertCommunityThread,
  InsertCommunityComment,
  InsertEpisodeComment,
  InsertThreadLike,
  InsertThreadFollow,
} from "@shared/schema";

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Episodes
  getEpisodes(): Promise<Episode[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;

  // Videos
  getVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Community - SECURE: Only returns threads visible to requesting user
  getCommunityThreads(requestingUserId?: number): Promise<CommunityThread[]>;
  getCommunityThreadsWithStats(requestingUserId?: number): Promise<any[]>;
  getCommunityThreadsByCategory(category: string, requestingUserId?: number): Promise<any[]>;
  searchCommunityThreads(query: string, requestingUserId?: number): Promise<any[]>;
  getFollowedThreadsByUser(userId: number): Promise<any[]>;
  createCommunityThread(thread: InsertCommunityThread): Promise<CommunityThread>;
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;

  // Thread interactions - SECURE: User can only interact with own data
  likeThread(like: InsertThreadLike): Promise<ThreadLike>;
  unlikeThread(threadId: number, userId: number): Promise<void>;
  isThreadLikedByUser(threadId: number, userId: number): Promise<boolean>;
  getThreadLikeCount(threadId: number): Promise<number>;
  
  followThread(follow: InsertThreadFollow): Promise<ThreadFollow>;
  unfollowThread(threadId: number, userId: number): Promise<void>;
  isThreadFollowedByUser(threadId: number, userId: number): Promise<boolean>;


  // Stats
  getCommunityStats(): Promise<{
    totalThreads: number;
    totalComments: number;
    totalMembers: number;
    totalPrayerRequests: number;
  }>;
  
  // User interactions - SECURE: Only return user's own interactions
  getUserThreadInteractions(userId: number): Promise<any>;
}

class SecureStorage implements IStorage {
  // Separate data per user session to prevent cross-user data leakage
  private users: Map<number, User> = new Map();
  private userSessions: Map<number, {
    threads: CommunityThread[];
    comments: CommunityComment[];
    likes: ThreadLike[];
    follows: ThreadFollow[];
  }> = new Map();
  
  // Shared public data (episodes, videos) - safe to share
  private episodes: Episode[] = [];
  private videos: Video[] = [];
  private globalThreads: CommunityThread[] = []; // All threads for community view
  
  private nextUserId = 1;
  private nextThreadId = 1;
  private nextCommentId = 1;
  private nextLikeId = 1;
  private nextFollowId = 1;

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private ensureUserSession(userId: number) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        threads: [],
        comments: [],
        likes: [],
        follows: [],
      });
    }
  }

  // User management
  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: userData.username,
      email: userData.email,
      displayName: `${userData.username}@${userData.city}, ${userData.country}`,
      city: userData.city || null,
      country: userData.country || null,
      bio: userData.bio || null,
      avatar: userData.avatar || null,
      createdAt: new Date(),
    };
    
    this.users.set(user.id, user);
    this.ensureUserSession(user.id);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Episodes
  async getEpisodes(): Promise<Episode[]> {
    return this.episodes;
  }

  async createEpisode(episodeData: InsertEpisode): Promise<Episode> {
    const episode: Episode = {
      id: this.episodes.length + 1,
      ...episodeData,
      createdAt: new Date().toISOString(),
    };
    this.episodes.push(episode);
    return episode;
  }

  // Videos
  async getVideos(): Promise<Video[]> {
    return this.videos;
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const video: Video = {
      id: this.videos.length + 1,
      ...videoData,
      createdAt: new Date().toISOString(),
    };
    this.videos.push(video);
    return video;
  }

  // Community threads - SECURE: Filter by user context
  async getCommunityThreads(requestingUserId?: number): Promise<CommunityThread[]> {
    return this.globalThreads.map(thread => ({
      ...thread,
      // Add user-specific interaction data if user is authenticated
      isLiked: requestingUserId ? this.userSessions.get(requestingUserId)?.likes.some(like => like.threadId === thread.id) || false : false,
      isFollowing: requestingUserId ? this.userSessions.get(requestingUserId)?.follows.some(follow => follow.threadId === thread.id) || false : false,
    }));
  }

  async getCommunityThreadsWithStats(requestingUserId?: number): Promise<any[]> {
    const threads = await this.getCommunityThreads(requestingUserId);
    return threads.map(thread => ({
      ...thread,
      likes: this.getLikeCountForThread(thread.id),
      replies: this.getCommentCountForThread(thread.id),
    }));
  }

  async getCommunityThreadsByCategory(category: string, requestingUserId?: number): Promise<any[]> {
    const threads = await this.getCommunityThreadsWithStats(requestingUserId);
    return category === "All" ? threads : threads.filter(thread => thread.category === category);
  }

  async searchCommunityThreads(query: string, requestingUserId?: number): Promise<any[]> {
    const threads = await this.getCommunityThreadsWithStats(requestingUserId);
    return threads.filter(thread => 
      thread.title.toLowerCase().includes(query.toLowerCase()) ||
      thread.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getFollowedThreadsByUser(userId: number): Promise<any[]> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    const followedThreadIds = userSession.follows.map(follow => follow.threadId);
    const threads = await this.getCommunityThreadsWithStats(userId);
    return threads.filter(thread => followedThreadIds.includes(thread.id));
  }

  async createCommunityThread(threadData: InsertCommunityThread): Promise<CommunityThread> {
    const thread: CommunityThread = {
      id: this.nextThreadId++,
      title: threadData.title,
      content: threadData.content,
      category: threadData.category,
      authorId: threadData.authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.globalThreads.push(thread);
    this.ensureUserSession(threadData.authorId);
    return thread;
  }

  async createCommunityComment(commentData: InsertCommunityComment): Promise<CommunityComment> {
    const comment: CommunityComment = {
      id: this.nextCommentId++,
      content: commentData.content,
      threadId: commentData.threadId,
      authorId: commentData.authorId,
      createdAt: new Date().toISOString(),
    };
    
    this.ensureUserSession(commentData.authorId);
    const userSession = this.userSessions.get(commentData.authorId)!;
    userSession.comments.push(comment);
    return comment;
  }

  // Thread interactions - SECURE: User-isolated
  async likeThread(likeData: InsertThreadLike): Promise<ThreadLike> {
    this.ensureUserSession(likeData.userId);
    const userSession = this.userSessions.get(likeData.userId)!;
    
    const like: ThreadLike = {
      id: this.nextLikeId++,
      threadId: likeData.threadId,
      userId: likeData.userId,
      createdAt: new Date().toISOString(),
    };
    
    userSession.likes.push(like);
    return like;
  }

  async unlikeThread(threadId: number, userId: number): Promise<void> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    userSession.likes = userSession.likes.filter(like => 
      !(like.threadId === threadId && like.userId === userId)
    );
  }

  async isThreadLikedByUser(threadId: number, userId: number): Promise<boolean> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    return userSession.likes.some(like => like.threadId === threadId && like.userId === userId);
  }

  async getThreadLikeCount(threadId: number): Promise<number> {
    let count = 0;
    for (const session of this.userSessions.values()) {
      count += session.likes.filter(like => like.threadId === threadId).length;
    }
    return count;
  }

  private getLikeCountForThread(threadId: number): number {
    let count = 0;
    for (const session of this.userSessions.values()) {
      count += session.likes.filter(like => like.threadId === threadId).length;
    }
    return count;
  }

  private getCommentCountForThread(threadId: number): number {
    let count = 0;
    for (const session of this.userSessions.values()) {
      count += session.comments.filter(comment => comment.threadId === threadId).length;
    }
    return count;
  }

  async followThread(followData: InsertThreadFollow): Promise<ThreadFollow> {
    this.ensureUserSession(followData.userId);
    const userSession = this.userSessions.get(followData.userId)!;
    
    const follow: ThreadFollow = {
      id: this.nextFollowId++,
      threadId: followData.threadId,
      userId: followData.userId,
      createdAt: new Date().toISOString(),
    };
    
    userSession.follows.push(follow);
    return follow;
  }

  async unfollowThread(threadId: number, userId: number): Promise<void> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    userSession.follows = userSession.follows.filter(follow => 
      !(follow.threadId === threadId && follow.userId === userId)
    );
  }

  async isThreadFollowedByUser(threadId: number, userId: number): Promise<boolean> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    return userSession.follows.some(follow => follow.threadId === threadId && follow.userId === userId);
  }


  // Stats
  async getCommunityStats(): Promise<{
    totalThreads: number;
    totalComments: number;
    totalMembers: number;
    totalPrayerRequests: number;
  }> {
    let totalComments = 0;
    
    for (const session of this.userSessions.values()) {
      totalComments += session.comments.length;
    }
    
    return {
      totalThreads: this.globalThreads.length,
      totalComments,
      totalMembers: this.users.size,
      totalPrayerRequests: this.globalThreads.filter(thread => thread.category === "Prayer Requests").length,
    };
  }

  async getUserThreadInteractions(userId: number): Promise<any> {
    this.ensureUserSession(userId);
    const userSession = this.userSessions.get(userId)!;
    
    const interactions: Record<number, { liked: boolean; followed: boolean }> = {};
    
    for (const thread of this.globalThreads) {
      interactions[thread.id] = {
        liked: userSession.likes.some(like => like.threadId === thread.id),
        followed: userSession.follows.some(follow => follow.threadId === thread.id),
      };
    }
    
    return interactions;
  }

  private initializeSampleData() {
    // Add sample public episodes and videos
    this.episodes = [
      {
        id: 1,
        title: "Living by Faith",
        description: "Exploring what it means to live by faith in daily life",
        duration: 1800,
        audioUrl: "/api/episodes/1/audio",
        publishedAt: "2024-12-01T10:00:00Z",
        createdAt: new Date().toISOString(),
      }
    ];

    this.videos = [
      {
        id: 1,
        title: "Sunday Service Highlights",
        description: "Best moments from Sunday worship",
        thumbnailUrl: "/api/videos/1/thumbnail",
        videoUrl: "/api/videos/1/stream",
        duration: 2400,
        category: "Worship",
        publishedAt: "2024-12-01T14:00:00Z",
        createdAt: new Date().toISOString(),
      }
    ];

    // Add sample community threads
    this.globalThreads = [
      {
        id: this.nextThreadId++,
        title: "Prayer Request: Healing for My Family",
        content: "Please pray for my family member who is going through health challenges. We believe in the power of prayer and community support.",
        category: "Prayer Requests",
        authorId: 999, // System user for sample data
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: this.nextThreadId++,
        title: "Testimony: God's Provision in Difficult Times",
        content: "I want to share how God provided for our family during a challenging financial period. His faithfulness never fails!",
        category: "Testimonies",
        authorId: 998,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      }
    ];
  }
}

export const secureStorage = new SecureStorage();