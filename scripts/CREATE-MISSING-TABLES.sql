-- =====================================================
-- CREATE MISSING TABLES IN SUPABASE
-- =====================================================
-- Execute this ENTIRE script in your Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE MISSING TABLES
-- =====================================================

-- 1. Community threads table
CREATE TABLE IF NOT EXISTS community_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Community comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Thread likes
CREATE TABLE IF NOT EXISTS thread_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- 4. Thread follows
CREATE TABLE IF NOT EXISTS thread_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- 5. Live chat messages
CREATE TABLE IF NOT EXISTS live_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for community_threads
CREATE INDEX IF NOT EXISTS idx_community_threads_author ON community_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_community_threads_category ON community_threads(category);
CREATE INDEX IF NOT EXISTS idx_community_threads_created ON community_threads(created_at DESC);

-- Indexes for community_comments
CREATE INDEX IF NOT EXISTS idx_community_comments_thread ON community_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);

-- Indexes for thread_likes
CREATE INDEX IF NOT EXISTS idx_thread_likes_thread ON thread_likes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_user ON thread_likes(user_id);

-- Indexes for thread_follows
CREATE INDEX IF NOT EXISTS idx_thread_follows_thread ON thread_follows(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_follows_user ON thread_follows(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on community_threads
ALTER TABLE community_threads ENABLE ROW LEVEL SECURITY;

-- Everyone can view threads
CREATE POLICY "Anyone can view threads"
ON community_threads FOR SELECT
USING (true);

-- Authenticated users can create threads
CREATE POLICY "Users create own threads"
ON community_threads FOR INSERT
TO authenticated
WITH CHECK (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can update their own threads
CREATE POLICY "Users update own threads"
ON community_threads FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can delete their own threads
CREATE POLICY "Users delete own threads"
ON community_threads FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Enable RLS on community_comments
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Anyone can view comments"
ON community_comments FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Users create own comments"
ON community_comments FOR INSERT
TO authenticated
WITH CHECK (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can update their own comments
CREATE POLICY "Users update own comments"
ON community_comments FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can delete their own comments
CREATE POLICY "Users delete own comments"
ON community_comments FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Enable RLS on other tables
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Public policies for live chat
CREATE POLICY "Anyone can view chat messages"
ON live_chat_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON live_chat_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Public policies for team members (read-only)
CREATE POLICY "Anyone can view team members"
ON team_members FOR SELECT
USING (true);

-- Service role policies for contact messages
CREATE POLICY "Service manages contact messages"
ON contact_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policies for newsletter
CREATE POLICY "Service manages newsletter"
ON newsletter_subscribers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- CREATE UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for community_threads
DROP TRIGGER IF EXISTS update_community_threads_updated_at ON community_threads;
CREATE TRIGGER update_community_threads_updated_at 
BEFORE UPDATE ON community_threads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- This query should return all the tables we just created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'community_threads',
    'community_comments',
    'thread_likes',
    'thread_follows',
    'live_chat_messages',
    'contact_messages',
    'newsletter_subscribers',
    'team_members'
)
ORDER BY table_name;

-- Expected output: 8 rows with all table names