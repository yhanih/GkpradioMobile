-- Migration 31: Secure Notifications Upgrade
-- 1. Create a secure private settings table for push tokens
-- 2. Migrate existing push tokens
-- 3. Drop push_token column from public.profiles
-- 4. Update trigger functions to pull tokens from private_user_settings
-- 5. Tighten notifications table RLS policies

-- ============================================================================
-- 1. CREATE SECURE PRIVATE USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.private_user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.private_user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotency)
DROP POLICY IF EXISTS "users_select_own_settings" ON public.private_user_settings;
DROP POLICY IF EXISTS "users_insert_own_settings" ON public.private_user_settings;
DROP POLICY IF EXISTS "users_update_own_settings" ON public.private_user_settings;

-- RLS Policies: Owner access only
CREATE POLICY "users_select_own_settings" ON public.private_user_settings
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own_settings" ON public.private_user_settings
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_settings" ON public.private_user_settings
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. MIGRATE EXISTING PUSH TOKENS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'push_token'
    ) THEN
        INSERT INTO public.private_user_settings (id, push_token)
        SELECT id, push_token 
          FROM public.profiles
         WHERE push_token IS NOT NULL
        ON CONFLICT (id) DO UPDATE SET push_token = EXCLUDED.push_token;
    END IF;
END
$$;

-- ============================================================================
-- 3. DROP PUSH_TOKEN COLUMN FROM PROFILES
-- ============================================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS push_token;

-- ============================================================================
-- 4. UPDATE DATABASE TRIGGER FUNCTIONS
-- ============================================================================

-- Function: notify_on_reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post        record;
  v_actor_name  text;
  v_owner_token text;
  v_title       text;
  v_body        text;
  v_post_label  text;
  v_fn_url      text;
  v_service_key text;
BEGIN
  -- Look up the post to get the author
  SELECT id, author_id, post_type, title
    INTO v_post
    FROM public.posts
   WHERE id = NEW.post_id;

  IF v_post IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't notify yourself
  IF NEW.user_id = v_post.author_id THEN
    RETURN NEW;
  END IF;

  -- Actor display name
  SELECT coalesce(full_name, 'Someone')
    INTO v_actor_name
    FROM public.profiles
   WHERE id = NEW.user_id;

  -- Post owner push token (from private_user_settings)
  SELECT push_token
    INTO v_owner_token
    FROM public.private_user_settings
   WHERE id = v_post.author_id;

  -- Friendly label for the post type
  v_post_label := CASE
    WHEN v_post.post_type = 'prayer' THEN 'prayer request'
    ELSE 'post'
  END;

  -- Build notification text
  IF NEW.reaction_type = 'pray' THEN
    v_title := 'New Prayer';
    v_body  := v_actor_name || ' prayed for your ' || v_post_label;
  ELSE
    v_title := 'New Like';
    v_body  := v_actor_name || ' liked your ' || v_post_label;
  END IF;

  -- Insert in-app notification record
  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, message)
  VALUES (v_post.author_id, NEW.user_id, NEW.reaction_type, NEW.post_id, v_body);

  -- Send push if the owner has a token
  IF v_owner_token IS NOT NULL THEN
    BEGIN
      v_fn_url := public.get_edge_function_url('send-notification');
      
      -- Retrieve key from vault
      SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
      IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnandwZWJ5Z3pybmtjYWZsY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc5MjEzNSwiZXhwIjoyMDkxMzY4MTM1fQ.pugrfvpc-cfiRofni1h1PvrgLCvnS9JRl5hApQPHUB0';
      END IF;

      PERFORM net.http_post(
        url     := v_fn_url,
        body    := jsonb_build_object(
                     'to',    v_owner_token,
                     'title', v_title,
                     'body',  v_body,
                     'sound', 'default',
                     'data',  jsonb_build_object(
                                'post_id', NEW.post_id::text,
                                'type',    NEW.reaction_type
                              )
                   ),
        headers := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer ' || v_service_key
                   )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push notification failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: notify_on_comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post        record;
  v_actor_name  text;
  v_owner_token text;
  v_title       text;
  v_body        text;
  v_post_label  text;
  v_fn_url      text;
  v_service_key text;
BEGIN
  -- Look up the post
  SELECT id, author_id, post_type, title
    INTO v_post
    FROM public.posts
   WHERE id = NEW.post_id;

  IF v_post IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't notify yourself
  IF NEW.author_id = v_post.author_id THEN
    RETURN NEW;
  END IF;

  -- Actor display name
  SELECT coalesce(full_name, 'Someone')
    INTO v_actor_name
    FROM public.profiles
   WHERE id = NEW.author_id;

  -- Post owner push token (from private_user_settings)
  SELECT push_token
    INTO v_owner_token
    FROM public.private_user_settings
   WHERE id = v_post.author_id;

  v_post_label := CASE
    WHEN v_post.post_type = 'prayer' THEN 'prayer request'
    ELSE 'post'
  END;

  v_title := 'New Reply';
  v_body  := v_actor_name || ' replied to your ' || v_post_label;

  -- Insert in-app notification record
  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id, message)
  VALUES (v_post.author_id, NEW.author_id, 'comment', NEW.post_id, NEW.id, v_body);

  -- Send push if the owner has a token
  IF v_owner_token IS NOT NULL THEN
    BEGIN
      v_fn_url := public.get_edge_function_url('send-notification');
      
      -- Retrieve key from vault
      SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
      IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnandwZWJ5Z3pybmtjYWZsY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc5MjEzNSwiZXhwIjoyMDkxMzY4MTM1fQ.pugrfvpc-cfiRofni1h1PvrgLCvnS9JRl5hApQPHUB0';
      END IF;

      PERFORM net.http_post(
        url     := v_fn_url,
        body    := jsonb_build_object(
                     'to',    v_owner_token,
                     'title', v_title,
                     'body',  v_body,
                     'sound', 'default',
                     'data',  jsonb_build_object(
                                'post_id',    NEW.post_id::text,
                                'comment_id', NEW.id::text,
                                'type',       'comment'
                              )
                   ),
        headers := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer ' || v_service_key
                   )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push notification failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: notify_on_discussion_post
CREATE OR REPLACE FUNCTION public.notify_on_discussion_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name  text;
  v_title       text;
  v_body        text;
  v_fn_url      text;
  v_service_key text;
  v_recipient   record;
BEGIN
  IF coalesce(NEW.post_type, 'discussion') <> 'discussion' THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(full_name, 'Someone')
    INTO v_actor_name
    FROM public.profiles
   WHERE id = NEW.author_id;

  v_title := 'New Discussion';
  IF NEW.title IS NOT NULL AND btrim(NEW.title) <> '' THEN
    v_body := v_actor_name || ' started: ' || left(btrim(NEW.title), 80);
  ELSE
    v_body := v_actor_name || ' posted a new discussion';
  END IF;

  FOR v_recipient IN
    SELECT p.id, s.push_token
      FROM public.profiles p
      LEFT JOIN public.private_user_settings s ON p.id = s.id
     WHERE p.id IS DISTINCT FROM NEW.author_id
  LOOP
    -- Insert in-app notifications first
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, message)
    VALUES (v_recipient.id, NEW.author_id, 'discussion', NEW.id, v_body);

    IF v_recipient.push_token IS NOT NULL THEN
      BEGIN
        v_fn_url := public.get_edge_function_url('send-notification');
        
        -- Retrieve key from vault
        SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
        IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
          v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnandwZWJ5Z3pybmtjYWZsY3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc5MjEzNSwiZXhwIjoyMDkxMzY4MTM1fQ.pugrfvpc-cfiRofni1h1PvrgLCvnS9JRl5hApQPHUB0';
        END IF;

        PERFORM net.http_post(
          url     := v_fn_url,
          body    := jsonb_build_object(
                       'to',    v_recipient.push_token,
                       'title', v_title,
                       'body',  v_body,
                       'sound', 'default',
                       'data',  jsonb_build_object(
                                  'post_id', NEW.id::text,
                                  'type',    'discussion'
                                )
                     ),
          headers := jsonb_build_object(
                       'Content-Type',  'application/json',
                       'Authorization', 'Bearer ' || v_service_key
                     )
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Push notification failed: %', SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. SECURE NOTIFICATIONS TABLE
-- ============================================================================
-- Remove the insecure global insert policy.
-- Triggers run under SECURITY DEFINER and bypass RLS constraints during execution.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
