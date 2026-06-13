-- Migration 33: Backend Security Hardening V2
-- 1. Harden is_admin_user() to check raw_app_meta_data only
-- 2. Secure trigger functions by removing hardcoded fallback service key
-- 3. Mask author_id for anonymous posts via public.posts view redirect

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
      AND (raw_app_meta_data->>'role' = 'admin')
  );
END;
$$;

-- Set correct permissions
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

-- ============================================================================
-- 2. REMOVE HARDCODED FALLBACK SERVICE ROLE KEY FROM TRIGGERS
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
  SELECT id, author_id, post_type, title
    INTO v_post
    FROM public.posts
   WHERE id = NEW.post_id;

  IF v_post IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id = v_post.author_id THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(full_name, 'Someone')
    INTO v_actor_name
    FROM public.profiles
   WHERE id = NEW.user_id;

  SELECT push_token
    INTO v_owner_token
    FROM public.private_user_settings
   WHERE id = v_post.author_id;

  v_post_label := CASE
    WHEN v_post.post_type = 'prayer' THEN 'prayer request'
    ELSE 'post'
  END;

  IF NEW.reaction_type = 'pray' THEN
    v_title := 'New Prayer';
    v_body  := v_actor_name || ' prayed for your ' || v_post_label;
  ELSE
    v_title := 'New Like';
    v_body  := v_actor_name || ' liked your ' || v_post_label;
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, message)
  VALUES (v_post.author_id, NEW.user_id, NEW.reaction_type, NEW.post_id, v_body);

  IF v_owner_token IS NOT NULL THEN
    BEGIN
      v_fn_url := public.get_edge_function_url('send-notification');
      
      SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
      IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
        RAISE WARNING 'Push notification skipped: service_role_key not found in vault';
      ELSE
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
      END IF;
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
  SELECT id, author_id, post_type, title
    INTO v_post
    FROM public.posts
   WHERE id = NEW.post_id;

  IF v_post IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.author_id = v_post.author_id THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(full_name, 'Someone')
    INTO v_actor_name
    FROM public.profiles
   WHERE id = NEW.author_id;

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

  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id, message)
  VALUES (v_post.author_id, NEW.author_id, 'comment', NEW.post_id, NEW.id, v_body);

  IF v_owner_token IS NOT NULL THEN
    BEGIN
      v_fn_url := public.get_edge_function_url('send-notification');
      
      SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
      IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
        RAISE WARNING 'Push notification skipped: service_role_key not found in vault';
      ELSE
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
      END IF;
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
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, message)
    VALUES (v_recipient.id, NEW.author_id, 'discussion', NEW.id, v_body);

    IF v_recipient.push_token IS NOT NULL THEN
      BEGIN
        v_fn_url := public.get_edge_function_url('send-notification');
        
        SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
        IF v_service_key IS NULL OR btrim(v_service_key) = '' THEN
          RAISE WARNING 'Push notification skipped: service_role_key not found in vault';
        ELSE
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
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Push notification failed: %', SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. MASK AUTHOR_ID FOR ANONYMOUS POSTS (IDENTITY DE-ANONYMIZATION SHIELD)
-- ============================================================================

-- Rename the original posts table to posts_raw if not already done
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'posts_raw'
  ) THEN
    ALTER TABLE public.posts RENAME TO posts_raw;
  END IF;
END
$$;

-- Revoke direct access from public/anon/authenticated on posts_raw
REVOKE ALL ON public.posts_raw FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts_raw TO service_role;

-- Create a Secure View for public.posts
CREATE OR REPLACE VIEW public.posts AS
SELECT 
  id,
  title,
  content,
  category,
  post_type,
  is_pinned,
  created_at,
  is_anonymous,
  CASE 
    WHEN (is_anonymous = false OR auth.uid() = author_id OR public.is_admin_user()) THEN author_id
    ELSE NULL 
  END AS author_id
FROM public.posts_raw;

-- Grant access on the view to public roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO anon, authenticated;

-- Create INSTEAD OF trigger to process DML on public.posts view
CREATE OR REPLACE FUNCTION public.handle_posts_dml()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT (auth.uid() = NEW.author_id OR public.is_admin_user()) THEN
      RAISE EXCEPTION 'Permission denied: author_id must match authenticated user';
    END IF;
    
    INSERT INTO public.posts_raw (id, title, content, category, post_type, is_pinned, created_at, is_anonymous, author_id)
    VALUES (
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.title,
      NEW.content,
      NEW.category,
      NEW.post_type,
      COALESCE(NEW.is_pinned, false),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.is_anonymous, false),
      NEW.author_id
    )
    RETURNING 
      id, title, content, category, post_type, is_pinned, created_at, is_anonymous, author_id
    INTO NEW;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT (auth.uid() = OLD.author_id OR public.is_admin_user()) THEN
      RAISE EXCEPTION 'Permission denied: Cannot update another user''s post';
    END IF;
    
    IF NEW.author_id <> OLD.author_id AND NOT public.is_admin_user() THEN
      RAISE EXCEPTION 'Permission denied: Cannot change post author';
    END IF;

    UPDATE public.posts_raw
    SET
      title = NEW.title,
      content = NEW.content,
      category = NEW.category,
      post_type = NEW.post_type,
      is_pinned = NEW.is_pinned,
      is_anonymous = NEW.is_anonymous,
      author_id = NEW.author_id
    WHERE id = OLD.id;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT (auth.uid() = OLD.author_id OR public.is_admin_user()) THEN
      RAISE EXCEPTION 'Permission denied: Cannot delete another user''s post';
    END IF;
    
    DELETE FROM public.posts_raw WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on the view
DROP TRIGGER IF EXISTS trg_posts_dml ON public.posts;
CREATE TRIGGER trg_posts_dml
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_posts_dml();
