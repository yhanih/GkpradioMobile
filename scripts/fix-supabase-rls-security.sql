-- ============================================
-- CRITICAL SECURITY FIX: Enable RLS on Public Tables
-- ============================================
-- This script fixes the security vulnerabilities identified by Supabase Security Advisor
-- Execute this in your Supabase SQL Editor

-- ============================================
-- PHASE 1: Fix notification_queue (MOST CRITICAL)
-- ============================================

-- Enable RLS on notification_queue table
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to ensure clean slate)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notification_queue;

-- Create policies for notification_queue
-- Note: We need to handle the user_id type correctly (it's integer referencing users.id)

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notification_queue 
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE email = auth.jwt()->>'email'
  )
);

-- Only service role can insert/update/delete notifications
-- Regular users should NOT directly manipulate notifications
CREATE POLICY "Service role can manage notifications"
ON public.notification_queue 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id 
ON public.notification_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
ON public.notification_queue(status);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled 
ON public.notification_queue(scheduled_for);

-- ============================================
-- PHASE 2: Check and fix community tables/views
-- ============================================

-- First, let's check if these are tables or views
DO $$
DECLARE
    v_type text;
BEGIN
    -- Check community_threads
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'community_threads';
    
    IF v_type = 'BASE TABLE' THEN
        RAISE NOTICE 'community_threads is a table, enabling RLS...';
        
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies to avoid conflicts
        PERFORM 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'community_threads';
        
        IF FOUND THEN
            RAISE NOTICE 'Dropping existing policies on community_threads...';
            EXECUTE 'DROP POLICY IF EXISTS "Public threads are viewable by everyone" ON public.community_threads';
            EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.community_threads';
            EXECUTE 'DROP POLICY IF EXISTS "Users can update own threads" ON public.community_threads';
            EXECUTE 'DROP POLICY IF EXISTS "Users can delete own threads" ON public.community_threads';
        END IF;
        
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_threads is a view, checking for SECURITY DEFINER...';
        -- Views need to be recreated without SECURITY DEFINER
    ELSE
        RAISE NOTICE 'community_threads does not exist, skipping...';
    END IF;
    
    -- Check community_comments
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'community_comments';
    
    IF v_type = 'BASE TABLE' THEN
        RAISE NOTICE 'community_comments is a table, enabling RLS...';
        
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies to avoid conflicts
        PERFORM 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'community_comments';
        
        IF FOUND THEN
            RAISE NOTICE 'Dropping existing policies on community_comments...';
            EXECUTE 'DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.community_comments';
            EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments';
            EXECUTE 'DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments';
            EXECUTE 'DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments';
        END IF;
        
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_comments is a view, checking for SECURITY DEFINER...';
        -- Views need to be recreated without SECURITY DEFINER
    ELSE
        RAISE NOTICE 'community_comments does not exist, skipping...';
    END IF;
END $$;

-- Create RLS policies for community_threads (if it's a table)
DO $$
BEGIN
    -- Check if community_threads is a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'community_threads'
          AND table_type = 'BASE TABLE'
    ) THEN
        -- Everyone can view threads
        EXECUTE 'CREATE POLICY "Public threads are viewable by everyone"
        ON public.community_threads FOR SELECT
        USING (true)';
        
        -- Authenticated users can create threads
        -- Note: author_id is integer referencing users.id
        EXECUTE 'CREATE POLICY "Authenticated users can create threads"
        ON public.community_threads FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can update their own threads
        EXECUTE 'CREATE POLICY "Users can update own threads"
        ON public.community_threads FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can delete their own threads
        EXECUTE 'CREATE POLICY "Users can delete own threads"
        ON public.community_threads FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        RAISE NOTICE 'RLS policies created for community_threads';
    END IF;
END $$;

-- Create RLS policies for community_comments (if it's a table)
DO $$
BEGIN
    -- Check if community_comments is a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'community_comments'
          AND table_type = 'BASE TABLE'
    ) THEN
        -- Everyone can view comments
        EXECUTE 'CREATE POLICY "Public comments are viewable by everyone"
        ON public.community_comments FOR SELECT
        USING (true)';
        
        -- Authenticated users can create comments
        EXECUTE 'CREATE POLICY "Authenticated users can create comments"
        ON public.community_comments FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can update their own comments
        EXECUTE 'CREATE POLICY "Users can update own comments"
        ON public.community_comments FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can delete their own comments
        EXECUTE 'CREATE POLICY "Users can delete own comments"
        ON public.community_comments FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        RAISE NOTICE 'RLS policies created for community_comments';
    END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_community_threads_author 
ON public.community_threads(author_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_author 
ON public.community_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_thread 
ON public.community_comments(thread_id);

-- ============================================
-- PHASE 3: Enable RLS on other unprotected tables
-- ============================================

-- Find and report all tables without RLS
DO $$
DECLARE
    rec RECORD;
    count_fixed INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Checking all tables for RLS status...';
    RAISE NOTICE '====================================';
    
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = FALSE
        AND tablename NOT IN ('schema_migrations', 'ar_internal_metadata') -- Skip migration tables
    LOOP
        RAISE NOTICE 'Enabling RLS on table: %', rec.tablename;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
        count_fixed := count_fixed + 1;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total tables with RLS enabled: %', count_fixed;
    RAISE NOTICE '====================================';
END $$;

-- ============================================
-- PHASE 4: Verification Queries
-- ============================================

-- Check RLS status on all public tables
SELECT 
    '=== RLS Status Report ===' as report,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED'
        ELSE '❌ EXPOSED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- Count policies per table
SELECT 
    '=== Policy Count Report ===' as report,
    tablename,
    COUNT(policyname) as policy_count,
    CASE 
        WHEN COUNT(policyname) = 0 THEN '⚠️ NO POLICIES - Table may be inaccessible!'
        WHEN COUNT(policyname) < 2 THEN '⚠️ Limited policies'
        ELSE '✅ Multiple policies configured'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY COUNT(policyname), tablename;

-- List all policies for critical tables
SELECT 
    '=== Detailed Policy List ===' as report,
    tablename,
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments', 'users')
ORDER BY tablename, policyname;

-- Final security audit view
CREATE OR REPLACE VIEW public.security_audit AS
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = FALSE THEN '🔴 CRITICAL: No RLS'
        WHEN COUNT(p.policyname) = 0 THEN '⚠️ WARNING: RLS enabled but no policies'
        ELSE '✅ Secured'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity, policy_count, t.tablename;

-- Display final audit
SELECT * FROM public.security_audit;

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'SECURITY FIX COMPLETE!';
RAISE NOTICE 'Please check the reports above and';
RAISE NOTICE 're-run Supabase Security Advisor';
RAISE NOTICE '========================================';