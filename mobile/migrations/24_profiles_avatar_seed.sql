-- User's chosen character within the app Thumbs avatar style (DiceBear seed)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_seed TEXT;

COMMENT ON COLUMN public.profiles.avatar_seed IS
  'DiceBear seed for Thumbs style — same art style, different character per seed.';

-- Keep style column fixed to thumbs for any legacy readers
UPDATE public.profiles SET avatar_style = 'thumbs' WHERE avatar_style IS DISTINCT FROM 'thumbs';
