-- Live radio chat: allow reports.target_type = 'live_chat_message' and admin/user DELETE on messages.
-- Requires public.reports and public.is_admin_user() (see 16 or 17).

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'users'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    ) THEN
      RETURN true;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'reports'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
  ALTER TABLE public.reports
    ADD CONSTRAINT reports_target_type_check
    CHECK (
      target_type IN (
        'prayer_request',
        'testimony',
        'comment',
        'episode',
        'video',
        'post',
        'user',
        'live_chat_message'
      )
    );
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'live_radio_messages'
  ) THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Users can delete own live_radio_messages" ON public.live_radio_messages;
  CREATE POLICY "Users can delete own live_radio_messages"
    ON public.live_radio_messages FOR DELETE
    USING (auth.uid() = author_id);

  DROP POLICY IF EXISTS "Admins can delete live_radio_messages" ON public.live_radio_messages;
  CREATE POLICY "Admins can delete live_radio_messages"
    ON public.live_radio_messages FOR DELETE
    USING (public.is_admin_user());
END
$$;
