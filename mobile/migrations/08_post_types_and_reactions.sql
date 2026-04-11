-- Add post_type to distinguish prayer and discussion posts.
ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS post_type text;

-- Backfill existing rows from current category semantics.
UPDATE public.posts
SET post_type = CASE
  WHEN category IN ('Prayer Requests', 'Pray for Others') THEN 'prayer'
  ELSE 'discussion'
END
WHERE post_type IS NULL
  AND category IS NOT NULL;

-- Constrain allowed values while tolerating legacy nulls during rollout.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'post_type'
  ) THEN
    ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_post_type_check;

    ALTER TABLE public.posts
    ADD CONSTRAINT posts_post_type_check
    CHECK (post_type IN ('prayer', 'discussion') OR post_type IS NULL);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS posts_post_type_idx ON public.posts(post_type);

-- Typed reactions: pray vs like.
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'pray')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS post_reactions_type_idx ON public.post_reactions(reaction_type);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_reactions'
      AND policyname = 'Anyone can view post reactions'
  ) THEN
    CREATE POLICY "Anyone can view post reactions"
      ON public.post_reactions
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_reactions'
      AND policyname = 'Users can add own post reactions'
  ) THEN
    CREATE POLICY "Users can add own post reactions"
      ON public.post_reactions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'post_reactions'
      AND policyname = 'Users can delete own post reactions'
  ) THEN
    CREATE POLICY "Users can delete own post reactions"
      ON public.post_reactions
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Backfill legacy likes into typed reactions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'post_likes'
  ) THEN
    INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
    SELECT
      pl.post_id,
      pl.user_id,
      CASE
        WHEN p.category IN ('Prayer Requests', 'Pray for Others') THEN 'pray'
        ELSE 'like'
      END AS reaction_type
    FROM public.post_likes pl
    JOIN public.posts p ON p.id = pl.post_id
    ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;
  END IF;
END
$$;
