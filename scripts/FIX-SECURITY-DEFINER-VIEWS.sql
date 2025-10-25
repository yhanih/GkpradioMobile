-- ============================================
-- FIX SECURITY DEFINER VIEWS IN SUPABASE
-- ============================================
-- This script recreates views without SECURITY DEFINER property
-- to resolve the Security Advisor warnings

-- Step 1: Get the current view definitions and recreate them
DO $$
DECLARE
    v_definition text;
    v_exists boolean;
BEGIN
    -- Check and fix community_threads view
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'community_threads'
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Get the current view definition
        SELECT view_definition INTO v_definition
        FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'community_threads';
        
        -- Drop the old view with SECURITY DEFINER
        DROP VIEW IF EXISTS public.community_threads CASCADE;
        
        -- Recreate the view WITHOUT SECURITY DEFINER (default is SECURITY INVOKER)
        EXECUTE 'CREATE VIEW public.community_threads AS ' || v_definition;
        
        -- Grant appropriate permissions
        GRANT SELECT ON public.community_threads TO anon, authenticated;
        
        RAISE NOTICE 'community_threads view recreated without SECURITY DEFINER';
    ELSE
        RAISE NOTICE 'community_threads view does not exist';
    END IF;
    
    -- Check and fix community_comments view
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'community_comments'
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Get the current view definition
        SELECT view_definition INTO v_definition
        FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'community_comments';
        
        -- Drop the old view with SECURITY DEFINER
        DROP VIEW IF EXISTS public.community_comments CASCADE;
        
        -- Recreate the view WITHOUT SECURITY DEFINER
        EXECUTE 'CREATE VIEW public.community_comments AS ' || v_definition;
        
        -- Grant appropriate permissions
        GRANT SELECT ON public.community_comments TO anon, authenticated;
        
        RAISE NOTICE 'community_comments view recreated without SECURITY DEFINER';
    ELSE
        RAISE NOTICE 'community_comments view does not exist';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %. You may need to manually recreate the views.', SQLERRM;
END $$;

-- If the above automatic recreation fails, use these manual commands:
-- You'll need to replace the SELECT statements with the actual view definitions

-- Option 2: Manual recreation (use if automatic fails)
-- First, run this to see the current view definitions:
SELECT 
    'View: ' || table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name IN ('community_threads', 'community_comments');

-- Then use the definitions to manually recreate:
-- Example (replace with your actual view definition):
/*
-- For community_threads:
DROP VIEW IF EXISTS public.community_threads CASCADE;
CREATE VIEW public.community_threads AS
  -- [INSERT YOUR ACTUAL VIEW DEFINITION HERE]
  SELECT * FROM some_table; -- Replace with actual definition
GRANT SELECT ON public.community_threads TO anon, authenticated;

-- For community_comments:
DROP VIEW IF EXISTS public.community_comments CASCADE;
CREATE VIEW public.community_comments AS
  -- [INSERT YOUR ACTUAL VIEW DEFINITION HERE]
  SELECT * FROM some_table; -- Replace with actual definition
GRANT SELECT ON public.community_comments TO anon, authenticated;
*/

-- Step 2: Verify the fix
-- Check if views still have SECURITY DEFINER (should return 0 rows after fix)
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    CASE 
        WHEN c.relkind = 'v' THEN 'VIEW'
        WHEN c.relkind = 'm' THEN 'MATERIALIZED VIEW'
    END as type,
    CASE
        WHEN NOT c.reldefiner THEN '✅ SECURITY INVOKER (safe)'
        ELSE '❌ SECURITY DEFINER (needs fix)'
    END as security_mode
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('v', 'm')
  AND n.nspname = 'public'
  AND c.relname IN ('community_threads', 'community_comments');

-- Step 3: Alternative - Convert views to regular tables if appropriate
-- If these views are just selecting from single tables without complex logic,
-- consider using the base tables directly with RLS policies instead

-- Check what tables the views are based on:
WITH view_deps AS (
    SELECT DISTINCT
        v.table_name as view_name,
        vtu.table_name as base_table
    FROM information_schema.views v
    JOIN information_schema.view_table_usage vtu 
        ON v.table_schema = vtu.view_schema 
        AND v.table_name = vtu.view_name
    WHERE v.table_schema = 'public'
      AND v.table_name IN ('community_threads', 'community_comments')
)
SELECT 
    view_name,
    string_agg(base_table, ', ') as base_tables
FROM view_deps
GROUP BY view_name;

-- Final verification query
SELECT 
    'After running this script, the Security Advisor should show:' as result,
    '- No SECURITY DEFINER warnings for views' as expected_outcome,
    '- Views should use SECURITY INVOKER (default)' as security_model,
    '- Users permissions are properly enforced' as benefit;