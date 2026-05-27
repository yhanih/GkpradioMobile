-- User-selected DiceBear avatar style (see mobile/src/components/ui/avatar/dicebearStyles.ts)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_style TEXT NOT NULL DEFAULT 'thumbs';

COMMENT ON COLUMN public.profiles.avatar_style IS
  'DiceBear style id when no avatar_url upload (e.g. thumbs, lorelei, notionists).';
