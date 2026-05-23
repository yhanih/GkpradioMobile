-- Trigger functions that fire AFTER INSERT on post_reactions and comments
-- to send push notifications to the post author via the send-notification Edge Function.
--
-- Requires the pg_net extension (pre-installed on Supabase).
-- The Edge Function URL and service-role key are read from Supabase vault / config.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

------------------------------------------------------------------------
-- Helper: build the Edge Function URL from the project's Supabase URL.
-- We read the setting that Supabase populates automatically.
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_edge_function_url(fn_name text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT
    concat(
      rtrim(current_setting('app.settings.supabase_url', true), '/'),
      '/functions/v1/',
      fn_name
    );
$$;

------------------------------------------------------------------------
-- TRIGGER A: post_reactions → notify post author of like / pray
------------------------------------------------------------------------
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

  -- Post owner push token
  SELECT push_token
    INTO v_owner_token
    FROM public.profiles
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
    v_fn_url := public.get_edge_function_url('send-notification');
    v_service_key := coalesce(
      current_setting('app.settings.service_role_key', true),
      current_setting('supabase.service_role_key', true)
    );

    PERFORM extensions.http_post(
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
                 )::text,
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_service_key
                 )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_reaction ON public.post_reactions;
CREATE TRIGGER trg_notify_on_reaction
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();

------------------------------------------------------------------------
-- TRIGGER B: comments → notify post author of reply
------------------------------------------------------------------------
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

  -- Post owner push token
  SELECT push_token
    INTO v_owner_token
    FROM public.profiles
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
    v_fn_url := public.get_edge_function_url('send-notification');
    v_service_key := coalesce(
      current_setting('app.settings.service_role_key', true),
      current_setting('supabase.service_role_key', true)
    );

    PERFORM extensions.http_post(
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
                 )::text,
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_service_key
                 )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();
