import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ca328713/health", (c) => {
  return c.json({ status: "ok" });
});

// === AUTH ROUTES ===

// Sign up endpoint
app.post("/make-server-ca328713/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Error during signup:", error);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

// Initialize default data if not exists
async function initializeData() {
  const stats = await kv.get("stats");
  if (!stats) {
    await kv.set("stats", {
      members: "2.5K",
      messages: "8.2K",
      prayers: "45K",
    });
  }

  const featuredContent = await kv.get("featured-content");
  if (!featuredContent) {
    await kv.set("featured-content", [
      {
        id: 1,
        title: "Kingdom Principles: Understanding Your Purpose",
        speaker: "Pastor James Williams",
        category: "Teaching",
        duration: "45 min",
        image: "https://images.unsplash.com/photo-1629143949694-606987575b07?w=1080",
        likes: 245,
        comments: 32,
      },
      {
        id: 2,
        title: "Financial Freedom Through Faith",
        speaker: "Dr. Sarah Johnson",
        category: "Finance",
        duration: "38 min",
        image: "https://images.unsplash.com/photo-1612350275854-f96a246cfc2a?w=1080",
        likes: 189,
        comments: 24,
      },
    ]);
  }

  const discussions = await kv.get("discussions");
  if (!discussions) {
    await kv.set("discussions", [
      {
        id: 1,
        author: "Sarah Johnson",
        avatar: "SJ",
        category: "Prayer Requests",
        title: "Please pray for my family during this difficult time",
        excerpt: "My father is in the hospital and we need your prayers for healing...",
        time: "5 min ago",
        replies: 23,
        likes: 45,
        trending: true,
      },
      {
        id: 2,
        author: "Michael Brown",
        avatar: "MB",
        category: "Testimonies",
        title: "God provided a job after 6 months of searching!",
        excerpt: "I want to testify about God's faithfulness. After being unemployed...",
        time: "1 hour ago",
        replies: 18,
        likes: 67,
        trending: true,
      },
    ]);
  }

  const podcasts = await kv.get("podcasts");
  if (!podcasts) {
    await kv.set("podcasts", [
      {
        id: 1,
        title: "Walking in Faith: Understanding God's Timing",
        series: "Kingdom Principles",
        speaker: "Pastor James Williams",
        duration: "45:32",
        date: "Oct 18, 2025",
        plays: "2.3K",
        trending: true,
      },
      {
        id: 2,
        title: "Building a Strong Prayer Life",
        series: "Kingdom Principles",
        speaker: "Pastor James Williams",
        duration: "38:15",
        date: "Oct 15, 2025",
        plays: "1.8K",
        trending: false,
      },
    ]);
  }

  const videos = await kv.get("videos");
  if (!videos) {
    await kv.set("videos", [
      {
        id: 1,
        title: "Sunday Service - Walking in Victory",
        thumbnail: "https://images.unsplash.com/photo-1629143949694-606987575b07?w=1080",
        duration: "1:45:20",
        views: "3.2K",
        likes: 245,
        category: "Service",
        date: "Oct 19, 2025",
        live: false,
      },
    ]);
  }

  const liveChat = await kv.get("live-chat");
  if (!liveChat) {
    await kv.set("live-chat", [
      { user: "Sarah J.", message: "Amen! This message is so powerful 🙏", time: "Just now" },
      { user: "Michael B.", message: "Praying with you all from Texas!", time: "1 min ago" },
      { user: "Grace W.", message: "God bless you Pastor!", time: "2 min ago" },
    ]);
  }
}

// Initialize data on server start
initializeData().catch(console.error);

// === HOME ROUTES ===

// Get community stats
app.get("/make-server-ca328713/stats", async (c) => {
  try {
    const stats = await kv.get("stats");
    return c.json(stats || { members: "2.5K", messages: "8.2K", prayers: "45K" });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Get featured content
app.get("/make-server-ca328713/featured-content", async (c) => {
  try {
    const content = await kv.get("featured-content");
    return c.json(content || []);
  } catch (error) {
    console.error("Error fetching featured content:", error);
    return c.json({ error: "Failed to fetch featured content" }, 500);
  }
});

// Like content
app.post("/make-server-ca328713/content/:id/like", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const content = await kv.get("featured-content");
    
    if (content) {
      const updated = content.map((item: any) => 
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      );
      await kv.set("featured-content", updated);
      return c.json({ success: true, likes: updated.find((i: any) => i.id === id)?.likes });
    }
    
    return c.json({ error: "Content not found" }, 404);
  } catch (error) {
    console.error("Error liking content:", error);
    return c.json({ error: "Failed to like content" }, 500);
  }
});

// === COMMUNITY ROUTES ===

// Get discussions
app.get("/make-server-ca328713/discussions", async (c) => {
  try {
    const discussions = await kv.get("discussions");
    return c.json(discussions || []);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return c.json({ error: "Failed to fetch discussions" }, 500);
  }
});

// Create discussion
app.post("/make-server-ca328713/discussions", async (c) => {
  try {
    const body = await c.req.json();
    const discussions = await kv.get("discussions") || [];
    
    const newDiscussion = {
      id: Date.now(),
      author: body.author || "Anonymous",
      avatar: body.avatar || "AN",
      category: body.category,
      title: body.title,
      excerpt: body.excerpt,
      time: "Just now",
      replies: 0,
      likes: 0,
      trending: false,
    };
    
    discussions.unshift(newDiscussion);
    await kv.set("discussions", discussions);
    
    return c.json(newDiscussion);
  } catch (error) {
    console.error("Error creating discussion:", error);
    return c.json({ error: "Failed to create discussion" }, 500);
  }
});

// Like discussion
app.post("/make-server-ca328713/discussions/:id/like", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const discussions = await kv.get("discussions");
    
    if (discussions) {
      const updated = discussions.map((item: any) => 
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      );
      await kv.set("discussions", updated);
      return c.json({ success: true, likes: updated.find((i: any) => i.id === id)?.likes });
    }
    
    return c.json({ error: "Discussion not found" }, 404);
  } catch (error) {
    console.error("Error liking discussion:", error);
    return c.json({ error: "Failed to like discussion" }, 500);
  }
});

// === PODCAST ROUTES ===

// Get podcasts
app.get("/make-server-ca328713/podcasts", async (c) => {
  try {
    const podcasts = await kv.get("podcasts");
    return c.json(podcasts || []);
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return c.json({ error: "Failed to fetch podcasts" }, 500);
  }
});

// Increment podcast plays
app.post("/make-server-ca328713/podcasts/:id/play", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const podcasts = await kv.get("podcasts");
    
    if (podcasts) {
      const updated = podcasts.map((item: any) => {
        if (item.id === id) {
          const plays = parseFloat(item.plays.replace('K', '')) + 0.001;
          return { ...item, plays: `${plays.toFixed(1)}K` };
        }
        return item;
      });
      await kv.set("podcasts", updated);
      return c.json({ success: true });
    }
    
    return c.json({ error: "Podcast not found" }, 404);
  } catch (error) {
    console.error("Error incrementing plays:", error);
    return c.json({ error: "Failed to increment plays" }, 500);
  }
});

// === VIDEO ROUTES ===

// Get videos
app.get("/make-server-ca328713/videos", async (c) => {
  try {
    const videos = await kv.get("videos");
    return c.json(videos || []);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return c.json({ error: "Failed to fetch videos" }, 500);
  }
});

// Like video
app.post("/make-server-ca328713/videos/:id/like", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const videos = await kv.get("videos");
    
    if (videos) {
      const updated = videos.map((item: any) => 
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      );
      await kv.set("videos", updated);
      return c.json({ success: true, likes: updated.find((i: any) => i.id === id)?.likes });
    }
    
    return c.json({ error: "Video not found" }, 404);
  } catch (error) {
    console.error("Error liking video:", error);
    return c.json({ error: "Failed to like video" }, 500);
  }
});

// === LIVE ROUTES ===

// Get live chat
app.get("/make-server-ca328713/live-chat", async (c) => {
  try {
    const chat = await kv.get("live-chat");
    return c.json(chat || []);
  } catch (error) {
    console.error("Error fetching live chat:", error);
    return c.json({ error: "Failed to fetch live chat" }, 500);
  }
});

// Post live chat message
app.post("/make-server-ca328713/live-chat", async (c) => {
  try {
    const body = await c.req.json();
    const chat = await kv.get("live-chat") || [];
    
    const newMessage = {
      user: body.user || "Anonymous",
      message: body.message,
      time: "Just now",
    };
    
    chat.unshift(newMessage);
    // Keep only last 50 messages
    if (chat.length > 50) {
      chat.pop();
    }
    
    await kv.set("live-chat", chat);
    return c.json(newMessage);
  } catch (error) {
    console.error("Error posting chat message:", error);
    return c.json({ error: "Failed to post message" }, 500);
  }
});

// Get live schedule
app.get("/make-server-ca328713/schedule", async (c) => {
  try {
    const schedule = await kv.get("schedule");
    if (!schedule) {
      const defaultSchedule = [
        { time: '6:00 AM', program: 'Morning Devotion', host: 'Pastor Williams' },
        { time: '9:00 AM', program: 'Praise & Worship Hour', host: 'Ministry Team' },
        { time: '12:00 PM', program: 'Midday Prayer', host: 'Elder Thompson' },
        { time: '3:00 PM', program: 'Youth Voices', host: 'Youth Leaders' },
        { time: '6:00 PM', program: 'Evening Service', host: 'Pastor Williams' },
        { time: '9:00 PM', program: 'Night Prayer Watch', host: 'Prayer Team' },
      ];
      await kv.set("schedule", defaultSchedule);
      return c.json(defaultSchedule);
    }
    return c.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return c.json({ error: "Failed to fetch schedule" }, 500);
  }
});

Deno.serve(app.fetch);
