-- Add push_token column to users table for push notification support
-- This migration adds the push_token column that the app uses to store Expo push tokens

-- Add push_token column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.push_token IS 'Expo push notification token for sending push notifications to this user';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
WHERE push_token IS NOT NULL;









