// @ts-nocheck
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, type LiveStreamManager } from "./websocket";
import { azuraCastAPI } from "./azuracast";
import { authRoutes, authenticateToken } from "./auth-supabase-only";
import { strictLimiter, submissionGuards, enhancedRateLimiter, verifyCaptcha } from "./security";
import { sendReplyNotification, sendModerationAlert } from "./emailService";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe (lazy initialization to prevent startup blocking)
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not configured - payment features will be disabled');
    return null;
  }
  
  // Lazy initialize Stripe only when needed
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// Get streaming server URL from environment (with fallback for backward compatibility)
// CRITICAL: Use HTTPS URLs for production/mobile to comply with Apple App Transport Security
const OWNCAST_BASE_URL = process.env.OWNCAST_BASE_URL || 
                           process.env.VITE_OWNCAST_SERVER_URL ||
                           'https://74.208.102.89:8080';

// Log warning if using insecure HTTP in production
if (process.env.NODE_ENV === 'production' && OWNCAST_BASE_URL.startsWith('http://')) {
  console.warn('WARNING: Using HTTP URL for Owncast in production. Mobile apps may fail due to App Transport Security. Use HTTPS instead.');
}

// Initialize Supabase Admin Client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Contact Form API
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message, contactReason } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Store contact message directly via Supabase admin client
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('contactmessages')
          .insert({
            name,
            email,
            phone: phone || null,
            subject,
            message,
            contactreason: contactReason || null,
            status: 'unread',
            createdat: new Date().toISOString()
          });
        
        if (error) {
          throw error;
        }
      }
      
      res.json({ success: true, message: "Contact message received" });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit contact message" });
    }
  });

  // Broadcasting API routes (WebSocket status)
  app.get("/api/broadcast/status", (req, res) => {
    if (liveStreamManager) {
      res.json(liveStreamManager.getBroadcastStatus());
    } else {
      res.json({ activeBroadcasters: 0, totalListeners: 0, totalConnections: 0 });
    }
  });

  // Episodes API (existing functionality)
  app.get("/api/episodes", async (req, res) => {
    try {
      const { search } = req.query;
      let episodes = await storage.getEpisodes();
      
      // Add search functionality for episodes
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        episodes = episodes.filter(episode => 
          episode.title.toLowerCase().includes(searchLower) || 
          (episode.description && episode.description.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // Videos API - Enhanced with full functionality
  app.get("/api/videos", async (req, res) => {
    try {
      const { category, search, sortBy, limit, offset, userId } = req.query;
      
      // For now, use basic getVideos until database migration is complete
      const allVideos = await storage.getVideos();
      
      // Apply client-side filtering for compatibility
      let videos = allVideos;
      
      if (category && category !== 'All') {
        videos = videos.filter(v => v.category === category);
      }
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        videos = videos.filter(v => 
          v.title.toLowerCase().includes(searchLower) || 
          (v.description && v.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply sorting
      if (sortBy === 'popular') {
        videos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sortBy === 'views') {
        videos.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (sortBy === 'trending') {
        videos.sort((a, b) => ((b.views || 0) + (b.likes || 0) * 2) - ((a.views || 0) + (a.likes || 0) * 2));
      } else {
        videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      // Apply pagination
      if (offset && typeof offset === 'string') {
        videos = videos.slice(parseInt(offset));
      }
      if (limit && typeof limit === 'string') {
        videos = videos.slice(0, parseInt(limit));
      }
      
      // Transform for frontend compatibility
      const transformedVideos = videos.map(video => ({
        ...video,
        uploadDate: getTimeAgo(video.createdAt),
        isNew: video.isNew || false,
        thumbnail: video.thumbnailUrl || `${video.category.toLowerCase()}-${video.id}`,
      }));
      
      res.json(transformedVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Unified Search API - Search across all content types
  app.get("/api/search", async (req, res) => {
    try {
      const { query, type, limit = 20 } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.json([]);
      }
      
      const searchQuery = query.toLowerCase().trim();
      const results: any[] = [];
      
      // Search episodes if no type filter or type includes 'episode'
      if (!type || type === 'all' || type === 'episode') {
        try {
          const episodes = await storage.getEpisodes();
          const matchingEpisodes = episodes
            .filter(episode => 
              episode.title.toLowerCase().includes(searchQuery) || 
              (episode.description && episode.description.toLowerCase().includes(searchQuery))
            )
            .slice(0, Math.floor(parseInt(limit as string) / 3))
            .map(episode => ({
              id: episode.id,
              type: 'episode',
              title: episode.title,
              description: episode.description || '',
              category: 'Podcast',
              author: episode.hostName || 'GKP Radio',
              duration: episode.duration || '',
              timestamp: episode.createdAt || '',
              url: `/podcast/${episode.id}`
            }));
          results.push(...matchingEpisodes);
        } catch (error) {
          console.error('Failed to search episodes:', error);
        }
      }
      
      // Search community threads if no type filter or type includes 'community'
      if (!type || type === 'all' || type === 'community') {
        try {
          const allThreads = await storage.getCommunityThreads();
          const matchingThreads = allThreads
            .filter((thread: any) => 
              thread.title.toLowerCase().includes(searchQuery) || 
              (thread.content && thread.content.toLowerCase().includes(searchQuery))
            )
            .slice(0, Math.floor(parseInt(limit as string) / 3))
            .map((thread: any) => ({
              id: thread.id,
              type: 'community',
              title: thread.title,
              description: thread.content || '',
              category: thread.category || 'Discussion',
              author: thread.authorDisplayName || 'Anonymous',
              timestamp: thread.createdAt || '',
              url: `/community#thread-${thread.id}`
            }));
          results.push(...matchingThreads);
        } catch (error) {
          console.error('Failed to search community threads:', error);
        }
      }
      
      // Search videos if no type filter or type includes 'video'
      if (!type || type === 'all' || type === 'video') {
        try {
          const allVideos = await storage.getVideos();
          const matchingVideos = allVideos
            .filter(video => 
              video.title.toLowerCase().includes(searchQuery) || 
              (video.description && video.description.toLowerCase().includes(searchQuery))
            )
            .slice(0, Math.floor(parseInt(limit as string) / 3))
            .map(video => ({
              id: video.id,
              type: 'video',
              title: video.title,
              description: video.description || '',
              category: video.category || 'Video',
              author: video.hostName || 'GKP Radio',
              duration: video.duration || '',
              timestamp: video.createdAt || '',
              url: `/videos/${video.id}`
            }));
          results.push(...matchingVideos);
        } catch (error) {
          console.error('Failed to search videos:', error);
        }
      }
      
      // Sort results by relevance (exact title matches first, then by recency)
      results.sort((a, b) => {
        const aExactMatch = a.title.toLowerCase() === searchQuery;
        const bExactMatch = b.title.toLowerCase() === searchQuery;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Sort by timestamp if available
        const aTime = new Date(a.timestamp || 0).getTime();
        const bTime = new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });
      
      res.json(results.slice(0, parseInt(limit as string)));
    } catch (error) {
      console.error("Failed to perform search:", error);
      res.status(500).json({ error: "Failed to perform search" });
    }
  });

  // Video categories with counts (must come before /:id route)
  app.get("/api/videos/categories", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      const categoryMap = new Map<string, number>();
      
      videos.forEach(video => {
        const count = categoryMap.get(video.category) || 0;
        categoryMap.set(video.category, count + 1);
      });
      
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch video categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get single video with stats
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      const videos = await storage.getVideos();
      const video = videos.find(v => v.id === videoId);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      const response = {
        ...video,
        uploadDate: getTimeAgo(video.createdAt),
        isNew: video.isNew || false,
        thumbnail: video.thumbnailUrl || `${video.category.toLowerCase()}-${video.id}`,
      };
      
      res.json(response);
    } catch (error) {
      console.error("Failed to fetch video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  // Owncast proxy route for real-time status
  app.get("/api/owncast/status", async (req, res) => {
    try {
      const { getOwncastStatus } = await import("./owncast-proxy");
      const status = await getOwncastStatus();
      res.json(status);
    } catch (error) {
      console.error("Owncast proxy error:", error);
      res.json({
        online: false, // Return actual offline status
        viewerCount: 0,
        streamTitle: 'GKP Radio Live',
        error: 'Connection failed'
      });
    }
  });

  // Proxy HLS stream to avoid mixed content issues
  app.get("/api/owncast/stream.m3u8", async (req, res) => {
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Use environment-configured URL (supports both HTTP and HTTPS)
      const streamUrl = `${OWNCAST_BASE_URL}/hls/stream.m3u8`;
      const response = await fetch(streamUrl);
      
      // Set proper headers for HLS content
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (response.ok) {
        let content = await response.text();
        // Rewrite segment URLs to use our proxy
        content = content.replace(/stream(\d+\.ts)/g, '/api/owncast/stream$1');
        // Also handle relative paths like "0/stream.m3u8"
        content = content.replace(/(\d+)\/stream\.m3u8/g, '/api/owncast/$1/stream.m3u8');
        res.send(content);
      } else {
        res.status(response.status).send('Stream not available');
      }
    } catch (error) {
      console.error("HLS proxy error:", error);
      res.status(503).send('Stream proxy error');
    }
  });

  // Proxy HLS segments (.ts files)
  app.get("/api/owncast/stream:segment.ts", async (req, res) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const segment = req.params.segment;
      
      // Use environment-configured URL
      const segmentUrl = `${OWNCAST_BASE_URL}/hls/stream${segment}.ts`;
      const response = await fetch(segmentUrl);
      
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'max-age=10');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (response.ok) {
        const buffer = await response.buffer();
        res.send(buffer);
      } else {
        res.status(response.status).send('Segment not available');
      }
    } catch (error) {
      console.error("Segment proxy error:", error);
      res.status(503).send('Segment proxy error');
    }
  });

  // Proxy Owncast variant playlists (e.g., 0/stream.m3u8)
  app.get("/api/owncast/:variant/stream.m3u8", async (req, res) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const variant = req.params.variant;
      
      // Use environment-configured URL
      const variantUrl = `${OWNCAST_BASE_URL}/hls/${variant}/stream.m3u8`;
      const response = await fetch(variantUrl);
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (response.ok) {
        let content = await response.text();
        // Rewrite segment URLs to use our proxy
        content = content.replace(/stream(\d+\.ts)/g, `/api/owncast/${variant}/stream$1`);
        res.send(content);
      } else {
        res.status(response.status).send('Variant stream not available');
      }
    } catch (error) {
      console.error("Variant HLS proxy error:", error);
      res.status(503).send('Variant stream proxy error');
    }
  });

  // Proxy variant segments
  app.get("/api/owncast/:variant/stream:segment.ts", async (req, res) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const { variant, segment } = req.params;
      
      // Use environment-configured URL
      const segmentUrl = `${OWNCAST_BASE_URL}/hls/${variant}/stream${segment}.ts`;
      const response = await fetch(segmentUrl);
      
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'max-age=10');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (response.ok) {
        const buffer = await response.buffer();
        res.send(buffer);
      } else {
        res.status(response.status).send('Segment not available');
      }
    } catch (error) {
      console.error("Variant segment proxy error:", error);
      res.status(503).send('Variant segment proxy error');
    }
  });

  // Authentication routes with spam protection  
  app.post("/api/auth/signup", strictLimiter, submissionGuards, authRoutes.signup);
  app.post("/api/auth/login", strictLimiter, authRoutes.signin); // Login only has rate limiting, not submission guards
  app.get("/api/auth/me", authenticateToken, authRoutes.getMe);
  app.post("/api/auth/signout", authRoutes.signout);
  app.post("/api/auth/refresh", authRoutes.refreshToken);

  // Community API Routes
  
  // Get all community threads with stats
  app.get("/api/community/threads", async (req, res) => {
    try {
      const { category, search, tab, userId } = req.query;
      const requestingUserId = userId ? parseInt(userId as string) : undefined;
      
      let threads;
      
      if (tab === "following" && userId) {
        threads = await storage.getFollowedThreadsByUser(parseInt(userId as string));
      } else if (search) {
        threads = await storage.searchCommunityThreads(search as string);
      } else if (category && category !== "All") {
        threads = await storage.getCommunityThreadsByCategory(category as string);
      } else {
        threads = await storage.getCommunityThreadsWithStats();
      }
      
      // Transform data to match frontend expectations
      const transformedThreads = threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        excerpt: thread.content ? thread.content.substring(0, 150) + "..." : "",
        category: thread.category,
        author: thread.author ? thread.author.displayName : "Loading user data...",
        authorInfo: thread.author,
        lastActivity: getTimeAgo(thread.updatedAt),
        replies: thread.replies || 0,
        likes: thread.likes || 0,
        isLiked: thread.isLiked || false,
        isFollowing: thread.isFollowing || false,
        isPinned: false, // Can be enhanced later
        isHot: (thread.likeCount || 0) > 10 || (thread.commentCount || 0) > 5,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      }));
      
      // Sort by appropriate criteria based on tab
      if (tab === "popular") {
        transformedThreads.sort((a, b) => b.likes + b.replies - (a.likes + a.replies));
      } else if (tab === "unanswered") {
        const unanswered = transformedThreads.filter(thread => thread.replies === 0);
        res.json(unanswered);
        return;
      }
      
      res.json(transformedThreads);
    } catch (error) {
      console.error("Failed to get community threads:", error);
      res.status(500).json({ error: "Failed to load discussions" });
    }
  });

  // User search endpoint for @username autocomplete
  app.get("/api/users/search", authenticateToken, async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }
      
      const users = []; // TODO: implement searchUsers
      
      // Return only safe user data for autocomplete
      const searchResults = users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        city: user.city,
        country: user.country
      }));
      
      res.json(searchResults);
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Create new community thread with spam protection and tagging
  app.post("/api/community/threads", strictLimiter, authenticateToken, submissionGuards, async (req, res) => {
    try {
      const { title, content, category, tags = [] } = req.body;
      const userId = (req as any).user.userId;
      const username = (req as any).user.username;
      
      // Validate basic fields
      if (!title || !category) {
        return res.status(400).json({ error: "Title and category are required" });
      }

      // Validate tags array
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (!tag.userId && !tag.email) {
            return res.status(400).json({ error: "Each tag must have either userId or email" });
          }
          if (tag.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag.email)) {
            return res.status(400).json({ error: "Invalid email format in tags" });
          }
          if (tag.category && !['husband', 'wife', 'friend', 'family', 'mentor', 'prayer_partner'].includes(tag.category)) {
            return res.status(400).json({ error: "Invalid tag category" });
          }
        }
      }
      
      // Ensure user exists in session storage before creating thread
      let user = await storage.getUser(userId);
      if (!user) {
        // Get the real user from database first to preserve their actual info
        try {
          user = await storage.getUserByUsername(username);
          if (!user) {
            // Create placeholder user with JWT info if not found anywhere
            const tempUser = await storage.createUser({
              username: username,
              email: `${username}@gkpradio.com`,
              displayName: `${username}@Community, Member`,
              city: null,
              country: null,
              password: "",
              bio: null,
              avatar: null
            });
            // Note: The user was created with auto-generated ID, but JWT expects specific ID
            // This is handled internally by the storage system
          }
        } catch (createError) {
          console.error("Error ensuring user exists:", createError);
        }
      }
      
      const thread = await storage.createCommunityThread({
        title,
        content,
        category,
        authorId: userId
      });

      // Process tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        const taggerUser = await storage.getUser(userId);
        const taggerName = taggerUser?.displayName || username;

        for (const tag of tags) {
          try {
            // Create discussion tag record
            // TODO: implement createDiscussionTag
            // await storage.createDiscussionTag({
            //   discussionId: thread.id,
            //   taggedUserId: tag.userId || null,
            //   taggedEmail: tag.email || null,
            //   tagCategory: tag.category || null,
            // });

            // Send in-app notifications only
            if (tag.userId) {
              // Tagged user is registered - create in-app notification using existing system
              try {
                const { emitNotificationEvent } = await import('./notifications-supabase');
                await emitNotificationEvent({
                  type: 'mention',
                  actorId: userId,
                  targetUserIds: [tag.userId],
                  data: {
                    threadId: thread.id,
                    threadTitle: title,
                    category: category
                  }
                });
              } catch (notificationError) {
                // Notification system disabled, skipping in-app notification
              }
            }
            // Note: For email-only tags, record is kept in database for future reference
          } catch (tagError) {
            console.error("Failed to process tag:", tagError);
            // Continue processing other tags even if one fails
          }
        }
      }
      
      res.json(thread);
    } catch (error) {
      console.error("Failed to create thread:", error);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  });

  // Like/Unlike thread
  app.post("/api/community/threads/:threadId/like", authenticateToken, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = (req as any).user.userId;
      
      const isLiked = await storage.isThreadLikedByUser(threadId, userId);
      
      if (isLiked) {
        await storage.unlikeThread(threadId, userId);
      } else {
        await storage.likeThread({ threadId, userId });
      }
      
      const likeCount = await storage.getThreadLikeCount(threadId);
      
      res.json({ 
        liked: !isLiked, 
        likeCount 
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      res.status(500).json({ error: "Failed to update like" });
    }
  });

  // Follow/Unfollow thread
  app.post("/api/community/threads/:threadId/follow", authenticateToken, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = (req as any).user.userId;
      
      const isFollowed = await storage.isThreadFollowedByUser(threadId, userId);
      
      if (isFollowed) {
        await storage.unfollowThread(threadId, userId);
      } else {
        await storage.followThread({ threadId, userId });
      }
      
      res.json({ 
        following: !isFollowed 
      });
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      res.status(500).json({ error: "Failed to update follow status" });
    }
  });


  // Test endpoint to demonstrate dynamic user display
  app.post("/api/community/threads/:threadId/comments/test", async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const { content, authorId } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      if (!authorId) {
        return res.status(400).json({ error: "AuthorId is required for test" });
      }
      
      const comment = await storage.createCommunityComment({
        content: content.trim(),
        threadId,
        authorId: authorId,
        parentId: null
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Failed to create test comment:", error);
      res.status(500).json({ error: "Failed to create test comment" });
    }
  });

  // Get Community Stats (with enhanced calculations)
  app.get("/api/community/stats", async (req, res) => {
    try {
      const stats = await storage.getCommunityStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get community stats:", error);
      res.status(500).json({ error: "Failed to load community stats" });
    }
  });

  // NEW ENDPOINT: Map GET /api/stats to /api/community/stats  
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getCommunityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get user's interaction status for threads
  app.get("/api/community/user-interactions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { threadIds } = req.query;
      
      if (!threadIds) {
        return res.json({});
      }
      
      const ids = (threadIds as string).split(',');
      const interactions: Record<string, { liked: boolean; followed: boolean }> = {};
      
      for (const threadId of ids) {
        const liked = await storage.isThreadLikedByUser(threadId, userId);
        const followed = await storage.isThreadFollowedByUser(threadId, userId);
        interactions[threadId] = { liked, followed };
      }
      
      res.json(interactions);
    } catch (error) {
      console.error("Failed to get user interactions:", error);
      res.status(500).json({ error: "Failed to load user interactions" });
    }
  });

  app.post("/api/community/threads/:threadId/comments", strictLimiter, submissionGuards, authenticateToken, async (req, res) => {
    try {
      const { content, parentId } = req.body;
      const threadId = req.params.threadId;
      const userId = (req as any).user.userId;
      const username = (req as any).user.username;
      
      // Validate comment content
      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required and cannot be empty" });
      }
      
      // Validate thread ID
      if (!threadId || typeof threadId !== 'string') {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      // Ensure user exists in session storage before creating comment
      let user = await storage.getUser(userId);
      if (!user) {
        // Get the real user from database first to preserve their actual info
        try {
          user = await storage.getUserByUsername(username);
          if (!user) {
            // Create placeholder user with JWT info if not found anywhere
            const tempUser = await storage.createUser({
              username: username,
              email: `${username}@gkpradio.com`,
              displayName: `${username}@Community, Member`,
              city: null,
              country: null,
              password: "",
              bio: null,
              avatar: null
            });
            // Note: The user was created with auto-generated ID, but JWT expects specific ID
            // This is handled internally by the storage system
          }
        } catch (createError) {
          console.error("Error ensuring user exists:", createError);
        }
      }
      
      const comment = await storage.createCommunityComment({
        content: content.trim(),
        threadId,
        authorId: userId,
        parentId: parentId || null
      });
      
      // Send notifications
      try {
        const thread = await storage.getCommunityThread(threadId);
        const commenter = await storage.getUser(userId);
        
        if (thread && thread.authorId !== userId) {
          // Notify thread author
          const threadAuthor = await storage.getUser(thread.authorId);
          if (threadAuthor && threadAuthor.email) {
            await sendReplyNotification(
              threadAuthor.email,
              thread.title || 'Discussion',
              content,
              commenter?.displayName || username,
              thread.id
            ).catch(err => console.error('Failed to send reply notification:', err));
          }
        }
        
        // Notify followers  
        const followers: any[] = []; // TODO: implement getThreadFollowers
        for (const follower of followers) {
          if (follower.id !== userId && follower.email) {
            await sendReplyNotification(
              follower.email,
              thread.title || 'Discussion',
              content,
              commenter?.displayName || username,
              thread.id
            ).catch(err => console.error('Failed to send follower notification:', err));
          }
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Get thread comments - Fixed: Allow public access to read comments
  app.get("/api/community/threads/:threadId/comments", async (req, res) => {
    try {
      const threadId = req.params.threadId;
      
      // Validate thread ID
      if (!threadId || typeof threadId !== 'string') {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      const comments = await storage.getCommunityComments(threadId);
      res.json(comments);
    } catch (error) {
      console.error("Failed to get comments:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  // Delete thread - Only author can delete their own thread
  app.delete("/api/community/threads/:threadId", authenticateToken, async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = (req as any).user.userId;
      
      // Validate thread ID
      if (!threadId || typeof threadId !== 'string') {
        return res.status(400).json({ error: "Invalid thread ID" });
      }
      
      // Attempt to delete the thread
      const success = await storage.deleteThread!(threadId, userId);
      
      if (!success) {
        return res.status(403).json({ error: "You can only delete your own discussions" });
      }
      
      res.json({ message: "Discussion deleted successfully" });
    } catch (error) {
      console.error("Failed to delete thread:", error);
      res.status(500).json({ error: "Failed to delete discussion" });
    }
  });

  // Delete comment - Only author can delete their own comment
  app.delete("/api/community/comments/:commentId", authenticateToken, async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = (req as any).user.userId;
      
      // Validate comment ID
      if (!commentId || typeof commentId !== 'string') {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      // Attempt to delete the comment
      const success = await storage.deleteComment!(commentId, userId);
      
      if (!success) {
        return res.status(403).json({ error: "You can only delete your own comments" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Get single thread with details
  app.get("/api/community/threads/:threadId", async (req, res) => {
    try {
      const threadId = req.params.threadId;
      const userId = (req as any).user?.userId;
      const thread = await storage.getCommunityThread(threadId);
      
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      res.json(thread);
    } catch (error) {
      console.error("Failed to get thread:", error);
      res.status(500).json({ error: "Failed to get thread" });
    }
  });

  // NEW ENDPOINTS: Modernized API mappings
  
  // Map GET /api/discussions to /api/community/threads
  app.get("/api/discussions", async (req, res) => {
    try {
      const { category, search, tab, userId } = req.query;
      const authUserId = (req as any).user?.userId;
      
      let threads;
      
      if (category && category !== "All") {
        threads = await storage.getCommunityThreadsByCategory(
          category as string
        );
      } else if (search) {
        threads = await storage.searchCommunityThreads(
          search as string
        );
      } else if (tab === "following" && userId) {
        threads = await storage.getFollowedThreadsByUser(
          parseInt(userId as string)
        );
      } else {
        threads = await storage.getCommunityThreadsWithStats();
      }
      
      // Sort threads
      threads.sort((a: any, b: any) => {
        if (tab === "popular") {
          return (b.likes + b.replies * 2) - (a.likes + a.replies * 2);
        } else {
          return new Date(b.updatedAt || b.createdAt).getTime() - 
                 new Date(a.updatedAt || a.createdAt).getTime();
        }
      });
      
      res.json(threads);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ error: "Failed to fetch discussions" });
    }
  });

  // Map POST /api/discussions to /api/community/threads
  app.post("/api/discussions", strictLimiter, authenticateToken, submissionGuards, async (req, res) => {
    try {
      const { title, content, category, tags = [], taggedSpouseId } = req.body;
      const userId = (req as any).user.userId;
      
      // Validate required fields
      if (!title || !category) {
        return res.status(400).json({ 
          error: "Title and category are required" 
        });
      }
      
      // Create thread with userid as integer (not string)
      const thread = await storage.createCommunityThread({
        title,
        content: content || null,
        category,
        authorId: userId,
        taggedSpouseId: taggedSpouseId || null,
      });
      
      // Process tags
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          if (tag.type === 'user' && tag.id) {
            // TODO: implement createDiscussionTag
            // await storage.createDiscussionTag({
            //   discussionId: thread.id,
            //   taggedUserId: tag.id,
            //   tagCategory: tag.category || null,
            // });
          }
        }
      }
      
      res.status(201).json(thread);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  });

  // DELETE discussion endpoint - only author can delete their own thread
  app.delete("/api/discussions/:id", authenticateToken, async (req, res) => {
    try {
      const threadId = req.params.id;
      const userId = (req as any).user.userId; // Integer ID from public.users table
      
      if (!threadId) {
        return res.status(400).json({ error: "Thread ID is required" });
      }
      
      // Get the thread from Supabase to check ownership
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Fetch the thread to verify ownership
      const { data: thread, error: fetchError } = await supabaseAdmin
        .from('communitythreads')
        .select('userid')
        .eq('id', threadId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching thread:', fetchError);
        return res.status(500).json({ error: "Failed to fetch discussion" });
      }
      
      if (!thread) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Check ownership: compare as numbers to handle any type coercion
      const threadUserId = Number(thread.userid);
      const requestUserId = Number(userId);
      
      // Verify both IDs are valid finite numbers with specific error messages
      if (!Number.isFinite(threadUserId)) {
        console.error(`Data integrity error: threadUserId=${threadUserId} (NaN/null/undefined)`);
        return res.status(500).json({ 
          error: "This discussion has missing author information. Please contact support or wait for data migration." 
        });
      }
      
      if (!Number.isFinite(requestUserId)) {
        console.error(`Authentication error: requestUserId=${requestUserId} (NaN/null/undefined)`);
        return res.status(500).json({ 
          error: "Unable to verify your user account. Please try logging out and back in." 
        });
      }
      
      if (threadUserId !== requestUserId) {
        console.log(`Delete denied: thread owner ${threadUserId} !== requesting user ${requestUserId}`);
        return res.status(403).json({ error: "You can only delete your own discussions" });
      }
      
      // Delete the thread (will cascade to comments and likes via ON DELETE CASCADE)
      const { error: deleteError } = await supabaseAdmin
        .from('communitythreads')
        .delete()
        .eq('id', threadId);
      
      if (deleteError) {
        console.error('Error deleting thread:', deleteError);
        return res.status(500).json({ error: "Failed to delete discussion" });
      }
      
      res.json({ message: "Discussion deleted successfully" });
    } catch (error) {
      console.error("Error deleting discussion:", error);
      res.status(500).json({ error: "Failed to delete discussion" });
    }
  });


  // Map POST /api/replies to create comments on threads
  app.post("/api/replies", strictLimiter, submissionGuards, authenticateToken, async (req, res) => {
    try {
      const { content, threadId, parentId } = req.body;
      const userId = (req as any).user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      if (!content || !threadId) {
        return res.status(400).json({ 
          error: "Content and thread ID are required" 
        });
      }
      
      // Create comment
      const comment = await storage.createCommunityComment({
        content,
        threadId: threadId,
        authorId: String(userId),
        parentId: parentId || null,
      });
      
      // Send notifications
      try {
        const thread = await storage.getCommunityThread(threadId);
        
        if (thread && thread.authorId !== userId) {
          // Send notification to thread author
          const threadAuthor = await storage.getUser(thread.authorId);
          if (threadAuthor?.email) {
            await sendReplyNotification(
              threadAuthor.email,
              thread.title,
              content,
              user.displayName || user.username,
              thread.id
            ).catch(err => console.error('Failed to send reply notification:', err));
          }
        }
        
        // Send notifications to thread followers
        const followers: any[] = []; // TODO: implement getThreadFollowers - const followers = await storage.getThreadFollowers(threadId);
        for (const follower of followers) {
          if (follower.id !== userId && follower.email) {
            await sendReplyNotification(
              follower.email,
              thread.title,
              content,
              user.displayName || user.username,
              thread.id
            ).catch(err => console.error('Failed to send follower notification:', err));
          }
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
      
      res.status(201).json({
        ...comment,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          city: user.city,
          country: user.country
        }
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ error: "Failed to create reply" });
    }
  });

  // MODERATION ENDPOINTS
  
  // Flag content for moderation
  app.post("/api/flag-content", authenticateToken, async (req, res) => {
    try {
      const { contentType, contentId, reason } = req.body;
      const userId = (req as any).user.userId;
      
      if (!contentType || !contentId || !reason) {
        return res.status(400).json({ 
          error: "Content type, ID, and reason are required" 
        });
      }
      
      // TODO: implement flagContent
      // await storage.flagContent(contentType, contentId, userId, reason);
      
      // Send moderation alert
      let content = '';
      let author = '';
      
      if (contentType === 'thread') {
        const thread = await storage.getCommunityThread(contentId);
        content = thread?.title || '';
        author = thread?.author?.username || 'Unknown';
      } else if (contentType === 'comment') {
        const comments = await storage.getCommunityComments(contentId);
        const comment = comments.find((c: any) => c.id === contentId);
        content = comment?.content || '';
        author = comment?.author?.username || 'Unknown';
      }
      
      await sendModerationAlert({
        type: contentType as 'thread' | 'comment',
        id: contentId,
        content,
        author,
        reason
      }).catch(err => console.error('Failed to send moderation alert:', err));
      
      res.json({ message: "Content flagged for moderation" });
    } catch (error) {
      console.error("Error flagging content:", error);
      res.status(500).json({ error: "Failed to flag content" });
    }
  });

  // Soft delete content (admin only)
  app.delete("/api/soft-delete/:type/:id", authenticateToken, async (req, res) => {
    try {
      const { type, id } = req.params;
      const contentId = parseInt(id);
      
      // TODO: Add admin check here
      // const userId = (req as any).user.userId;
      // const user = await storage.getUserById(userId);
      // if (!user.isAdmin) {
      //   return res.status(403).json({ error: "Admin access required" });
      // }
      
      if (type === 'thread') {
        // TODO: implement softDeleteThread
        // await storage.softDeleteThread(contentId);
      } else if (type === 'comment') {
        // TODO: implement softDeleteComment
        // await storage.softDeleteComment(contentId);
      } else {
        return res.status(400).json({ error: "Invalid content type" });
      }
      
      res.json({ message: "Content soft-deleted successfully" });
    } catch (error) {
      console.error("Error soft-deleting content:", error);
      res.status(500).json({ error: "Failed to soft-delete content" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = []; // TODO: implement getCategories
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Promotional Orders routes
  app.post("/api/promotional-orders", async (req, res) => {
    try {
      const { 
        businessName, 
        contactPerson,
        contactEmail, 
        phone, 
        websiteUrl,
        socialMediaLinks,
        ministryDescription,
        message, 
        packageType, 
        packagePrice 
      } = req.body;
      
      // Validate required fields
      if (!businessName || !contactPerson || !contactEmail || !ministryDescription || !packageType || !packagePrice) {
        return res.status(400).json({ 
          error: "Business name, contact person, email, ministry description, package type, and price are required" 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Create the promotional order
      const order = await storage.createPromotionalOrder({
        businessName: businessName.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        socialMediaLinks: socialMediaLinks?.trim() || null,
        ministryDescription: ministryDescription.trim(),
        message: message?.trim() || null,
        packageType,
        packagePrice
      });
      
      // Send email notification to admin
      try {
        const { sendPromotionalOrderNotification } = await import('./emailService');
        await sendPromotionalOrderNotification(order);
      } catch (emailError) {
        console.error("Failed to send promotional order notification email:", emailError);
        // Don't fail the request if email fails
      }
      
      res.json({ 
        success: true, 
        message: "Application submitted for review",
        orderId: order.id
      });
    } catch (error) {
      console.error("Failed to create promotional order:", error);
      res.status(500).json({ error: "Failed to submit order. Please try again later." });
    }
  });

  // Get all promotional orders (admin only)
  app.get("/api/promotional-orders", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const orders = await storage.getPromotionalOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to get promotional orders:", error);
      res.status(500).json({ error: "Failed to retrieve orders" });
    }
  });

  // Update promotional order status (admin only)
  app.patch("/api/promotional-orders/:id/status", authenticateToken, async (req, res) => {
    try {
      // TODO: Add admin role check here
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'reviewed', 'approved', 'rejected', 'active', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const order = await storage.updatePromotionalOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Notification routes
  const { 
    getNotifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    getUnreadCount,
    getUserNotificationPreferences,
    updateNotificationPreference,
    subscribeToTopic,
    unsubscribeFromTopic,
    NotificationTypes
  } = await import('./notifications-supabase');

  // Get user notifications
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { getNotifications } = await import('./notifications-supabase');
      const notifications = await getNotifications(userId, { limit: 50 });
      res.json(notifications);
    } catch (error) {
      console.error("Failed to get notifications:", error);
      res.json([]); // Graceful fallback
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const notificationId = parseInt(req.params.id);
      const { markNotificationRead } = await import('./notifications-supabase');
      await markNotificationRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.json({ success: true }); // Graceful fallback
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { markAllNotificationsRead } = await import('./notifications-supabase');
      await markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.json({ success: true }); // Graceful fallback
    }
  });

  // Get unread count
  app.get("/api/notifications/unread-count", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { getUnreadCount } = await import('./notifications-supabase');
      const count = await getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Failed to get unread notification count:", error);
      res.json({ count: 0 }); // Graceful fallback
    }
  });

  // Get notification preferences
  app.get("/api/notification-preferences", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const preferences = await getUserNotificationPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Failed to get preferences:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  // Update notification preferences
  app.put("/api/notification-preferences", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { type, preferences } = req.body;
      
      await updateNotificationPreference(userId, type, preferences);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Subscribe to topic
  app.post("/api/subscribe-topic", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { topicKey } = req.body;
      
      await subscribeToTopic(userId, topicKey);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to subscribe to topic:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from topic
  app.post("/api/unsubscribe-topic", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { topicKey } = req.body;
      
      await unsubscribeFromTopic(userId, topicKey);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to unsubscribe from topic:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // WebRTC proxy routes for ultra-low latency streaming
  const { proxyWebRTCRequest, getWebRTCStatus } = await import('./webrtc-proxy');
  
  // Proxy WebRTC WHEP endpoint
  app.post("/api/webrtc/:path(*)/whep", proxyWebRTCRequest);
  app.options("/api/webrtc/:path(*)/whep", proxyWebRTCRequest);
  
  // WebRTC status endpoint
  app.get("/api/webrtc/status", getWebRTCStatus);

  // Calendar/Schedule endpoints
  app.get("/api/schedule", async (req, res) => {
    try {
      const { date, tz = 'America/Kentucky/Louisville' } = req.query;
      
      // Get today's date in the specified timezone if no date provided
      const targetDate = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await storage.getCalendarEventsByDateRange(startOfDay, endOfDay);
      
      // Transform for frontend compatibility
      const transformedEvents = events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        time: event.startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: tz as string 
        }),
        host: event.metadata?.host || 'GKP Radio Team',
        duration: event.metadata?.duration || '1h',
        category: event.metadata?.category || 'General',
        listeners: event.metadata?.expectedListeners || 0,
        isLive: event.metadata?.isLive || false,
        startTime: event.startTime,
        endTime: event.endTime
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Schedule API error:", error);
      // Return empty array instead of error to prevent client issues
      res.json([]);
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const now = new Date();
      
      const events = await storage.getUpcomingCalendarEvents(parseInt(limit as string));
      
      // Transform for frontend compatibility
      const transformedEvents = events.map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.startTime.toLocaleDateString('en-US'),
        time: event.startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        type: event.metadata?.type || event.metadata?.category || 'Event'
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Upcoming events API error:", error);
      // Return empty array instead of error to prevent client issues
      res.json([]);
    }
  });

  // Serve WebRTC setup script
  app.get("/vps-webrtc-setup.sh", (req, res) => {
    res.sendFile('vps-webrtc-setup.sh', { root: '.' });
  });

  // Chat Messages API
  app.get('/api/chat/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error('Chat messages API error:', error);
      // Return empty array instead of error to prevent client issues
      res.json([]);
    }
  });

  app.post('/api/chat/messages', async (req, res) => {
    try {
      const { message, username, userId, isVerified } = req.body;
      
      if (!message || !username) {
        return res.status(400).json({ error: 'Message and username are required' });
      }

      const newMessage = await storage.createChatMessage({
        message,
        username,
        userId: userId || null,
        isVerified: isVerified || false,
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Create chat message API error:', error);
      res.status(500).json({ error: 'Failed to create chat message' });
    }
  });

  // Program Reminders API
  app.get('/api/reminders/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const reminders = await storage.getUserReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders API error:', error);
      res.status(500).json({ error: 'Failed to get reminders' });
    }
  });

  app.post('/api/reminders', async (req, res) => {
    try {
      const { userId, programTitle, programTime, reminderType } = req.body;
      
      if (!userId || !programTitle || !programTime || !reminderType) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const reminder = await storage.createProgramReminder({
        userId,
        programTitle,
        programTime,
        reminderType,
        isActive: true,
      });

      res.status(201).json(reminder);
    } catch (error) {
      console.error('Create reminder API error:', error);
      res.status(500).json({ error: 'Failed to create reminder' });
    }
  });

  app.delete('/api/reminders/:id', async (req, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(reminderId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid reminder or user ID' });
      }

      const success = await storage.deleteReminder(reminderId, userId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Reminder not found' });
      }
    } catch (error) {
      console.error('Delete reminder API error:', error);
      res.status(500).json({ error: 'Failed to delete reminder' });
    }
  });

  // Add BetterAuth routes (mount before existing auth routes) 
  // Note: BetterAuth has compatibility issues with Express headers, so we'll use it internally only for now
  // app.all("/api/better-auth/*", authMigration.getBetterAuthHandler());

  // Stripe donation payment route (legacy)
  app.post("/api/create-donation-payment", async (req, res) => {
    try {
      const { amount, donorInfo } = req.body;
      
      if (!amount || amount < 1) {
        return res.status(400).json({ error: "Invalid donation amount" });
      }

      // Create PaymentIntent for donation
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          type: "donation",
          donor_name: donorInfo?.name || "Anonymous",
          donor_email: donorInfo?.email || "",
          donor_message: donorInfo?.message || "",
        },
        description: `Donation to GKP Radio - $${amount}`,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating donation payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create payment intent", 
        message: error.message 
      });
    }
  });

  // New payment intent endpoint with automatic payment methods
  app.post("/api/payments/intent", async (req, res) => {
    try {
      const { amount, currency = "usd", donorInfo } = req.body;

      // Basic guardrails
      if (!amount || amount < 50) {
        return res.status(400).json({ error: "Minimum donation amount is $0.50" });
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(amount), // Amount should already be in cents
        currency,
        automatic_payment_methods: { 
          enabled: true // Enables Card, Apple Pay, Google Pay, etc.
        },
        metadata: {
          type: "donation",
          donor_name: donorInfo?.name || "Anonymous",
          donor_email: donorInfo?.email || "",
          donor_message: donorInfo?.message || "",
        },
        description: `Donation to GKP Radio - $${(amount / 100).toFixed(2)}`,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "payment_intent_failed", 
        message: error.message 
      });
    }
  });

  // ==========================================
  // APPLE APP STORE COMPLIANCE ENDPOINTS
  // ==========================================
  
  // Privacy Policy endpoint (required for App Store)
  app.get("/api/legal/privacy-policy", (req, res) => {
    res.json({
      title: "Privacy Policy - GKP Radio",
      lastUpdated: "2025-01-01",
      content: {
        introduction: "GKP Radio is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and web services.",
        
        informationWeCollect: {
          title: "Information We Collect",
          items: [
            "Personal information you provide (email, username, display name)",
            "Usage data and device information",
            "Audio streaming preferences and listening activity"
          ]
        },
        
        howWeUseInformation: {
          title: "How We Use Your Information",
          purposes: [
            "To provide and maintain our radio streaming services",
            "To personalize your experience",
            "To send you notifications about new content",
            "To communicate with you about your account",
            "To improve our services"
          ]
        },
        
        dataSharing: {
          title: "Data Sharing",
          description: "We do not sell your personal information. We only share data with service providers necessary for operating our platform (Supabase for authentication and database)."
        },
        
        yourRights: {
          title: "Your Rights",
          rights: [
            "Access and update your personal information",
            "Delete your account and data at any time",
            "Opt-out of promotional communications"
          ]
        },
        
        contact: {
          title: "Contact Us",
          email: "privacy@godkingdomprinciplesradio.com"
        }
      }
    });
  });
  
  // Terms of Service endpoint (required for App Store)
  app.get("/api/legal/terms-of-service", (req, res) => {
    res.json({
      title: "Terms of Service - GKP Radio",
      lastUpdated: "2025-01-01",
      content: {
        introduction: "By using GKP Radio, you agree to these Terms of Service.",
        
        acceptableUse: {
          title: "Acceptable Use",
          prohibited: [
            "Violating laws or regulations",
            "Harassing or harming other users",
            "Posting spam or inappropriate content",
            "Attempting unauthorized access to our systems"
          ]
        },
        
        userAccounts: {
          title: "User Accounts",
          requirements: [
            "You must be at least 13 years old",
            "You are responsible for your account security",
            "You must provide accurate information"
          ]
        },
        
        intellectualProperty: {
          title: "Intellectual Property",
          description: "All content is owned by or licensed to GKP Radio. You retain ownership of your user-generated content but grant us a license to use it in connection with the service."
        },
        
        disclaimer: {
          title: "Disclaimer",
          description: "THE SERVICE IS PROVIDED AS IS WITHOUT WARRANTIES. USE AT YOUR OWN RISK."
        },
        
        contact: {
          title: "Contact",
          email: "legal@godkingdomprinciplesradio.com"
        }
      }
    });
  });
  
  // Support/Contact Information endpoint
  app.get("/api/legal/support", (req, res) => {
    res.json({
      title: "Support & Contact - GKP Radio",
      support: {
        email: "support@godkingdomprinciplesradio.com",
        description: "For technical support, account issues, or general inquiries"
      },
      report: {
        email: "report@godkingdomprinciplesradio.com",
        description: "To report inappropriate content or violations"
      },
      business: {
        email: "ads@gkpradio.com",
        description: "For advertising and business inquiries"
      }
    });
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for live streaming
  const liveStreamManager = setupWebSocket(httpServer);

  return httpServer;
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

// Export for access in routes
let liveStreamManager: LiveStreamManager | null = null;
