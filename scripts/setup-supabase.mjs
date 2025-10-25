import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});

async function setupTables() {
  console.log('\n🚀 Setting up Supabase tables...\n');

  // Tables to check/create
  const tables = [
    'sponsors',
    'episodes', 
    'videos',
    'liveChatMessages',
    'contactMessages',
    'newsletterSubscribers',
    'notifications',
    'communityThreads',
    'communityComments',
    'teamMembers'
  ];

  console.log('📊 Checking existing tables...');
  
  let missingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('not found')) {
          console.log(`  ❌ Table '${table}' does not exist`);
          missingTables.push(table);
        } else {
          console.log(`  ⚠️  Table '${table}' - Error: ${error.message}`);
          missingTables.push(table);
        }
      } else {
        console.log(`  ✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`  ❌ Table '${table}' - ${err.message}`);
      missingTables.push(table);
    }
  }

  // If tables are missing, try to create them using the Supabase API
  if (missingTables.length > 0) {
    console.log(`\n⚠️  Found ${missingTables.length} missing tables. Attempting to create them...`);
    
    // Try using the Supabase Management API
    const headers = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    };

    // Check if we can execute SQL directly
    const testSQL = 'SELECT 1';
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: testSQL
      })
    });

    if (!testResponse.ok) {
      console.log('\n❌ Cannot execute SQL directly via API.');
      console.log('📝 Creating SQL file for manual execution...\n');
    }
  }

  // Test write access to existing tables
  console.log('\n🧪 Testing write access...');
  
  // Try to query sponsors table
  const { data: sponsorData, error: sponsorError } = await supabase
    .from('sponsors')
    .select('*')
    .limit(1);
  
  if (sponsorError) {
    if (sponsorError.code === 'PGRST204' || sponsorError.code === 'PGRST205' || sponsorError.message?.includes('not found')) {
      console.log('  ❌ Sponsors table does not exist');
    } else {
      console.log('  ⚠️  Query failed:', sponsorError.message);
    }
  } else {
    console.log('  ✅ Can read from sponsors table');
  }
}

// Create a SQL file with all table schemas
async function createSQLFile() {
  const sql = `-- Supabase Table Schemas for GKP Radio
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
`;

  await fs.writeFile('docs/supabase-table-schemas.sql', sql);
  console.log('✅ SQL file created: docs/supabase-table-schemas.sql');
}

// Run setup
console.log('GKP Radio Supabase Setup\n');
console.log('========================\n');

setupTables()
  .then(() => createSQLFile())
  .then(() => {
    console.log('\n📋 INSTRUCTIONS TO COMPLETE SETUP:');
    console.log('==================================\n');
    console.log('1. Go to your Supabase Dashboard:');
    console.log('   https://app.supabase.com/project/' + supabaseUrl.split('//')[1].split('.')[0]);
    console.log('\n2. Click on "SQL Editor" in the left sidebar');
    console.log('\n3. Open the file: docs/supabase-table-schemas.sql');
    console.log('\n4. Copy ALL the SQL from that file');
    console.log('\n5. Paste it into the SQL Editor');
    console.log('\n6. Click "Run" to create all tables and policies');
    console.log('\n7. Your database will be ready to use!');
    console.log('\n✅ Once complete, your migrated pages will work:');
    console.log('   - /live-supabase (Live chat)');
    console.log('   - /connect-supabase (Contact forms)');
    console.log('   - /community-supabase (Forums)');
  })
  .catch(console.error);