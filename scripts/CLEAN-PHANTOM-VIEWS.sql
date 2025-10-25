-- ============================================
-- CLEAN UP PHANTOM VIEWS AND SECURITY ISSUES
-- ============================================
-- Run this to clean up any phantom views that Security Advisor detects

-- Option 1: Try to drop with various name formats
DO $$
BEGIN
    -- Try different naming conventions
    EXECUTE 'DROP VIEW IF EXISTS public.community_threads CASCADE';
    EXECUTE 'DROP VIEW IF EXISTS public.community_comments CASCADE';
    EXECUTE 'DROP VIEW IF EXISTS public."community_threads" CASCADE';
    EXECUTE 'DROP VIEW IF EXISTS public."community_comments" CASCADE';
    EXECUTE 'DROP VIEW IF EXISTS public."community-threads" CASCADE';
    EXECUTE 'DROP VIEW IF EXISTS public."community-comments" CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Views do not exist or already dropped: %', SQLERRM;
END $$;

-- Check what views actually exist
SELECT 
    schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Check for orphaned view definitions in system catalogs
SELECT 
    n.nspname as schema,
    c.relname as name,
    c.relkind as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN ('community_threads', 'community_comments');

-- Force refresh of system catalogs (sometimes helps with phantom objects)
ANALYZE;

-- Final status report
SELECT 
    'Cleanup complete. Views remaining:' as status,
    COUNT(*) as view_count
FROM pg_views
WHERE schemaname = 'public';