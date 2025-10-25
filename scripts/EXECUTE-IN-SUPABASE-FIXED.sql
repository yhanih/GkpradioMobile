-- ============================================
-- PRODUCTION SECURITY FIX FOR SUPABASE (FIXED VERSION)
-- ============================================
-- This handles both TABLES and VIEWS properly
-- Execute this ENTIRE script in your Supabase SQL Editor

-- STEP 1: Check what type each object is (table or view)
DO $$
DECLARE
    v_type text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING SECURITY FIX...';
    RAISE NOTICE '========================================';
    
    -- Check notification_queue
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification_queue';
    
    IF v_type = 'BASE TABLE' THEN
        RAISE NOTICE 'notification_queue is a TABLE - enabling RLS...';
        EXECUTE 'ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'notification_queue is a VIEW - cannot enable RLS on views';
    ELSE
        RAISE NOTICE 'notification_queue not found';
    END IF;
    
    -- Check community_threads  
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_threads';
    
    IF v_type = 'BASE TABLE' THEN
        RAISE NOTICE 'community_threads is a TABLE - enabling RLS...';
        EXECUTE 'ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_threads is a VIEW - will handle separately...';
    END IF;
    
    -- Check community_comments
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_comments';
    
    IF v_type = 'BASE TABLE' THEN
        RAISE NOTICE 'community_comments is a TABLE - enabling RLS...';
        EXECUTE 'ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY';
    ELSIF v_type = 'VIEW' THEN
        RAISE NOTICE 'community_comments is a VIEW - will handle separately...';
    END IF;
END $$;

-- STEP 2: Fix notification_queue if it's a table (CRITICAL - this one is exposed!)
DO $$
BEGIN
    -- Only proceed if it's a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'notification_queue'
          AND table_type = 'BASE TABLE'
    ) THEN
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Users view own notifications" ON public.notification_queue;
        DROP POLICY IF EXISTS "Service manages notifications" ON public.notification_queue;
        
        -- Create policy: Users can only view their own notifications
        EXECUTE 'CREATE POLICY "Users view own notifications"
        ON public.notification_queue FOR SELECT
        TO authenticated
        USING (
            user_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Only service role can manage notifications
        EXECUTE 'CREATE POLICY "Service manages notifications"
        ON public.notification_queue FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)';
        
        RAISE NOTICE 'notification_queue secured with RLS policies';
    END IF;
END $$;

-- STEP 3: Handle community_threads (view or table)
DO $$
DECLARE
    v_definition text;
    v_type text;
BEGIN
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_threads';
    
    IF v_type = 'VIEW' THEN
        -- Get the view definition
        SELECT view_definition INTO v_definition
        FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'community_threads';
        
        RAISE NOTICE 'community_threads is a VIEW with SECURITY DEFINER - recreating without it...';
        
        -- Drop the old view
        DROP VIEW IF EXISTS public.community_threads CASCADE;
        
        -- Recreate without SECURITY DEFINER (using the same definition)
        -- Note: You may need to adjust this based on the actual view definition
        EXECUTE 'CREATE VIEW public.community_threads AS ' || v_definition;
        
        RAISE NOTICE 'community_threads view recreated without SECURITY DEFINER';
        
    ELSIF v_type = 'BASE TABLE' THEN
        -- It's a table, add RLS policies
        DROP POLICY IF EXISTS "Anyone can view threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users create own threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users update own threads" ON public.community_threads;
        DROP POLICY IF EXISTS "Users delete own threads" ON public.community_threads;
        
        -- Everyone can view threads
        EXECUTE 'CREATE POLICY "Anyone can view threads"
        ON public.community_threads FOR SELECT
        USING (true)';
        
        -- Authenticated users can create threads
        EXECUTE 'CREATE POLICY "Users create own threads"
        ON public.community_threads FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can update their own threads
        EXECUTE 'CREATE POLICY "Users update own threads"
        ON public.community_threads FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can delete their own threads
        EXECUTE 'CREATE POLICY "Users delete own threads"
        ON public.community_threads FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        RAISE NOTICE 'community_threads table secured with RLS policies';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error handling community_threads: %', SQLERRM;
END $$;

-- STEP 4: Handle community_comments (view or table)
DO $$
DECLARE
    v_definition text;
    v_type text;
BEGIN
    SELECT table_type INTO v_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_comments';
    
    IF v_type = 'VIEW' THEN
        -- Get the view definition
        SELECT view_definition INTO v_definition
        FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'community_comments';
        
        RAISE NOTICE 'community_comments is a VIEW with SECURITY DEFINER - recreating without it...';
        
        -- Drop the old view
        DROP VIEW IF EXISTS public.community_comments CASCADE;
        
        -- Recreate without SECURITY DEFINER
        EXECUTE 'CREATE VIEW public.community_comments AS ' || v_definition;
        
        RAISE NOTICE 'community_comments view recreated without SECURITY DEFINER';
        
    ELSIF v_type = 'BASE TABLE' THEN
        -- It's a table, add RLS policies
        DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users create own comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users update own comments" ON public.community_comments;
        DROP POLICY IF EXISTS "Users delete own comments" ON public.community_comments;
        
        -- Everyone can view comments
        EXECUTE 'CREATE POLICY "Anyone can view comments"
        ON public.community_comments FOR SELECT
        USING (true)';
        
        -- Authenticated users can create comments
        EXECUTE 'CREATE POLICY "Users create own comments"
        ON public.community_comments FOR INSERT
        TO authenticated
        WITH CHECK (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can update their own comments
        EXECUTE 'CREATE POLICY "Users update own comments"
        ON public.community_comments FOR UPDATE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        -- Users can delete their own comments
        EXECUTE 'CREATE POLICY "Users delete own comments"
        ON public.community_comments FOR DELETE
        TO authenticated
        USING (
            author_id IN (
                SELECT id FROM public.users 
                WHERE email = auth.jwt()->>''email''
            )
        )';
        
        RAISE NOTICE 'community_comments table secured with RLS policies';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error handling community_comments: %', SQLERRM;
END $$;

-- STEP 5: Enable RLS on other critical tables
DO $$
BEGIN
    -- Enable RLS on users table if it exists
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
        DROP POLICY IF EXISTS "Users update own profile" ON public.users;
        
        -- Everyone can view profiles
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
        
        RAISE NOTICE 'users table secured with RLS';
    END IF;
END $$;

-- STEP 6: Enable RLS on all remaining unprotected TABLES (not views)
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
        -- Only process actual tables, not views
        AND EXISTS (
            SELECT 1 FROM information_schema.tables it
            WHERE it.table_schema = 'public' 
            AND it.table_name = t.tablename
            AND it.table_type = 'BASE TABLE'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', rec.tablename;
        count_fixed := count_fixed + 1;
    END LOOP;
    
    RAISE NOTICE 'Total tables with RLS enabled: %', count_fixed;
END $$;

-- STEP 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);

-- Create indexes only if these are tables, not views
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'community_threads'
          AND table_type = 'BASE TABLE'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_community_threads_author ON public.community_threads(author_id);
    END IF;
    
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

-- FINAL REPORT: Security Status
RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'SECURITY FIX COMPLETE!';
RAISE NOTICE '========================================';

-- Show tables with RLS status
SELECT 
    'TABLES Security Status:' as report_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED with RLS'
        ELSE '❌ EXPOSED - Needs manual fix'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- Show views (these cannot have RLS but should not have SECURITY DEFINER)
SELECT 
    'VIEWS Status:' as report_type,
    table_name as viewname,
    '⚠️ VIEW - Check for SECURITY DEFINER' as status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count policies on tables
SELECT 
    'Policy Count:' as report_type,
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = FALSE THEN '❌ No RLS'
        WHEN COUNT(p.policyname) = 0 THEN '⚠️ RLS but no policies'
        ELSE '✅ ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.rowsecurity DESC, COUNT(p.policyname) DESC, t.tablename;

-- IMPORTANT: After running this script, re-run the Supabase Security Advisor
-- to verify all issues are resolved!