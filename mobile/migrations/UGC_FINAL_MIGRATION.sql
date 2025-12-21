-- UGC Safety & Compliance Final Migration
-- This script ensures all moderation tables are present and correctly linked
-- to the actual table names used in the app (users, prayercircles, etc.)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REPORTING TABLE
-- Allows users to report inappropriate content
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('prayer_request', 'testimony', 'comment', 'episode', 'video')),
    target_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies for reports
CREATE POLICY "Users can create their own reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
    ON public.reports FOR SELECT 
    USING (auth.uid() = reporter_id);

-- 2. BLOCKING TABLE
-- Allows users to block other users
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS for blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies for blocked_users
CREATE POLICY "Users can manage their own blocks" 
    ON public.blocked_users FOR ALL 
    USING (auth.uid() = blocker_id);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- 4. GRANT PERMISSIONS
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.blocked_users TO authenticated;

-- 5. CASCADE DELETION CHECK
-- Ensure prayercircles and other user-generated content are deleted when a user is deleted
-- (This should already be in the schema, but adding as a safety measure)
ALTER TABLE IF EXISTS public.prayercircles 
DROP CONSTRAINT IF EXISTS prayercircles_user_id_fkey,
ADD CONSTRAINT prayercircles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.communitycomments 
DROP CONSTRAINT IF EXISTS communitycomments_user_id_fkey,
ADD CONSTRAINT communitycomments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
