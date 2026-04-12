-- Anonymous community posts: persist flag on public.posts (mobile app reads/writes is_anonymous).
-- Run in Supabase SQL Editor or your migration pipeline.
--
-- After applying: in Supabase Dashboard → Settings → API → reload the schema cache
-- if inserts/selects still fail with "could not find ... is_anonymous ... schema cache".

ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.posts.is_anonymous IS 'When true, clients hide author name/avatar in the community UI; author_id remains stored for moderation.';
