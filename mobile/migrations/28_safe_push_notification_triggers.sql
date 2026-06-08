-- Migration: Make push notification triggers resilient to pg_net/Edge Function errors
-- This migration updates the trigger functions so that if a push notification fails
-- (e.g. if the send-notification Edge Function is unreachable or the service key is missing),
-- the overall database transaction (comment insert, post insert, like/pray reaction) is NOT rolled back.

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
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push notification failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;


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
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push notification failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;


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
    SELECT id, push_token
      FROM public.profiles
     WHERE id IS DISTINCT FROM NEW.author_id
  -- Loop over push notifications safely
  LOOP
    -- Insert in-app notifications first
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, message)
    VALUES (v_recipient.id, NEW.author_id, 'discussion', NEW.id, v_body);

    IF v_recipient.push_token IS NOT NULL THEN
      BEGIN
        v_fn_url := public.get_edge_function_url('send-notification');
        v_service_key := coalesce(
          current_setting('app.settings.service_role_key', true),
          current_setting('supabase.service_role_key', true)
        );

        PERFORM extensions.http_post(
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
                     )::text,
          headers := jsonb_build_object(
                       'Content-Type',  'application/json',
                       'Authorization', 'Bearer ' || v_service_key
                     )::jsonb
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Push notification failed: %', SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
