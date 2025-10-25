-- Fix Table and Column Name Mismatches in Supabase
-- Run this in your Supabase Dashboard SQL Editor

-- =============================================
-- STEP 1: First, run this diagnostic to see what columns actually exist
-- =============================================
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('communitythreads', 'communitycomments', 'videos', 'episodes')
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- =============================================
-- STEP 2: Create missing notification tables
-- =============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notification_queue' 
    AND policyname = 'Service role full access'
  ) THEN 
    CREATE POLICY "Service role full access" ON public.notification_queue 
    FOR ALL USING (true); 
  END IF; 
END $$;

-- =============================================
-- STEP 3: Create community views based on actual existing columns
-- =============================================
DO $$
DECLARE
  view_sql TEXT;
  col_exists BOOLEAN;
  first_col BOOLEAN := true;
BEGIN
  -- Only proceed if communitythreads table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communitythreads' AND table_schema = 'public') THEN
    
    DROP VIEW IF EXISTS community_threads CASCADE;
    
    -- Start building the view with columns we know should exist
    view_sql := 'CREATE VIEW community_threads AS SELECT ';
    
    -- Check for id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'id') THEN
      view_sql := view_sql || 'id';
      first_col := false;
    END IF;
    
    -- Check for title column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'title') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'title';
      first_col := false;
    END IF;
    
    -- Check for content column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'content') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'content';
      first_col := false;
    END IF;
    
    -- Check for category column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'category') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'category';
      first_col := false;
    END IF;
    
    -- Check for tags column (might not exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'tags') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'tags';
      first_col := false;
    END IF;
    
    -- Check for author column (snake_case or camelCase)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'author_id') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'author_id';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'authorId') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"authorId" as author_id';
      first_col := false;
    END IF;
    
    -- Check for view_count column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'view_count') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'view_count';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'viewCount') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"viewCount" as view_count';
      first_col := false;
    END IF;
    
    -- Check for reply_count column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'reply_count') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'reply_count';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'replyCount') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"replyCount" as reply_count';
      first_col := false;
    END IF;
    
    -- Check for last_activity_at column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'last_activity_at') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'last_activity_at';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'lastActivityAt') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"lastActivityAt" as last_activity_at';
      first_col := false;
    END IF;
    
    -- Check for is_pinned column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'is_pinned') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'is_pinned';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'isPinned') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"isPinned" as is_pinned';
      first_col := false;
    END IF;
    
    -- Check for is_locked column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'is_locked') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'is_locked';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'isLocked') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"isLocked" as is_locked';
      first_col := false;
    END IF;
    
    -- Check for created_at column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'created_at') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'created_at';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'createdAt') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"createdAt" as created_at';
      first_col := false;
    END IF;
    
    -- Check for updated_at column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'updated_at') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'updated_at';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitythreads' AND column_name = 'updatedAt') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"updatedAt" as updated_at';
      first_col := false;
    END IF;
    
    view_sql := view_sql || ' FROM communitythreads';
    
    -- Execute the dynamically built SQL
    EXECUTE view_sql;
    RAISE NOTICE 'Created community_threads view successfully with available columns';
  ELSE
    RAISE NOTICE 'Table communitythreads does not exist - skipping view creation';
  END IF;
  
  -- Similar for community_comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communitycomments' AND table_schema = 'public') THEN
    
    DROP VIEW IF EXISTS community_comments CASCADE;
    
    first_col := true;
    view_sql := 'CREATE VIEW community_comments AS SELECT ';
    
    -- Check for id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'id') THEN
      view_sql := view_sql || 'id';
      first_col := false;
    END IF;
    
    -- Check for content column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'content') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'content';
      first_col := false;
    END IF;
    
    -- Check for thread_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'thread_id') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'thread_id';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'threadId') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"threadId" as thread_id';
      first_col := false;
    END IF;
    
    -- Check for author_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'author_id') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'author_id';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'authorId') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"authorId" as author_id';
      first_col := false;
    END IF;
    
    -- Check for parent_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'parent_id') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'parent_id';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'parentId') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"parentId" as parent_id';
      first_col := false;
    END IF;
    
    -- Check for is_edited column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'is_edited') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'is_edited';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'isEdited') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"isEdited" as is_edited';
      first_col := false;
    END IF;
    
    -- Check for created_at column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'created_at') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'created_at';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'createdAt') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"createdAt" as created_at';
      first_col := false;
    END IF;
    
    -- Check for updated_at column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'updated_at') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || 'updated_at';
      first_col := false;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communitycomments' AND column_name = 'updatedAt') THEN
      IF NOT first_col THEN view_sql := view_sql || ', '; END IF;
      view_sql := view_sql || '"updatedAt" as updated_at';
      first_col := false;
    END IF;
    
    view_sql := view_sql || ' FROM communitycomments';
    
    -- Execute the dynamically built SQL
    EXECUTE view_sql;
    RAISE NOTICE 'Created community_comments view successfully with available columns';
  ELSE
    RAISE NOTICE 'Table communitycomments does not exist - skipping view creation';
  END IF;
  
END $$;

-- =============================================
-- STEP 4: Fix videos and episodes table columns
-- =============================================
DO $$ 
BEGIN
  -- Fix videos table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
    -- Check and fix created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'created_at') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'createdat') THEN
        ALTER TABLE videos RENAME COLUMN "createdat" TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'createdAt') THEN
        ALTER TABLE videos RENAME COLUMN "createdAt" TO created_at;
      ELSE
        ALTER TABLE videos ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      END IF;
    END IF;
    
    -- Check and fix updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'updated_at') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'updatedat') THEN
        ALTER TABLE videos RENAME COLUMN "updatedat" TO updated_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'updatedAt') THEN
        ALTER TABLE videos RENAME COLUMN "updatedAt" TO updated_at;
      ELSE
        ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
      END IF;
    END IF;
  END IF;
  
  -- Fix episodes table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episodes') THEN
    -- Check and fix created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'created_at') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'createdat') THEN
        ALTER TABLE episodes RENAME COLUMN "createdat" TO created_at;
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'createdAt') THEN
        ALTER TABLE episodes RENAME COLUMN "createdAt" TO created_at;
      ELSE
        ALTER TABLE episodes ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      END IF;
    END IF;
  END IF;
END $$;

-- =============================================
-- STEP 5: Create other missing tables
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type TEXT NOT NULL,
  ref_type TEXT,
  ref_id INTEGER,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type TEXT NOT NULL,
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT false,
  push BOOLEAN DEFAULT false,
  digest TEXT DEFAULT 'none',
  quiet_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sponsors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  tier TEXT DEFAULT 'bronze',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'sponsors' 
    AND policyname = 'Public sponsors are viewable'
  ) THEN 
    CREATE POLICY "Public sponsors are viewable" ON public.sponsors 
    FOR SELECT USING (is_active = true); 
  END IF; 
END $$;

-- =============================================
-- STEP 6: Show what was created
-- =============================================
SELECT 'Tables and Views Status:' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notification_queue',
  'notifications',
  'notification_preferences',
  'community_threads',
  'community_comments',
  'videos',
  'episodes',
  'sponsors'
)
ORDER BY table_name;

-- Show actual columns in community tables for verification
SELECT 'Actual columns in community tables:' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('communitythreads', 'communitycomments')
AND table_schema = 'public'
ORDER BY table_name, column_name;