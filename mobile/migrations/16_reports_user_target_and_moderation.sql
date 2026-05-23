-- Report user targets, moderation queue columns (status / reviewed_at), and admin access to reports.
-- Apply after public.reports exists (see 01_ugc_safety.sql, 10_reports_allow_post_target.sql).
-- Greenfield DBs with no reports table: run 17_ugc_reports_blocked_users_moderation.sql first (or
-- instead of 01+10+this), matching production bootstrap.

-- Returns true when the current auth user is an admin/moderator (web-admin or profiles.role).
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

  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

  UPDATE public.reports SET status = 'pending' WHERE status IS NULL OR status = '';

  ALTER TABLE public.reports ALTER COLUMN status SET DEFAULT 'pending';
  ALTER TABLE public.reports ALTER COLUMN status SET NOT NULL;
  ALTER TABLE public.reports
    ADD CONSTRAINT reports_status_check
    CHECK (status IN ('pending', 'resolved'));

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
        'user'
      )
    );
END
$$;

-- Admin policies (combined with existing per-user policies via OR).
DROP POLICY IF EXISTS "Admins can read all reports" ON public.reports;
CREATE POLICY "Admins can read all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
