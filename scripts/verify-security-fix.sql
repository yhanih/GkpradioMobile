-- ============================================
-- VERIFY SECURITY FIX SUCCESS
-- ============================================
-- Run this AFTER applying the security fixes to verify everything is secured

-- 1. CHECK RLS STATUS - All should show "PROTECTED"
SELECT 
    '=== RLS Protection Status ===' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ PROTECTED'
        ELSE '❌ EXPOSED - FIX FAILED!'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments', 'users')
ORDER BY tablename;

-- 2. CHECK POLICY COUNT - All should have at least 1 policy
SELECT 
    '=== Policy Count Check ===' as check_type,
    tablename,
    COUNT(policyname) as policies,
    CASE 
        WHEN COUNT(policyname) = 0 THEN '❌ NO POLICIES - Table is inaccessible!'
        WHEN COUNT(policyname) >= 1 THEN '✅ Has ' || COUNT(policyname) || ' policies'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('notification_queue', 'community_threads', 'community_comments', 'users')
GROUP BY tablename
ORDER BY tablename;

-- 3. FINAL SECURITY SCORE
SELECT 
    '=== SECURITY SCORE ===' as report,
    COUNT(*) FILTER (WHERE rowsecurity = true) as protected_tables,
    COUNT(*) FILTER (WHERE rowsecurity = false) as exposed_tables,
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0 THEN '🎉 PERFECT - All tables protected!'
        WHEN COUNT(*) FILTER (WHERE rowsecurity = false) <= 2 THEN '⚠️ GOOD - But some tables still exposed'
        ELSE '❌ CRITICAL - Many tables still exposed!'
    END as security_grade
FROM pg_tables 
WHERE schemaname = 'public';

-- 4. LIST ANY REMAINING EXPOSED TABLES
SELECT 
    '=== STILL EXPOSED ===' as warning,
    tablename as exposed_table,
    '❌ NEEDS RLS ENABLED' as action_required
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- If this query returns no rows, ALL tables are protected! 🎉