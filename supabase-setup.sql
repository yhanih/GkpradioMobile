-- =====================================================
-- SUPABASE TABLE SETUP FOR GKP RADIO COMMUNITY FEATURES
-- =====================================================
-- Run this SQL script in your Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE TABLES WITH UUID SUPPORT
-- =====================================================
-- NOTE: Using UUID for all IDs to match Supabase Auth system

-- Users table (extends Supabase auth.users)
-- This table stores additional profile information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    bio TEXT,
    avatar TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Community threads (discussions)
CREATE TABLE IF NOT EXISTS community_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Community comments (replies to threads)
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Thread likes
CREATE TABLE IF NOT EXISTS thread_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- Thread follows
CREATE TABLE IF NOT EXISTS thread_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- Discussion tags (for tagging users in discussions)
CREATE TABLE IF NOT EXISTS discussion_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    tagged_user_id UUID REFERENCES users(id),
    tagged_email TEXT,
    tag_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Episodes table (for podcast episodes)
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    duration INTEGER,
    host_name TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Episode comments
CREATE TABLE IF NOT EXISTS episode_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL,
    duration INTEGER,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    host_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Video likes
CREATE TABLE IF NOT EXISTS video_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(video_id, user_id)
);

-- Video comments
CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    ref_type TEXT,
    ref_id TEXT,  -- Using TEXT since ref_id could reference different UUID tables
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chat messages (for live chat)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    username TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    is_verified BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Live chat messages (for Supabase real-time chat)
CREATE TABLE IF NOT EXISTS liveChatMessages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    username TEXT NOT NULL,
    userid UUID,
    isverified BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contactMessages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletterSubscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_community_threads_author ON community_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_community_threads_category ON community_threads(category);
CREATE INDEX IF NOT EXISTS idx_community_comments_thread ON community_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_thread ON thread_likes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_user ON thread_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE liveChatMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletterSubscribers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Community threads policies
CREATE POLICY "Anyone can view threads" ON community_threads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON community_threads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own threads" ON community_threads
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own threads" ON community_threads
    FOR DELETE USING (auth.uid() = author_id);

-- Community comments policies
CREATE POLICY "Anyone can view comments" ON community_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON community_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON community_comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON community_comments
    FOR DELETE USING (auth.uid() = author_id);

-- Thread likes policies
CREATE POLICY "Anyone can view likes" ON thread_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON thread_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can remove own likes" ON thread_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Thread follows policies
CREATE POLICY "Anyone can view follows" ON thread_follows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow" ON thread_follows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unfollow" ON thread_follows
    FOR DELETE USING (auth.uid() = user_id);

-- Episodes policies
CREATE POLICY "Anyone can view episodes" ON episodes
    FOR SELECT USING (true);

-- Videos policies
CREATE POLICY "Anyone can view videos" ON videos
    FOR SELECT USING (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Anyone can view chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Live chat messages policies
CREATE POLICY "Anyone can view live chat" ON liveChatMessages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send live chat" ON liveChatMessages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Contact messages policies
CREATE POLICY "Anyone can submit contact messages" ON contactMessages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view contact messages" ON contactMessages
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Newsletter policies
CREATE POLICY "Anyone can subscribe" ON newsletterSubscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view subscribers" ON newsletterSubscribers
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_threads_updated_at ON community_threads;
CREATE TRIGGER update_community_threads_updated_at BEFORE UPDATE ON community_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 1. This script uses UUID for all IDs to match Supabase Auth
-- 2. The 'users' table should be linked to auth.users via a trigger
-- 3. Storage buckets still need to be created manually in Supabase Dashboard:
--    - avatars (Public)
--    - episodes (Public) 
--    - videos (Public)
--    - thumbnails (Public)
--    - community-uploads (Public)

COMMENT ON SCHEMA public IS 'GKP Radio Community Platform Database Schema - UUID Version';