-- Add push_token column to profiles table for Expo push notification tokens.
-- The app references profiles (not users) everywhere, so tokens belong here.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN public.profiles.push_token
IS 'Expo push notification token for sending push notifications to this user';

CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON public.profiles(push_token)
WHERE push_token IS NOT NULL;

-- Allow authenticated users to update their own push_token.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Users can update own push_token'
  ) THEN
    CREATE POLICY "Users can update own push_token"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
