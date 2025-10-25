const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

async function executeSQL(sql, description) {
  try {
    console.log(`\n📋 ${description}`);
    
    // Try to execute as a direct query
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      // If direct SQL fails, try alternative approach
      // For table creation, we'll need to handle this differently
      console.log('  ⚠️  Direct SQL not available, trying alternative...');
      return false;
    }
    
    console.log('  ✅ Success');
    return true;
  } catch (error) {
    console.log('  ⚠️  ', error.message);
    return false;
  }
}

async function setupTables() {
  console.log('\n🚀 Setting up Supabase tables...\n');

  // Since direct SQL might not work, let's check if tables exist by trying to query them
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
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.code === 'PGRST204') {
          console.log(`  ❌ Table '${table}' does not exist`);
        } else {
          console.log(`  ⚠️  Table '${table}' - Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`  ❌ Table '${table}' - ${err.message}`);
    }
  }

  console.log('\n⚠️  IMPORTANT: Tables need to be created in your Supabase Dashboard');
  console.log('📝 Please follow these steps:\n');
  console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Copy the SQL from docs/supabase-table-schemas.sql');
  console.log('5. Run the SQL to create all tables\n');
  
  // Test if we can insert data into existing tables
  console.log('🧪 Testing write access...');
  
  // Try to insert a test sponsor
  const { data: sponsorData, error: sponsorError } = await supabase
    .from('sponsors')
    .insert({
      name: 'Test Sponsor - ' + Date.now(),
      description: 'Testing write access',
      tier: 'bronze',
      isActive: true
    })
    .select();
  
  if (sponsorError) {
    if (sponsorError.code === '42P01' || sponsorError.message?.includes('relation')) {
      console.log('  ❌ Cannot write - sponsors table does not exist');
    } else {
      console.log('  ⚠️  Write test failed:', sponsorError.message);
    }
  } else {
    console.log('  ✅ Write access confirmed');
    // Clean up test data
    if (sponsorData && sponsorData[0]) {
      await supabase.from('sponsors').delete().eq('id', sponsorData[0].id);
    }
  }
}

// Create a SQL file with all table schemas
async function createSQLFile() {
  const sql = `-- Supabase Table Schemas for GKP Radio
-- Run this in your Supabase SQL Editor

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

  const fs = require('fs').promises;
  await fs.writeFile('docs/supabase-table-schemas.sql', sql);
  console.log('\n✅ SQL file created: docs/supabase-table-schemas.sql');
}

// Run setup
setupTables()
  .then(() => createSQLFile())
  .then(() => {
    console.log('\n🎯 Next Steps:');
    console.log('1. Open docs/supabase-table-schemas.sql');
    console.log('2. Copy all the SQL');
    console.log('3. Go to your Supabase Dashboard SQL Editor');
    console.log('4. Paste and run the SQL');
    console.log('5. Your database will be ready!');
  })
  .catch(console.error);