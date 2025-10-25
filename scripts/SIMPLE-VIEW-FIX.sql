-- ============================================
-- SIMPLE FIX FOR SECURITY DEFINER VIEWS
-- ============================================
-- Execute these commands one by one in Supabase SQL Editor

-- Step 1: Drop the problematic views
DROP VIEW IF EXISTS public.community_threads CASCADE;
DROP VIEW IF EXISTS public.community_comments CASCADE;

-- Step 2: Check if underlying tables exist
-- If they exist, we'll use them directly instead of views
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'community_%'
ORDER BY table_name;

-- Step 3: If you see BASE TABLE results above, enable RLS on them:
-- (Skip this if they don't exist or are already protected)

-- For community_threads table (if exists):
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View all threads" ON public.community_threads FOR SELECT USING (true);
CREATE POLICY "Users create threads" ON public.community_threads FOR INSERT TO authenticated 
    WITH CHECK (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "Users update own" ON public.community_threads FOR UPDATE TO authenticated 
    USING (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "Users delete own" ON public.community_threads FOR DELETE TO authenticated 
    USING (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));

-- For community_comments table (if exists):
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View all comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON public.community_comments FOR INSERT TO authenticated 
    WITH CHECK (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "Users update own" ON public.community_comments FOR UPDATE TO authenticated 
    USING (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "Users delete own" ON public.community_comments FOR DELETE TO authenticated 
    USING (author_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));

-- Step 4: Verify the views are gone
SELECT 
    'Views removed:' as status,
    COUNT(*) as remaining_views
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name IN ('community_threads', 'community_comments');

-- Step 5: Check final security status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Protected with RLS'
        ELSE '❌ Not protected'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE 'community_%'
ORDER BY tablename;