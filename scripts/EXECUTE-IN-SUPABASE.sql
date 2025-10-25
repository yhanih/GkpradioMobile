-- ============================================
-- PRODUCTION SECURITY FIX FOR SUPABASE
-- ============================================
-- Execute this ENTIRE script in your Supabase SQL Editor
-- This fixes the critical security vulnerabilities found by Security Advisor

-- STEP 1: Enable RLS on notification_queue (MOST CRITICAL - Currently fully exposed!)
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own notifications
CREATE POLICY "Users view own notifications"
ON public.notification_queue FOR SELECT
TO authenticated
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Create policy: Only backend service can insert/update/delete notifications
CREATE POLICY "Service manages notifications"
ON public.notification_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- STEP 2: Enable RLS on community_threads
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;

-- Everyone can view threads
CREATE POLICY "Anyone can view threads"
ON public.community_threads FOR SELECT
USING (true);

-- Authenticated users can create threads (checking author matches)
CREATE POLICY "Users create own threads"
ON public.community_threads FOR INSERT
TO authenticated
WITH CHECK (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can update their own threads
CREATE POLICY "Users update own threads"
ON public.community_threads FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can delete their own threads
CREATE POLICY "Users delete own threads"
ON public.community_threads FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- STEP 3: Enable RLS on community_comments
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Anyone can view comments"
ON public.community_comments FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Users create own comments"
ON public.community_comments FOR INSERT
TO authenticated
WITH CHECK (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can update their own comments
CREATE POLICY "Users update own comments"
ON public.community_comments FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Users can delete their own comments
CREATE POLICY "Users delete own comments"
ON public.community_comments FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- STEP 4: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Everyone can view user profiles
CREATE POLICY "Public profiles viewable"
ON public.users FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- STEP 5: Enable RLS on other critical tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Enable RLS on any remaining unprotected tables
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = FALSE
        AND tablename NOT IN ('schema_migrations') -- Skip migration tracking tables
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
        RAISE NOTICE 'Enabled RLS on: %', rec.tablename;
    END LOOP;
END $$;

-- STEP 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_community_threads_author ON public.community_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON public.community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_thread ON public.community_comments(thread_id);

-- VERIFICATION: Check that all tables are now protected
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED with RLS'
        ELSE '❌ STILL EXPOSED - NEEDS FIX!'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- VERIFICATION: Count policies per table
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = FALSE THEN '🔴 No RLS enabled!'
        WHEN COUNT(p.policyname) = 0 THEN '⚠️ RLS enabled but no policies (table inaccessible)'
        ELSE '✅ Secured with ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, COUNT(p.policyname), t.tablename;