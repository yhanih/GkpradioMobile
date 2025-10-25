-- Fix Database Bugs for GKP Radio
-- Run this in your Supabase Dashboard SQL Editor

-- =============================================
-- 1. FIX NOTIFICATION_QUEUE TABLE
-- =============================================
-- The notification_queue table is missing in Supabase
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);

-- Enable Row Level Security
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage notification queue
CREATE POLICY "Service role full access" ON notification_queue
FOR ALL USING (true);

-- =============================================
-- 2. FIX COMMUNITY_THREADS TABLE
-- =============================================
-- The table exists as 'communitythreads' but code expects 'community_threads'
-- Create view to maintain compatibility (safer than renaming)
CREATE OR REPLACE VIEW community_threads AS 
SELECT * FROM communitythreads;

-- Create INSTEAD OF triggers for the view to handle inserts/updates/deletes
CREATE OR REPLACE FUNCTION redirect_community_threads_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO communitythreads SELECT NEW.*;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_threads_insert_trigger
INSTEAD OF INSERT ON community_threads
FOR EACH ROW EXECUTE FUNCTION redirect_community_threads_insert();

-- =============================================
-- 3. FIX NOTIFICATIONS TABLE 
-- =============================================
-- Ensure notifications table exists with correct structure
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  ref_type TEXT,
  ref_id INTEGER,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid()::text = user_id::text);

-- =============================================
-- 4. FIX NOTIFICATION_PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON notification_preferences
FOR ALL USING (auth.uid()::text = user_id::text);

-- =============================================
-- 5. FIX NOTIFICATION_CHANNELS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_channels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  metadata JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_channels_user ON notification_channels(user_id);

-- Enable RLS
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own channels
CREATE POLICY "Users can manage own channels" ON notification_channels
FOR ALL USING (auth.uid()::text = user_id::text);

-- =============================================
-- 6. CHECK AND FIX COMMUNITY_COMMENTS TABLE
-- =============================================
-- Check if it's 'communitycomments' or 'community_comments'
CREATE OR REPLACE VIEW community_comments AS 
SELECT * FROM communitycomments;

-- Create INSTEAD OF trigger for the view
CREATE OR REPLACE FUNCTION redirect_community_comments_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO communitycomments SELECT NEW.*;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_comments_insert_trigger
INSTEAD OF INSERT ON community_comments
FOR EACH ROW EXECUTE FUNCTION redirect_community_comments_insert();

-- =============================================
-- VERIFY TABLES
-- =============================================
-- Run this query to verify all tables are created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notification_queue',
  'notifications', 
  'notification_preferences',
  'notification_channels',
  'community_threads',
  'community_comments'
);