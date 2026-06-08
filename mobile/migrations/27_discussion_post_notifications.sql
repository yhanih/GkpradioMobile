-- Notify community members when someone posts a new discussion (not prayers).
-- Extends notifications.type and adds SECURITY DEFINER trigger (same pattern as migration 15).

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'pray', 'comment', 'discussion'));

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
  LOOP
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

DROP TRIGGER IF EXISTS trg_notify_on_discussion_post ON public.posts;
CREATE TRIGGER trg_notify_on_discussion_post
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_discussion_post();
