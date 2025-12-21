-- Community Enhancements - Phase 1
-- Adds likes system, engagement metrics, and performance indexes

-- ============================================
-- LIKES SYSTEM
-- ============================================

-- Table for tracking likes on community threads
CREATE TABLE IF NOT EXISTS public.community_thread_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES communitythreads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_thread_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Anyone can view likes"
    ON public.community_thread_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own likes"
    ON public.community_thread_likes FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- ENGAGEMENT METRICS (Denormalized for performance)
-- ============================================

-- Add like and comment counters to threads
ALTER TABLE public.communitythreads 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_thread_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE communitythreads 
        SET like_count = like_count + 1 
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE communitythreads 
        SET like_count = GREATEST(like_count - 1, 0) 
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update like counts
DROP TRIGGER IF EXISTS trigger_update_thread_like_count ON community_thread_likes;
CREATE TRIGGER trigger_update_thread_like_count
    AFTER INSERT OR DELETE ON community_thread_likes
    FOR EACH ROW EXECUTE FUNCTION update_thread_like_count();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_thread_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE communitythreads 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.threadid;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE communitythreads 
        SET comment_count = GREATEST(comment_count - 1, 0) 
        WHERE id = OLD.threadid;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update comment counts
DROP TRIGGER IF EXISTS trigger_update_thread_comment_count ON communitycomments;
CREATE TRIGGER trigger_update_thread_comment_count
    AFTER INSERT OR DELETE ON communitycomments
    FOR EACH ROW EXECUTE FUNCTION update_thread_comment_count();

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Indexes for likes queries
CREATE INDEX IF NOT EXISTS idx_thread_likes_thread ON community_thread_likes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_user ON community_thread_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_likes_created ON community_thread_likes(created_at DESC);

-- Indexes for threads queries
CREATE INDEX IF NOT EXISTS idx_threads_user ON communitythreads(userid);
CREATE INDEX IF NOT EXISTS idx_threads_category ON communitythreads(category);
CREATE INDEX IF NOT EXISTS idx_threads_created ON communitythreads(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_threads_popular ON communitythreads(like_count DESC);

-- Indexes for comments queries
CREATE INDEX IF NOT EXISTS idx_comments_thread ON communitycomments(threadid);
CREATE INDEX IF NOT EXISTS idx_comments_user ON communitycomments(userid);
CREATE INDEX IF NOT EXISTS idx_comments_created ON communitycomments(createdat DESC);

-- ============================================
-- BACKFILL EXISTING DATA
-- ============================================

-- Update existing threads with current like and comment counts
UPDATE communitythreads t
SET comment_count = (
    SELECT COUNT(*) 
    FROM communitycomments c 
    WHERE c.threadid = t.id
);

-- If there are any existing likes (unlikely), count them
-- UPDATE communitythreads t
-- SET like_count = (
--     SELECT COUNT(*) 
--     FROM community_thread_likes l 
--     WHERE l.thread_id = t.id
-- );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, DELETE ON public.community_thread_likes TO authenticated;
GRANT SELECT ON public.community_thread_likes TO anon;
