-- ============================================
-- FINAL FIX - ADD POLICIES TO TABLES WITH RLS
-- ============================================
-- Drops existing policies first to avoid conflicts, then creates new ones

-- 1. Fix communitycomments
DROP POLICY IF EXISTS "public_read_comments" ON public.communitycomments;
DROP POLICY IF EXISTS "auth_write_comments" ON public.communitycomments;

CREATE POLICY "public_read_comments"
ON public.communitycomments FOR SELECT
USING (true);

CREATE POLICY "auth_write_comments"
ON public.communitycomments FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Fix communitythreads
DROP POLICY IF EXISTS "public_read_threads" ON public.communitythreads;
DROP POLICY IF EXISTS "auth_write_threads" ON public.communitythreads;

CREATE POLICY "public_read_threads"
ON public.communitythreads FOR SELECT
USING (true);

CREATE POLICY "auth_write_threads"
ON public.communitythreads FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Fix episodes
DROP POLICY IF EXISTS "public_read_episodes" ON public.episodes;

CREATE POLICY "public_read_episodes"
ON public.episodes FOR SELECT
USING (true);

-- 4. Fix notifications
DROP POLICY IF EXISTS "user_read_notifications" ON public.notifications;

CREATE POLICY "user_read_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (true);

-- 5. Fix videos
DROP POLICY IF EXISTS "public_read_videos" ON public.videos;

CREATE POLICY "public_read_videos"
ON public.videos FOR SELECT
USING (true);

-- Verify all tables now have policies
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) = 0 THEN '❌ NO POLICIES - STILL WARNING!'
        ELSE '✅ FIXED - ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('communitycomments', 'communitythreads', 'episodes', 'notifications', 'videos')
GROUP BY t.tablename
ORDER BY t.tablename;