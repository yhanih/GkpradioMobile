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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      prayer_requests: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          is_anonymous: boolean;
          status: 'active' | 'answered' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          is_anonymous?: boolean;
          status?: 'active' | 'answered' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          is_anonymous?: boolean;
          status?: 'active' | 'answered' | 'archived';
          updated_at?: string;
        };
      };
      testimonies: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          is_anonymous: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          is_anonymous?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          is_anonymous?: boolean;
          is_featured?: boolean;
          updated_at?: string;
        };
      };
      podcasts: {
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
          published_at: string;
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
          published_at?: string;
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
          published_at?: string;
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
          published_at: string;
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
          published_at?: string;
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
          published_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          likeable_type: 'prayer_request' | 'testimony' | 'podcast' | 'video';
          likeable_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          likeable_type: 'prayer_request' | 'testimony' | 'podcast' | 'video';
          likeable_id: string;
          created_at?: string;
        };
        Update: {};
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          commentable_type: 'prayer_request' | 'testimony';
          commentable_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          commentable_type: 'prayer_request' | 'testimony';
          commentable_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row'];
export type Testimony = Database['public']['Tables']['testimonies']['Row'];
export type Podcast = Database['public']['Tables']['podcasts']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
