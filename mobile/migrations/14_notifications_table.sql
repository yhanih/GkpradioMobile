-- In-app notification history table.
-- Stores a record every time someone likes, prays for, or replies to another user's post.

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('like', 'pray', 'comment')),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid        REFERENCES public.comments(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_post_idx
  ON public.notifications(post_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications
      FOR SELECT
      USING (auth.uid() = recipient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications
      FOR UPDATE
      USING (auth.uid() = recipient_id)
      WITH CHECK (auth.uid() = recipient_id);
  END IF;

  -- The system (triggers with SECURITY DEFINER) inserts rows, but we still
  -- need a permissive policy so the trigger function can write.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications"
      ON public.notifications
      FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;
