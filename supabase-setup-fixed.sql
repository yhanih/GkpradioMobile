-- =====================================================
-- SUPABASE TABLE SETUP FOR GKP RADIO COMMUNITY FEATURES
-- FIXED VERSION - Handles existing tables
-=====================================================
-- Run this SQL script in your Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING POLICIES FIRST (to avoid conflicts)
-- =====================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view threads" ON community_threads;
DROP POLICY IF EXISTS "Authenticated users can create threads" ON community_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON community_threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON community_threads;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON community_comments;
DROP POLICY IF EXISTS "Anyone can view likes" ON thread_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON thread_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON thread_likes;
DROP POLICY IF EXISTS "Anyone can view follows" ON thread_follows;
DROP POLICY IF EXISTS "Authenticated users can follow" ON thread_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON thread_follows;
DROP POLICY IF EXISTS "Anyone can view episodes" ON episodes;
DROP POLICY IF EXISTS "Anyone can view videos" ON videos;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view live chat" ON liveChatMessages;
DROP POLICY IF EXISTS "Authenticated users can send live chat" ON liveChatMessages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contactMessages;
DROP POLICY IF EXISTS "Admin can view contact messages" ON contactMessages;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletterSubscribers;
DROP POLICY IF EXISTS "Admin can view subscribers" ON newsletterSubscribers;

-- =====================================================
-- CREATE OR ALTER TABLES WITH UUID SUPPORT
-- =====================================================

-- Check if users table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
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
    END IF;
END $$;

-- Community threads (using userid to match existing conventions)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_threads') THEN
        CREATE TABLE community_threads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            content TEXT,
            category TEXT NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Community comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_comments') THEN
        CREATE TABLE community_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            threadid UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            parentid UUID REFERENCES community_comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Thread likes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_likes') THEN
        CREATE TABLE thread_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            threadid UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(threadid, userid)
        );
    END IF;
END $$;

-- Thread follows
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_follows') THEN
        CREATE TABLE thread_follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            threadid UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(threadid, userid)
        );
    END IF;
END $$;

-- Discussion tags
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussion_tags') THEN
        CREATE TABLE discussion_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            discussionid UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
            taggeduserid UUID REFERENCES users(id),
            taggedemail TEXT,
            tagcategory TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Episodes table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episodes') THEN
        CREATE TABLE episodes (
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
    END IF;
END $$;

-- Episode comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episode_comments') THEN
        CREATE TABLE episode_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            episodeid UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Videos table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
        CREATE TABLE videos (
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
    END IF;
END $$;

-- Video likes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_likes') THEN
        CREATE TABLE video_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            videoid UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(videoid, userid)
        );
    END IF;
END $$;

-- Video comments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_comments') THEN
        CREATE TABLE video_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            videoid UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
            userid UUID REFERENCES users(id) NOT NULL,
            parentid UUID REFERENCES video_comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Notifications table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            userid UUID REFERENCES users(id) NOT NULL,
            type TEXT NOT NULL,
            ref_type TEXT,
            ref_id TEXT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            metadata JSONB,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Chat messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            message TEXT NOT NULL,
            username TEXT NOT NULL,
            userid UUID REFERENCES users(id),
            is_verified BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Live chat messages (matching existing naming)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'livechatmessages') THEN
        CREATE TABLE livechatmessages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            message TEXT NOT NULL,
            username TEXT NOT NULL,
            userid UUID,
            isverified BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Contact messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contactmessages') THEN
        CREATE TABLE contactmessages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- Newsletter subscribers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newslettersubscribers') THEN
        CREATE TABLE newslettersubscribers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_community_threads_author ON community_threads(userid);
CREATE INDEX IF NOT EXISTS idx_community_threads_category ON community_threads(category);
CREATE INDEX IF NOT EXISTS idx_community_comments_thread ON community_comments(threadid);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(userid);
CREATE INDEX IF NOT EXISTS idx_thread_likes_thread ON thread_likes(threadid);
CREATE INDEX IF NOT EXISTS idx_thread_likes_user ON thread_likes(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(userid, read_at) WHERE read_at IS NULL;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
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
ALTER TABLE livechatmessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactmessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newslettersubscribers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE NEW RLS POLICIES (using correct column names)
-- =====================================================

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Community threads policies (using userid column)
CREATE POLICY "Anyone can view threads" ON community_threads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON community_threads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own threads" ON community_threads
    FOR UPDATE USING (auth.uid() = userid);

CREATE POLICY "Users can delete own threads" ON community_threads
    FOR DELETE USING (auth.uid() = userid);

-- Community comments policies (using userid column)
CREATE POLICY "Anyone can view comments" ON community_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON community_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON community_comments
    FOR UPDATE USING (auth.uid() = userid);

CREATE POLICY "Users can delete own comments" ON community_comments
    FOR DELETE USING (auth.uid() = userid);

-- Thread likes policies (using userid column)
CREATE POLICY "Anyone can view likes" ON thread_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON thread_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can remove own likes" ON thread_likes
    FOR DELETE USING (auth.uid() = userid);

-- Thread follows policies (using userid column)
CREATE POLICY "Anyone can view follows" ON thread_follows
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow" ON thread_follows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unfollow" ON thread_follows
    FOR DELETE USING (auth.uid() = userid);

-- Episodes policies
CREATE POLICY "Anyone can view episodes" ON episodes
    FOR SELECT USING (true);

-- Videos policies
CREATE POLICY "Anyone can view videos" ON videos
    FOR SELECT USING (true);

-- Notifications policies (using userid column)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = userid);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = userid);

-- Chat messages policies (using userid column)
CREATE POLICY "Anyone can view chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Live chat messages policies
CREATE POLICY "Anyone can view live chat" ON livechatmessages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send live chat" ON livechatmessages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Contact messages policies
CREATE POLICY "Anyone can submit contact messages" ON contactmessages
    FOR INSERT WITH CHECK (true);

-- Newsletter policies
CREATE POLICY "Anyone can subscribe" ON newslettersubscribers
    FOR INSERT WITH CHECK (true);

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
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created/verified with lowercase column names (userid, threadid, etc.)';
    RAISE NOTICE 'RLS policies have been applied';
    RAISE NOTICE 'Remember to create storage buckets in Supabase Dashboard';
END $$;