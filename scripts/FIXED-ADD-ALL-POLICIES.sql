-- ============================================
-- ADD POLICIES TO FIX RLS WARNINGS
-- ============================================
-- This adds policies to tables that have RLS but no policies

-- 1. Add policies for communitycomments
CREATE POLICY IF NOT EXISTS "public_read_comments" 
ON public.communitycomments FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "auth_write_comments" 
ON public.communitycomments FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Add policies for communitythreads
CREATE POLICY IF NOT EXISTS "public_read_threads" 
ON public.communitythreads FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "auth_write_threads" 
ON public.communitythreads FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Add policies for episodes
CREATE POLICY IF NOT EXISTS "public_read_episodes" 
ON public.episodes FOR SELECT 
USING (true);

-- 4. Add policies for notifications
CREATE POLICY IF NOT EXISTS "user_read_notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (true);

-- 5. Add policies for videos
CREATE POLICY IF NOT EXISTS "public_read_videos" 
ON public.videos FOR SELECT 
USING (true);

-- Verify the fix worked (FIXED QUERY)
SELECT 
    t.tablename,
    COUNT(p.policyname) as policies,
    CASE 
        WHEN COUNT(p.policyname) = 0 THEN '❌ STILL NO POLICIES!'
        ELSE '✅ Fixed - ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('communitycomments', 'communitythreads', 'episodes', 'notifications', 'videos')
GROUP BY t.tablename
ORDER BY t.tablename;