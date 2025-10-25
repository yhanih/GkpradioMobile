-- Simplified Fix for Table and Column Name Mismatches
-- Run each section separately in Supabase Dashboard SQL Editor

-- =============================================
-- SECTION 1: Check what tables and columns exist
-- =============================================
-- Run this first to see what you have:
SELECT 'Existing tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'communitythreads', 
  'communitycomments', 
  'videos', 
  'episodes',
  'notification_queue',
  'notifications',
  'sponsors',
  'users'
)
ORDER BY table_name;

-- Check columns in community tables
SELECT 'Community table columns:' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('communitythreads', 'communitycomments')
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- =============================================
-- SECTION 2: Create notification_queue table only
-- =============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID,  -- Changed to UUID to match Supabase Auth
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SECTION 3: Create simple community views
-- =============================================
-- Only create view if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communitythreads') THEN
    DROP VIEW IF EXISTS community_threads CASCADE;
    
    -- Create a minimal view with only essential columns
    CREATE VIEW community_threads AS 
    SELECT * FROM communitythreads;
    
    RAISE NOTICE 'Created community_threads view as passthrough to communitythreads table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communitycomments') THEN
    DROP VIEW IF EXISTS community_comments CASCADE;
    
    -- Create a minimal view with only essential columns
    CREATE VIEW community_comments AS 
    SELECT * FROM communitycomments;
    
    RAISE NOTICE 'Created community_comments view as passthrough to communitycomments table';
  END IF;
END $$;

-- =============================================
-- SECTION 4: Fix videos table timestamps
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'created_at') THEN
      -- Check for various naming conventions and add if none exist
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'createdat') THEN
        ALTER TABLE videos RENAME COLUMN createdat TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'createdAt') THEN
        ALTER TABLE videos RENAME COLUMN "createdAt" TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'created') THEN
        ALTER TABLE videos RENAME COLUMN created TO created_at;
      ELSE
        ALTER TABLE videos ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      END IF;
    END IF;
  END IF;
END $$;

-- =============================================
-- SECTION 5: Fix episodes table timestamps
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episodes') THEN
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'created_at') THEN
      -- Check for various naming conventions and add if none exist
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'createdat') THEN
        ALTER TABLE episodes RENAME COLUMN createdat TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'createdAt') THEN
        ALTER TABLE episodes RENAME COLUMN "createdAt" TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'created') THEN
        ALTER TABLE episodes RENAME COLUMN created TO created_at;
      ELSE
        ALTER TABLE episodes ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      END IF;
    END IF;
  END IF;
END $$;

-- =============================================
-- SECTION 6: Verify what was fixed
-- =============================================
SELECT 'Final status - tables and views:' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notification_queue',
  'community_threads',
  'community_comments',
  'videos',
  'episodes'
)
ORDER BY table_name;