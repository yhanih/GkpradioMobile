-- Supabase Table Schemas for GKP Radio
-- Run this in your Supabase Dashboard SQL Editor

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100),
  fullName VARCHAR(255),
  avatarUrl TEXT,
  bio TEXT,
  role VARCHAR(50) DEFAULT 'user',
  isEmailVerified BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logoUrl TEXT,
  websiteUrl TEXT,
  description TEXT,
  tier VARCHAR(50),
  isActive BOOLEAN DEFAULT true,
  startDate TIMESTAMPTZ DEFAULT NOW(),
  endDate TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audioUrl TEXT,
  thumbnailUrl TEXT,
  duration INTEGER,
  publishedAt TIMESTAMPTZ,
  isPublished BOOLEAN DEFAULT false,
  playCount INTEGER DEFAULT 0,
  category VARCHAR(100),
  tags TEXT[],
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  videoUrl TEXT,
  thumbnailUrl TEXT,
  duration INTEGER,
  publishedAt TIMESTAMPTZ,
  isPublished BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  category VARCHAR(100),
  tags TEXT[],
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Live chat messages table
CREATE TABLE IF NOT EXISTS liveChatMessages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  isVerified BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  roomId VARCHAR(100) DEFAULT 'main'
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contactMessages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  contactReason VARCHAR(100),
  status VARCHAR(50) DEFAULT 'unread',
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletterSubscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT true,
  subscribedAt TIMESTAMPTZ DEFAULT NOW(),
  unsubscribedAt TIMESTAMPTZ
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  isRead BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Community threads table
CREATE TABLE IF NOT EXISTS communityThreads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  isPinned BOOLEAN DEFAULT false,
  isLocked BOOLEAN DEFAULT false,
  viewCount INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Community comments table
CREATE TABLE IF NOT EXISTS communityComments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threadId UUID REFERENCES communityThreads(id) ON DELETE CASCADE,
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parentId UUID REFERENCES communityComments(id) ON DELETE CASCADE,
  isEdited BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS teamMembers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  bio TEXT,
  imageUrl TEXT,
  department VARCHAR(100),
  orderIndex INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_livechat_roomid ON liveChatMessages(roomId);
CREATE INDEX IF NOT EXISTS idx_livechat_timestamp ON liveChatMessages(timestamp);
CREATE INDEX IF NOT EXISTS idx_episodes_published ON episodes(isPublished, publishedAt);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(isPublished, publishedAt);
CREATE INDEX IF NOT EXISTS idx_threads_category ON communityThreads(category);
CREATE INDEX IF NOT EXISTS idx_comments_thread ON communityComments(threadId);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId, isRead);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE liveChatMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactMessages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletterSubscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communityThreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communityComments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teamMembers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for liveChatMessages
CREATE POLICY "Recent chat messages are public"
ON liveChatMessages FOR SELECT
USING (timestamp > (NOW() - INTERVAL '24 hours'));

CREATE POLICY "Anyone can send chat messages"
ON liveChatMessages FOR INSERT
WITH CHECK (true);

-- RLS Policies for sponsors
CREATE POLICY "Public sponsors are viewable"
ON sponsors FOR SELECT
USING (isActive = true);

-- RLS Policies for teamMembers
CREATE POLICY "Public team members are viewable"
ON teamMembers FOR SELECT
USING (isActive = true);

-- RLS Policies for contactMessages
CREATE POLICY "Anyone can submit contact message"
ON contactMessages FOR INSERT
WITH CHECK (true);

-- RLS Policies for newsletterSubscribers  
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletterSubscribers FOR INSERT
WITH CHECK (true);

-- Sample data
INSERT INTO sponsors (name, description, tier, isActive) VALUES
  ('Blessed Bakery', 'Faith-based bakery supporting our ministry', 'gold', true),
  ('Kingdom Books', 'Christian bookstore and resources', 'silver', true)
ON CONFLICT DO NOTHING;

INSERT INTO teamMembers (name, role, bio, department, orderIndex) VALUES
  ('Pastor Johnson', 'Lead Pastor & Radio Host', 'Sharing God''s Word with passion and purpose for over 15 years.', 'Leadership', 1),
  ('Minister Sarah', 'Women''s Ministry Leader', 'Empowering women to walk in their God-given purpose and destiny.', 'Ministry', 2),
  ('Deacon Michael', 'Youth Pastor & Music Director', 'Inspiring the next generation through music and biblical teaching.', 'Youth', 3)
ON CONFLICT DO NOTHING;

INSERT INTO liveChatMessages (username, message, isVerified, roomId) VALUES
  ('GKP Radio', 'Welcome to GKP Radio Live Chat! Share your prayers and testimonies with our community.', true, 'main')
ON CONFLICT DO NOTHING;
