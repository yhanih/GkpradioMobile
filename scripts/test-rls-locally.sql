-- ============================================
-- TEST RLS FIXES IN LOCAL DEVELOPMENT DATABASE
-- ============================================
-- Run this in your local development database first

-- Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments')
ORDER BY tablename;

-- Enable RLS on notification_queue (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'notification_queue'
    ) THEN
        EXECUTE 'ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS enabled on notification_queue';
        
        -- Create a simple test policy
        EXECUTE 'DROP POLICY IF EXISTS "Test policy for notification_queue" ON public.notification_queue';
        EXECUTE 'CREATE POLICY "Test policy for notification_queue" ON public.notification_queue FOR SELECT USING (true)';
        RAISE NOTICE 'Test policy created for notification_queue';
    ELSE
        RAISE NOTICE 'notification_queue table does not exist';
    END IF;
END $$;

-- Test the changes
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED'
        ELSE '❌ EXPOSED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments')
ORDER BY tablename;