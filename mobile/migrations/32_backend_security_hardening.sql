-- Migration 32: Backend Security Hardening
-- 1. Harden is_admin_user() to query auth.users app/user metadata securely
-- 2. Create privacy-preserving public.users view
-- 3. Harden live_events table management
-- 4. Harden live_chat_messages table inserts
-- 5. Harden posts, comments, post_likes, post_reactions, live_radio_messages table insertion roles
-- 6. Clean up obsolete RLS policies

-- ============================================================================
-- 1. HARDEN IS_ADMIN_USER() FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND (
        (raw_app_meta_data->>'role' = 'admin') 
        OR (raw_user_meta_data->>'role' = 'admin')
      )
  );
END;
$$;

-- Set correct permissions
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

-- ============================================================================
-- 2. CREATE PRIVACY-PRESERVING USERS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW public.users AS
SELECT 
  u.id,
  p.full_name,
  CASE 
    WHEN (public.is_admin_user() OR auth.uid() = u.id) THEN u.email 
    ELSE NULL 
  END AS email,
  u.created_at,
  CASE 
    WHEN (public.is_admin_user() OR auth.uid() = u.id) THEN COALESCE(u.raw_app_meta_data->>'role', 'user')
    ELSE 'user' 
  END AS role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- Grant select on users view
GRANT SELECT ON public.users TO anon, authenticated;

-- ============================================================================
-- 3. HARDEN LIVE_EVENTS TABLE MANAGEMENT
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can manage live events" ON public.live_events;

CREATE POLICY "Admins can manage live events" ON public.live_events
    FOR ALL
    TO authenticated
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- ============================================================================
-- 4. HARDEN LIVE_CHAT_MESSAGES TABLE INSERTS
-- ============================================================================
DROP POLICY IF EXISTS "live_chat_insert" ON public.live_chat_messages;

CREATE POLICY "live_chat_insert" ON public.live_chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND is_verified = false
    );

-- ============================================================================
-- 5. HARDEN OTHER INSERTION POLICIES
-- ============================================================================

-- posts
DROP POLICY IF EXISTS "posts_insert_auth" ON public.posts;
CREATE POLICY "posts_insert_auth" ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

-- comments
DROP POLICY IF EXISTS "comments_insert_auth" ON public.comments;
CREATE POLICY "comments_insert_auth" ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

-- post_likes
DROP POLICY IF EXISTS "likes_insert_own" ON public.post_likes;
CREATE POLICY "likes_insert_own" ON public.post_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- post_reactions
DROP POLICY IF EXISTS "Users can add own post reactions" ON public.post_reactions;
CREATE POLICY "Users can add own post reactions" ON public.post_reactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- live_radio_messages
DROP POLICY IF EXISTS "live_radio_messages_insert_own_row" ON public.live_radio_messages;
CREATE POLICY "live_radio_messages_insert_own_row" ON public.live_radio_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- private_user_settings
DROP POLICY IF EXISTS "users_insert_own_settings" ON public.private_user_settings;
CREATE POLICY "users_insert_own_settings" ON public.private_user_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 6. CLEAN UP OBSOLETE RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own push_token" ON public.profiles;
