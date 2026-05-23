-- Tighten INSERT RLS: require auth.uid() = user_id (not merely "logged in").
-- Without this, any authenticated client could insert rows attributed to another user_id.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prayer_requests'
  ) THEN
    DROP POLICY IF EXISTS "Authenticated users can insert prayer requests" ON public.prayer_requests;
    CREATE POLICY "Authenticated users can insert prayer requests"
      ON public.prayer_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'testimonies'
  ) THEN
    DROP POLICY IF EXISTS "Authenticated users can insert testimonies" ON public.testimonies;
    CREATE POLICY "Authenticated users can insert testimonies"
      ON public.testimonies
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
