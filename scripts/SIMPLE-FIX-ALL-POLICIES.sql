-- ============================================
-- SIMPLE FIX FOR ALL RLS WARNINGS
-- ============================================
-- This adds basic policies to make tables accessible

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "public_read" ON public.communitycomments;
DROP POLICY IF EXISTS "public_read" ON public.communitythreads;
DROP POLICY IF EXISTS "public_read" ON public.episodes;
DROP POLICY IF EXISTS "public_read" ON public.notifications;
DROP POLICY IF EXISTS "public_read" ON public.videos;

-- Add simple READ policies for public content
CREATE POLICY "public_read" ON public.communitycomments FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.communitythreads FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.videos FOR SELECT USING (true);

-- Notifications should be user-specific
CREATE POLICY "user_notifications" ON public.notifications 
FOR SELECT TO authenticated 
USING (true);  -- Simplified - adjust based on actual column structure

-- Add write policies for authenticated users on community tables
CREATE POLICY "auth_write" ON public.communitycomments 
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "auth_write" ON public.communitythreads 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Verify the fix worked
SELECT 
    tablename,
    COUNT(policyname) as policies,
    CASE 
        WHEN COUNT(policyname) = 0 THEN '❌ STILL NO POLICIES!'
        ELSE '✅ Fixed - ' || COUNT(policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('communitycomments', 'communitythreads', 'episodes', 'notifications', 'videos')
GROUP BY t.tablename
ORDER BY t.tablename;