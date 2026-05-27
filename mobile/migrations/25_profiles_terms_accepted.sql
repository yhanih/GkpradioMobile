-- Record when a user accepts Terms of Service / Community Guidelines (App Store 1.2 UGC).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'When the user accepted in-app Terms of Service & Community Guidelines (18+ UGC gate).';
