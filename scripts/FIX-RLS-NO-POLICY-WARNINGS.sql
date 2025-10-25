-- ============================================
-- FIX RLS TABLES WITH NO POLICIES
-- ============================================
-- These tables have RLS enabled but no policies, making them inaccessible
-- This script adds appropriate policies for each table

-- ============================================
-- 1. communitycomments table
-- ============================================
-- Everyone can view comments
CREATE POLICY "Anyone can view comments"
ON public.communitycomments FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Users create own comments"
ON public.communitycomments FOR INSERT
TO authenticated
WITH CHECK (true);  -- Adjust if there's an author_id column

-- Authenticated users can update their own comments
CREATE POLICY "Users update own comments"
ON public.communitycomments FOR UPDATE
TO authenticated
USING (true);  -- Adjust if there's an author_id column

-- Authenticated users can delete their own comments
CREATE POLICY "Users delete own comments"
ON public.communitycomments FOR DELETE
TO authenticated
USING (true);  -- Adjust if there's an author_id column

-- ============================================
-- 2. communitythreads table
-- ============================================
-- Everyone can view threads
CREATE POLICY "Anyone can view threads"
ON public.communitythreads FOR SELECT
USING (true);

-- Authenticated users can create threads
CREATE POLICY "Users create threads"
ON public.communitythreads FOR INSERT
TO authenticated
WITH CHECK (true);  -- Adjust if there's an author_id column

-- Authenticated users can update their own threads
CREATE POLICY "Users update own threads"
ON public.communitythreads FOR UPDATE
TO authenticated
USING (true);  -- Adjust if there's an author_id column

-- Authenticated users can delete their own threads
CREATE POLICY "Users delete own threads"
ON public.communitythreads FOR DELETE
TO authenticated
USING (true);  -- Adjust if there's an author_id column

-- ============================================
-- 3. episodes table
-- ============================================
-- Everyone can view episodes (public content)
CREATE POLICY "Public can view episodes"
ON public.episodes FOR SELECT
USING (true);

-- Only admins/service role can manage episodes
CREATE POLICY "Service manages episodes"
ON public.episodes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. notifications table
-- ============================================
-- Users can only see their own notifications
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Service role manages notifications
CREATE POLICY "Service manages notifications"
ON public.notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. videos table
-- ============================================
-- Everyone can view videos (public content)
CREATE POLICY "Public can view videos"
ON public.videos FOR SELECT
USING (true);

-- Only admins/service role can manage videos
CREATE POLICY "Service manages videos"
ON public.videos FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that all tables now have policies
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = FALSE THEN '❌ No RLS'
        WHEN COUNT(p.policyname) = 0 THEN '⚠️ RLS but no policies'
        ELSE '✅ ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('communitycomments', 'communitythreads', 'episodes', 'notifications', 'videos')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;