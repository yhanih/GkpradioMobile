-- ============================================
-- SUPABASE SECURITY FIX - FINAL VERSION
-- ============================================
-- This script fixes the critical security vulnerabilities
-- Works with both TABLES and VIEWS

-- ============================================
-- PART 1: Handle notification_queue
-- ============================================
DO $$
DECLARE
    v_type text;
BEGIN
    -- Check if notification_queue exists and what type it is
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_queue';
    
    IF v_type = 'BASE TABLE' THEN
        -- Enable RLS on notification_queue
        EXECUTE 'ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users view own notifications" ON public.notification_queue;
        DROP POLICY IF EXISTS "Service manages notifications" ON public.notification_queue;
        
        -- Create policy: Users can only see their own notifications
        CREATE POLICY "Users view own notifications"
        ON public.notification_queue FOR SELECT
        TO authenticated
        USING (
            user_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        -- Service role manages notifications
        CREATE POLICY "Service manages notifications"
        ON public.notification_queue FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'notification_queue: RLS enabled and policies created';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'notification_queue is a VIEW - cannot enable RLS';
    ELSE
        RAISE NOTICE 'notification_queue not found';
    END IF;
END $$;

-- ============================================
-- PART 2: Handle community_threads
-- ============================================
DO $$
DECLARE
    v_type text;
BEGIN
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_threads';
    
    IF v_type = 'BASE TABLE' THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Anyone can view threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users create own threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users update own threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users delete own threads" ON public.community_threads;
        
        -- Create policies
        CREATE POLICY "Anyone can view threads"
        ON public.community_threads FOR SELECT
        USING (true);
        
        CREATE POLICY "Users create own threads"
        ON public.community_threads FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        CREATE POLICY "Users update own threads"
        ON public.community_threads FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        CREATE POLICY "Users delete own threads"
        ON public.community_threads FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        RAISE NOTICE 'community_threads: RLS enabled and policies created';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_threads is a VIEW - will need to recreate without SECURITY DEFINER';
        -- Note: Views with SECURITY DEFINER need to be manually recreated
        -- The Security Advisor warning is because the view bypasses RLS
    END IF;
END $$;

-- ============================================
-- PART 3: Handle community_comments
-- ============================================
DO $$
DECLARE
    v_type text;
BEGIN
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_comments';
    
    IF v_type = 'BASE TABLE' THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users create own comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users update own comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users delete own comments" ON public.community_comments;
        
        -- Create policies
        CREATE POLICY "Anyone can view comments"
        ON public.community_comments FOR SELECT
        USING (true);
        
        CREATE POLICY "Users create own comments"
        ON public.community_comments FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        CREATE POLICY "Users update own comments"
        ON public.community_comments FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        CREATE POLICY "Users delete own comments"
        ON public.community_comments FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        RAISE NOTICE 'community_comments: RLS enabled and policies created';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_comments is a VIEW - will need to recreate without SECURITY DEFINER';
    END IF;
END $$;

-- ============================================
-- PART 4: Handle users table
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) THEN
        -- Enable RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
        DROP POLICY IF EXISTS "Users update own profile" ON public.users;
        
        -- Create policies
        CREATE POLICY "Public profiles viewable"
        ON public.users FOR SELECT
        USING (true);
        
        CREATE POLICY "Users update own profile"
        ON public.users FOR UPDATE
        TO authenticated
        USING (
            id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>'email'
            )
        );
        
        RAISE NOTICE 'users: RLS enabled and policies created';
    END IF;
END $$;

-- ============================================
-- PART 5: Enable RLS on all other tables
-- ============================================
DO $$
DECLARE
    rec RECORD;
    count_fixed INTEGER := 0;
BEGIN
    FOR rec IN 
        SELECT t.tablename 
        FROM pg_tables t
        WHERE t.schemaname = 'public' 
        AND t.rowsecurity = FALSE
        AND t.tablename NOT IN ('schema_migrations', 'ar_internal_metadata')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
        count_fixed := count_fixed + 1;
        RAISE NOTICE 'Enabled RLS on: %', rec.tablename;
    END LOOP;
    
    IF count_fixed > 0 THEN
        RAISE NOTICE 'Total tables fixed: %', count_fixed;
    END IF;
END $$;

-- ============================================
-- PART 6: Create indexes for performance
-- ============================================
-- Create indexes only if tables exist
DO $$
BEGIN
    -- notification_queue indexes
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_queue') THEN
        CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
    END IF;
    
    -- community_threads indexes (only if it's a table)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'community_threads'
          AND table_type = 'BASE TABLE'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_community_threads_author ON public.community_threads(author_id);
    END IF;
    
    -- community_comments indexes (only if it's a table)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'community_comments'
          AND table_type = 'BASE TABLE'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_community_comments_author ON public.community_comments(author_id);
        CREATE INDEX IF NOT EXISTS idx_community_comments_thread ON public.community_comments(thread_id);
    END IF;
END $$;

-- ============================================
-- FINAL REPORT: Show security status
-- ============================================

-- Report 1: Tables with RLS status
SELECT 
    'TABLE' as object_type,
    tablename as name,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED'
        ELSE '❌ EXPOSED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments', 'users')
ORDER BY tablename;

-- Report 2: Views (cannot have RLS but may have SECURITY DEFINER)
SELECT 
    'VIEW' as object_type,
    table_name as name,
    '⚠️ Check SECURITY DEFINER' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('community_threads', 'community_comments')
ORDER BY table_name;

-- Report 3: Policy count on tables
SELECT 
    tablename,
    COUNT(policyname) as policy_count,
    CASE 
        WHEN COUNT(policyname) = 0 THEN '⚠️ No policies (may be inaccessible)'
        ELSE '✅ Has ' || COUNT(policyname) || ' policies'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments', 'users')
GROUP BY tablename
ORDER BY tablename;

-- Report 4: Overall security status
SELECT 
    COUNT(*) FILTER (WHERE rowsecurity = true) as protected_tables,
    COUNT(*) FILTER (WHERE rowsecurity = false) as exposed_tables,
    COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public';

-- ============================================
-- IMPORTANT NOTES:
-- 1. If community_threads or community_comments are VIEWS with SECURITY DEFINER,
--    they need to be manually recreated without that property
-- 2. After running this, check Supabase Security Advisor again
-- 3. The most critical fix is notification_queue - it's currently exposed
-- ============================================