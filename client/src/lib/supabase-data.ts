import { supabase } from './supabase';

// Type definitions - these should match your database schema exactly
interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatar?: string | null;
  city?: string | null;
  country?: string | null;
  emailVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Episode {
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

interface Video {
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

interface CommunityThread {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  tags?: string[] | null;
  viewCount: number;
  replyCount: number;
  lastActivityAt: string | Date;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
  taggedSpouseId?: string | null;
  taggedSpouse?: User;
  likeCount?: number;
  isLiked?: boolean;
}

interface SpouseRelationship {
  id: string;
  userId: string;
  spouseId: string;
  status: 'pending' | 'confirmed';
  confirmedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: User;
  spouse?: User;
}

interface CommunityComment {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: string | Date;
}

interface Sponsor {
  id: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  tier: string;
  isActive: boolean;
  // displayOrder: number; // Not in database
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface CalendarEvent {
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

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  photoUrl?: string | null;
  socialLinks?: any;
  // displayOrder: number; // Not in database
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface VideoComment {
  id: number;
  videoId: number;
  authorId: string;
  content: string;
  parentId?: number | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

interface EpisodeComment {
  id: number;
  episodeId: number;
  authorId: string;
  content: string;
  parentId?: number | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

// Generic error handler
const handleError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(error.message || `Failed to ${operation}`);
};

// ============================================
// SPONSORS - Proof of Concept
// ============================================

export const sponsorsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch sponsors');
    return data;
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) handleError(error, 'fetch sponsor');
    return data;
  },

  async create(sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('sponsors')
      .insert(sponsor)
      .select()
      .single();
    
    if (error) handleError(error, 'create sponsor');
    return data;
  },

  async update(id: number, updates: Partial<Sponsor>) {
    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update sponsor');
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete sponsor');
    return true;
  }
};

// ============================================
// EPISODES
// ============================================

export const episodesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch episodes');
    return data;
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) handleError(error, 'fetch episode');
    return data;
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) handleError(error, 'fetch episode by slug');
    return data;
  },

  async getFeatured() {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('featured', true)
      .order('createdat', { ascending: false })
      .limit(6);
    
    if (error) handleError(error, 'fetch featured episodes');
    return data;
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'search episodes');
    return data;
  }
};

// ============================================
// VIDEOS
// ============================================

export const videosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch videos');
    return data;
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('category', category)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch videos by category');
    return data;
  },

  async getFeatured() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('featured', true)
      .order('createdat', { ascending: false })
      .limit(3);
    
    if (error) handleError(error, 'fetch featured videos');
    return data;
  }
};

// ============================================
// COMMUNITY THREADS
// ============================================

// Helper function to get integer user ID from public.users table
// Auto-creates user if they don't exist
async function getUserIntId(authUser: any): Promise<number | null> {
  if (!authUser?.email) return null;
  
  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', authUser.email)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error fetching user int ID:', fetchError);
    return null;
  }
  
  // If user exists, return their ID
  if (existingUser) {
    return existingUser.id;
  }
  
  // Auto-provision user if they don't exist
  // This handles cases where Supabase Auth user exists but public.users record is missing
  const baseUsername = authUser.user_metadata?.username || authUser.email.split('@')[0];
  
  // Try to create with base username, add random suffix if collision occurs
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: authUser.email,
        username: username,
        fullname: authUser.user_metadata?.fullname || username
      })
      .select('id')
      .single();
    
    if (!createError && newUser) {
      return newUser.id;
    }
    
    // If duplicate username error (23505), try with a suffix
    if (createError?.code === '23505' && createError?.message?.includes('username')) {
      attempts++;
      username = `${baseUsername}_${Math.random().toString(36).substring(2, 8)}`;
      continue;
    }
    
    // If duplicate email error, another request created the user - re-query to get it
    if (createError?.code === '23505' && createError?.message?.includes('email')) {
      const { data: raceUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .maybeSingle();
      
      if (raceUser) {
        return raceUser.id;
      }
    }
    
    // For other errors, log and return null
    console.error('Error auto-provisioning user:', createError);
    return null;
  }
  
  // If all attempts failed, return null
  console.error('Failed to auto-provision user after max attempts');
  return null;
}

// Helper function to transform snake_case to camelCase
function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    
    // Just transform the key, don't modify values
    result[camelKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? toCamelCase(value) : value;
  }
  return result;
}

export const communityService = {
  async getThreads(category?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user ? await getUserIntId(user) : null;

    let query = supabase
      .from('communitythreads')
      .select('*')
      .order('createdat', { ascending: false });
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    
    const { data: threads, error } = await query;
    
    if (error) handleError(error, 'fetch community threads');

    if (!threads) return [];

    // Get unique author IDs and tagged spouse IDs
    const authorIds = threads.map(t => t.userid).filter(Boolean);
    const spouseIds = threads.map(t => t.taggedspouseid).filter(Boolean);
    const allUserIds = Array.from(new Set([...authorIds, ...spouseIds]));

    // Fetch all users in one query
    let usersMap: Record<number, any> = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, fullname, avatarurl, bio')
        .in('id', allUserIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    const threadsWithExtras = await Promise.all(
      threads.map(async (thread) => {
        const { count: likeCount } = await supabase
          .from('threadlikes')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        const { count: replyCount } = await supabase
          .from('communitycomments')
          .select('*', { count: 'exact', head: true })
          .eq('threadid', thread.id);

        let isLiked = false;
        if (userId) {
          const { data: likeData } = await supabase
            .from('threadlikes')
            .select('id')
            .eq('threadid', thread.id)
            .eq('userid', userId)
            .maybeSingle();
          
          isLiked = !!likeData;
        }

        // Ensure dates exist and are valid ISO strings
        const now = new Date().toISOString();
        
        // Try to parse the date, fallback to now if invalid
        const parseDate = (value: any) => {
          if (!value) return now;
          const parsed = new Date(value);
          return isNaN(parsed.getTime()) ? now : parsed.toISOString();
        };
        
        const createdAt = parseDate(thread.createdat || thread.created_at);
        const updatedAt = parseDate(thread.updatedat || thread.updated_at);
        
        const transformed = toCamelCase({
          ...thread,
          author: usersMap[thread.userid] || null,
          taggedspouse: thread.taggedspouseid ? usersMap[thread.taggedspouseid] : null,
          likecount: likeCount || 0,
          replycount: replyCount || 0,
          viewcount: 0,
          isliked: isLiked
        });
        
        // Explicitly set the date fields AFTER transformation to ensure they're correct
        transformed.createdAt = createdAt;
        transformed.updatedAt = updatedAt;
        
        return transformed;
      })
    );

    return threadsWithExtras;
  },

  async getThreadById(id: string) {
    const { data: thread, error } = await supabase
      .from('communitythreads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) handleError(error, 'fetch thread');
    if (!thread) return null;

    // Fetch author and tagged spouse separately
    const userIds = [thread.userid, thread.taggedspouseid].filter(Boolean);
    let usersMap: Record<number, any> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, fullname, avatarurl, bio')
        .in('id', userIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    return toCamelCase({
      ...thread,
      author: usersMap[thread.userid] || null,
      taggedspouse: thread.taggedspouseid ? usersMap[thread.taggedspouseid] : null
    });
  },

  async createThread(thread: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    taggedSpouseId?: string | null;
    renderAt?: number;
    hp?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to create thread');
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch('/api/discussions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(thread),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create thread: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  async getComments(threadId: string) {
    const { data: comments, error } = await supabase
      .from('communitycomments')
      .select('*')
      .eq('threadid', threadId)
      .order('createdat', { ascending: true });
    
    if (error) handleError(error, 'fetch comments');
    if (!comments || comments.length === 0) return [];

    // Get unique author IDs
    const authorIds = Array.from(new Set(comments.map(c => c.userid).filter(Boolean)));
    let usersMap: Record<number, any> = {};
    
    if (authorIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, fullname, avatarurl, bio')
        .in('id', authorIds);
      
      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    return comments.map(comment => toCamelCase({
      ...comment,
      author: usersMap[comment.userid] || null
    }));
  },

  async createComment(threadId: string, content: string, parentId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to comment');

    const userId = await getUserIntId(user);
    if (!userId) {
      throw new Error('Unable to create comment. Please try logging out and back in.');
    }

    const { data, error } = await supabase
      .from('communitycomments')
      .insert({
        threadid: threadId,
        content,
        parentid: parentId || null,
        userid: userId
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create comment');
    
    // Note: Updating reply count would require a database function or separate query
    // For now, the count will be calculated on fetch
    
    return toCamelCase(data);
  },

  async toggleThreadLike(threadId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to like threads');

    const userId = await getUserIntId(user);
    if (!userId) {
      throw new Error('Unable to like thread. Please try logging out and back in.');
    }

    const { data: existingLike } = await supabase
      .from('threadlikes')
      .select('id')
      .eq('threadid', threadId)
      .eq('userid', userId)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('threadlikes')
        .delete()
        .eq('id', existingLike.id);
      
      if (error) handleError(error, 'unlike thread');
      return { isLiked: false };
    } else {
      const { error } = await supabase
        .from('threadlikes')
        .insert({
          threadid: threadId,
          userid: userId
        });
      
      if (error) handleError(error, 'like thread');
      return { isLiked: true };
    }
  },

  async deleteThread(threadId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to delete threads');
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`/api/discussions/${threadId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete thread: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  async deleteComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to delete comments');

    const userId = await getUserIntId(user);
    if (!userId) {
      throw new Error('Unable to delete comment. Please try logging out and back in.');
    }

    const { data: comment } = await supabase
      .from('communitycomments')
      .select('userid')
      .eq('id', commentId)
      .single();

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userid !== userId) {
      throw new Error('You can only delete your own comments');
    }

    const { error } = await supabase
      .from('communitycomments')
      .delete()
      .eq('id', commentId);

    if (error) handleError(error, 'delete comment');
    
    return { success: true };
  }
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsService = {
  async getUserNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userid', user.id)
      .order('createdat', { ascending: false })
      .limit(50);
    
    if (error) handleError(error, 'fetch notifications');
    return data;
  },

  async getUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userid', user.id)
      .eq('read', false);
    
    if (error) handleError(error, 'fetch unread count');
    return count || 0;
  },

  async markAsRead(id: number) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    if (error) handleError(error, 'mark notification as read');
    return true;
  },

  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('userid', user.id)
      .eq('read', false);
    
    if (error) handleError(error, 'mark all as read');
    return true;
  },

  async create(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        userid: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
        emailsent: false,
        pushsent: false
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create notification');
    return data;
  }
};

// ============================================
// CALENDAR EVENTS
// ============================================

export const calendarService = {
  async getUpcomingEvents() {
    const { data, error } = await supabase
      .from('calendarEvents')
      .select('*')
      .gte('startTime', new Date().toISOString())
      .order('startTime', { ascending: true })
      .limit(10);
    
    if (error) handleError(error, 'fetch upcoming events');
    return data;
  },

  async getEventsByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    const { data, error } = await supabase
      .from('calendarEvents')
      .select('*')
      .gte('startTime', startDate)
      .lte('startTime', endDate)
      .order('startTime', { ascending: true });
    
    if (error) handleError(error, 'fetch events by month');
    return data;
  }
};

// ============================================
// TEAM MEMBERS (Connect Page)
// ============================================

export const teamService = {
  async getAll() {
    const { data, error } = await supabase
      .from('teamMembers')
      .select('*')
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch team members');
    return data;
  },

  async getByRole(role: string) {
    const { data, error } = await supabase
      .from('teamMembers')
      .select('*')
      .eq('role', role)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch team members by role');
    return data;
  }
};

// ============================================
// USER PROFILES
// ============================================

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) handleError(error, 'fetch profile');
    return data;
  },

  async updateProfile(userId: string, updates: {
    bio?: string;
    avatar?: string;
    city?: string;
    country?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) handleError(error, 'update profile');
    return data;
  },

  async getUserThreads(userId: string | number) {
    const { data, error } = await supabase
      .from('communitythreads')
      .select(`
        *,
        author:users!communitythreads_userid_fkey(
          id,
          username,
          fullname,
          avatarurl,
          bio
        )
      `)
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch user threads');
    return data || [];
  },

  async getUserComments(userId: string | number) {
    const { data, error } = await supabase
      .from('communitycomments')
      .select(`
        *,
        thread:communitythreads!communitycomments_threadid_fkey(
          id,
          title,
          category
        ),
        author:users!communitycomments_userid_fkey(
          id,
          username,
          fullname,
          avatarurl
        )
      `)
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch user comments');
    return data || [];
  },

  async getUserPrayerActivity(userId: string | number) {
    const { data, error } = await supabase
      .from('communitythreads')
      .select(`
        *,
        author:users!communitythreads_userid_fkey(
          id,
          username,
          fullname,
          avatarurl
        )
      `)
      .eq('category', 'Prayer Requests')
      .eq('userid', userId)
      .order('createdat', { ascending: false });
    
    if (error) handleError(error, 'fetch prayer activity');
    return data || [];
  },

  async getUserStats(userId: string | number) {
    const [threadsResult, commentsResult, likesResult] = await Promise.all([
      supabase.from('communitythreads').select('*', { count: 'exact', head: true }).eq('userid', userId),
      supabase.from('communitycomments').select('*', { count: 'exact', head: true }).eq('userid', userId),
      supabase.from('threadlikes').select('*', { count: 'exact', head: true }).eq('userid', userId)
    ]);
    
    return {
      threadsCreated: threadsResult.count || 0,
      commentsPosted: commentsResult.count || 0,
      prayersOffered: likesResult.count || 0
    };
  }
};

// ============================================
// SPOUSE RELATIONSHIPS
// ============================================

export const spouseService = {
  async getSpouseRelationship(userId: string) {
    const { data, error } = await supabase
      .from('spouseRelationships')
      .select(`
        *,
        user:userId(id, username, fullname, avatarurl),
        spouse:spouseId(id, username, fullname, avatarurl)
      `)
      .or(`userId.eq.${userId},spouseId.eq.${userId}`)
      .eq('status', 'confirmed')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      handleError(error, 'fetch spouse relationship');
    }
    
    // Transform to match expected interface
    if (data) {
      return {
        ...data,
        user: data.user ? {
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.fullname || data.user.username,
          avatar: data.user.avatarurl
        } : null,
        spouse: data.spouse ? {
          id: data.spouse.id,
          username: data.spouse.username,
          displayName: data.spouse.fullname || data.spouse.username,
          avatar: data.spouse.avatarurl
        } : null
      };
    }
    
    return data;
  },

  async searchUsers(query: string, excludeUserId?: string) {
    let queryBuilder = supabase
      .from('users')
      .select('id, username, fullname, avatarurl')
      .ilike('username', `%${query}%`)
      .limit(10);
    
    if (excludeUserId) {
      queryBuilder = queryBuilder.neq('id', excludeUserId);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) handleError(error, 'search users');
    
    // Transform to match expected interface
    return (data || []).map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.fullname || user.username,
      avatar: user.avatarurl
    }));
  },

  async createSpouseRequest(userId: string, spouseId: string) {
    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('spouseRelationships')
      .select('*')
      .or(`userId.eq.${userId},spouseId.eq.${userId}`)
      .or(`userId.eq.${spouseId},spouseId.eq.${spouseId}`);
    
    if (existing && existing.length > 0) {
      throw new Error('A spouse relationship already exists');
    }

    const { data, error } = await supabase
      .from('spouseRelationships')
      .insert({
        userId,
        spouseId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create spouse request');
    return data;
  },

  async confirmSpouseRelationship(relationshipId: string, userId: string) {
    const { data, error } = await supabase
      .from('spouseRelationships')
      .update({
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      })
      .eq('id', relationshipId)
      .eq('spouseId', userId) // Only the spouse can confirm
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error) handleError(error, 'confirm spouse relationship');
    return data;
  },

  async deleteSpouseRelationship(relationshipId: string, userId: string) {
    const { error } = await supabase
      .from('spouseRelationships')
      .delete()
      .eq('id', relationshipId)
      .or(`userId.eq.${userId},spouseId.eq.${userId}`);
    
    if (error) handleError(error, 'delete spouse relationship');
    return true;
  }
};

// ============================================
// STATS & ANALYTICS
// ============================================

export const statsService = {
  async getCommunityStats() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get various counts in parallel
    const [threads, activeUsers, totalComments] = await Promise.all([
      supabase.from('communitythreads').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('communitycomments').select('*', { count: 'exact', head: true })
    ]);
    
    return {
      totalDiscussions: threads.count || 0,
      activeMembers: activeUsers.count || 0,
      totalComments: totalComments.count || 0,
      onlineNow: Math.floor(Math.random() * 50) + 10 // Will be replaced with presence
    };
  }
};