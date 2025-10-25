-- ============================================
-- INVESTIGATE AND FIX SECURITY DEFINER ISSUES
-- ============================================

-- STEP 1: Find ALL views in your database
SELECT 
    'VIEWS IN DATABASE:' as report,
    table_name as view_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
ORDER BY table_name;

-- STEP 2: Find views with SECURITY DEFINER property
-- This query will show which views actually have the security issue
SELECT 
    'VIEWS WITH SECURITY DEFINER:' as report,
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%SECURITY DEFINER%';

-- STEP 3: Alternative check for security definer views
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    pg_get_userbyid(c.relowner) as owner,
    CASE 
        WHEN c.relkind = 'v' THEN 'VIEW'
        WHEN c.relkind = 'm' THEN 'MATERIALIZED VIEW'
    END as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v', 'm')
  AND n.nspname = 'public';

-- STEP 4: Check if these are actually tables (not views)
SELECT 
    'TABLES WITH SIMILAR NAMES:' as report,
    tablename as table_name,
    rowsecurity as has_rls
FROM pg_tables 
WHERE schemaname = 'public'
  AND (tablename LIKE '%community%' OR tablename LIKE '%thread%' OR tablename LIKE '%comment%')
ORDER BY tablename;

-- STEP 5: Drop any problematic views if they exist
-- These commands will not error if the views don't exist
DROP VIEW IF EXISTS public.community_threads CASCADE;
DROP VIEW IF EXISTS public.community_comments CASCADE;

-- STEP 6: Check for any remaining views with underscores vs hyphens
DROP VIEW IF EXISTS public."community-threads" CASCADE;
DROP VIEW IF EXISTS public."community-comments" CASCADE;
DROP VIEW IF EXISTS public.community_thread CASCADE;
DROP VIEW IF EXISTS public.community_comment CASCADE;

-- STEP 7: Final check - what's left?
SELECT 
    'REMAINING VIEWS:' as final_report,
    COUNT(*) as view_count
FROM information_schema.views
WHERE table_schema = 'public';

-- STEP 8: List any remaining views
SELECT 
    table_name as remaining_views
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;