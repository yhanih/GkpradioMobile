-- Add push_token column to profiles table for push notification support
-- This migration adds the push_token column that the app uses to store Expo push tokens

-- Add push_token column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.push_token IS 'Expo push notification token for sending push notifications to this user';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(push_token) 
WHERE push_token IS NOT NULL;












