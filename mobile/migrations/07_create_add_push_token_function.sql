-- Create a function to add push_token column if it doesn't exist
-- This function can be called via RPC to automate the migration

CREATE OR REPLACE FUNCTION add_push_token_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'push_token'
  ) THEN
    ALTER TABLE public.users ADD COLUMN push_token TEXT;
    
    COMMENT ON COLUMN public.users.push_token IS 'Expo push notification token for sending push notifications to this user';
    
    CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
    WHERE push_token IS NOT NULL;
  END IF;
END;
$$;












