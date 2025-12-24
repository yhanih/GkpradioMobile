/**
 * ⚠️ SCHEMA REFERENCE - CRITICAL FOR SUPABASE QUERIES
 * 
 * ACTUAL Supabase table names (as of Dec 2024):
 * - `episodes` (podcast episodes)
 * - `prayercircles` (prayers & testimonies - uses is_testimony boolean)
 * - `users` (user profiles)
 * - `videos` (video content)
 * - `communitycomments` (comments)
 * - For columns: use `created_at` NOT `published_at`
 * 
 * DO NOT use old names like:
 * ❌ podcasts → use episodes
 * ❌ prayer_requests → use prayercircles with is_testimony=false
 * ❌ testimonies → use prayercircles with is_testimony=true
 * ❌ profiles → use users
 * 
 * See replit.md for full schema documentation.
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          username: string | null;
          fullname: string | null;
          avatarurl: string | null;
          bio: string | null;
          role: string | null;
          is_email_verified: boolean | null;
          push_token: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          username?: string | null;
          fullname?: string | null;
          avatarurl?: string | null;
          bio?: string | null;
          role?: string | null;
          is_email_verified?: boolean | null;
          push_token?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string | null;
          username?: string | null;
          fullname?: string | null;
          avatarurl?: string | null;
          bio?: string | null;
          role?: string | null;
          is_email_verified?: boolean | null;
          push_token?: string | null;
          updated_at?: string | null;
        };
      };
      episodes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          audio_url: string;
          duration: number | null;
          thumbnail_url: string | null;
          author: string | null;
          category: string | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          audio_url: string;
          duration?: number | null;
          thumbnail_url?: string | null;
          author?: string | null;
          category?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          audio_url?: string;
          duration?: number | null;
          thumbnail_url?: string | null;
          author?: string | null;
          category?: string | null;
          is_featured?: boolean;
        };
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          duration: number | null;
          category: string | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          category?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          category?: string | null;
          is_featured?: boolean;
        };
      };
      communitythreads: {
        Row: {
          id: string;
          userid: string;
          title: string;
          content: string;
          category: string;
          ispinned: boolean;
          islocked: boolean;
          viewcount: number;
          createdat: string;
          updatedat: string;
          taggedspouseid: string | null;
          privacy_level: string;
          is_anonymous: boolean;
          like_count: number;
          comment_count: number;
        };
        Insert: {
          id?: string;
          userid: string;
          title: string;
          content: string;
          category: string;
          ispinned?: boolean;
          islocked?: boolean;
          viewcount?: number;
          createdat?: string;
          updatedat?: string;
          taggedspouseid?: string | null;
          privacy_level?: string;
          is_anonymous?: boolean;
          like_count?: number;
          comment_count?: number;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          ispinned?: boolean;
          islocked?: boolean;
          viewcount?: number;
          updatedat?: string;
          taggedspouseid?: string | null;
          privacy_level?: string;
          is_anonymous?: boolean;
          like_count?: number;
          comment_count?: number;
        };
      };
      communitycomments: {
        Row: {
          id: string;
          userid: string;
          threadid: string;
          content: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          userid: string;
          threadid: string;
          content: string;
          createdat?: string;
        };
        Update: {
          content?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {};
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {};
      };
      prayercircles: {
        Row: {
          id: string;
          followerid: string;
          followingid: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          followerid: string;
          followingid: string;
          createdat?: string;
        };
        Update: {
          followerid?: string;
          followingid?: string;
        };
      };
      schedule: {
        Row: {
          id: string;
          day_of_week: string;
          show_title: string;
          hosts: string | null;
          start_time: string;
          end_time: string;
          is_live: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          day_of_week: string;
          show_title: string;
          hosts?: string | null;
          start_time: string;
          end_time: string;
          is_live?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          day_of_week?: string;
          show_title?: string;
          hosts?: string | null;
          start_time?: string;
          end_time?: string;
          is_live?: boolean;
          updated_at?: string | null;
        };
      };
      community_thread_likes: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          thread_id?: string;
          user_id?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          thread_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thread_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          thread_id?: string;
        };
      };
      thread_prayers: {
        Row: {
          id: string;
          user_id: string;
          thread_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thread_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          thread_id?: string;
        };
      };
      live_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          scheduled_start: string;
          scheduled_end: string | null;
          status: 'scheduled' | 'live' | 'ended' | 'cancelled';
          is_featured: boolean;
          viewer_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          scheduled_start: string;
          scheduled_end?: string | null;
          status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
          is_featured?: boolean;
          viewer_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          scheduled_start?: string;
          scheduled_end?: string | null;
          status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
          is_featured?: boolean;
          viewer_count?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type Episode = Database['public']['Tables']['episodes']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type CommunityThread = Database['public']['Tables']['communitythreads']['Row'];
export type CommunityComment = Database['public']['Tables']['communitycomments']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type BlockedUser = Database['public']['Tables']['blocked_users']['Row'];
export type PrayerCircle = Database['public']['Tables']['prayercircles']['Row'];
export type Schedule = Database['public']['Tables']['schedule']['Row'];
export type LiveEvent = Database['public']['Tables']['live_events']['Row'];
export type CommunityThreadLike = Database['public']['Tables']['community_thread_likes']['Row'];
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
export type ThreadPrayer = Database['public']['Tables']['thread_prayers']['Row'];
