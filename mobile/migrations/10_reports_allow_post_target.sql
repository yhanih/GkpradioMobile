-- Allow reporting community posts (public.posts) via reports.target_type = 'post'.
-- Apply after public.reports exists (see 01_ugc_safety.sql or UGC_FINAL_MIGRATION.sql).

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
        'post'
      )
    );
END
$$;
