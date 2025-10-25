import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function setupSupabaseTables() {
  console.log('🚀 Setting up Supabase tables...\n');

  try {
    // Create tables in order of dependencies
    const tableQueries = [
      // Users table (already exists from Supabase Auth)
      `CREATE TABLE IF NOT EXISTS users (
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
      )`,

      // Sponsors table
      `CREATE TABLE IF NOT EXISTS sponsors (
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
      )`,

      // Episodes table
      `CREATE TABLE IF NOT EXISTS episodes (
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
      )`,

      // Videos table
      `CREATE TABLE IF NOT EXISTS videos (
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
      )`,

      // Live chat messages table
      `CREATE TABLE IF NOT EXISTS liveChatMessages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        userId UUID REFERENCES users(id) ON DELETE SET NULL,
        isVerified BOOLEAN DEFAULT false,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        roomId VARCHAR(100) DEFAULT 'main'
      )`,

      // Contact messages table
      `CREATE TABLE IF NOT EXISTS contactMessages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        contactReason VARCHAR(100),
        status VARCHAR(50) DEFAULT 'unread',
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Newsletter subscribers table
      `CREATE TABLE IF NOT EXISTS newsletterSubscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        isActive BOOLEAN DEFAULT true,
        subscribedAt TIMESTAMPTZ DEFAULT NOW(),
        unsubscribedAt TIMESTAMPTZ
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        userId UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        isRead BOOLEAN DEFAULT false,
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Community threads table
      `CREATE TABLE IF NOT EXISTS communityThreads (
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
      )`,

      // Community comments table
      `CREATE TABLE IF NOT EXISTS communityComments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        threadId UUID REFERENCES communityThreads(id) ON DELETE CASCADE,
        userId UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        parentId UUID REFERENCES communityComments(id) ON DELETE CASCADE,
        isEdited BOOLEAN DEFAULT false,
        createdAt TIMESTAMPTZ DEFAULT NOW(),
        updatedAt TIMESTAMPTZ DEFAULT NOW()
      )`,

      // Team members table
      `CREATE TABLE IF NOT EXISTS teamMembers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        bio TEXT,
        imageUrl TEXT,
        department VARCHAR(100),
        orderIndex INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )`
    ];

    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_livechat_roomid ON liveChatMessages(roomId)`,
      `CREATE INDEX IF NOT EXISTS idx_livechat_timestamp ON liveChatMessages(timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_episodes_published ON episodes(isPublished, publishedAt)`,
      `CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(isPublished, publishedAt)`,
      `CREATE INDEX IF NOT EXISTS idx_threads_category ON communityThreads(category)`,
      `CREATE INDEX IF NOT EXISTS idx_comments_thread ON communityComments(threadId)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId, isRead)`
    ];

    // Execute table creation queries
    console.log('📋 Creating tables...');
    for (const query of tableQueries) {
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
      console.log(`  - Creating table: ${tableName}`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: query 
      }).single();
      
      if (error && !error.message?.includes('already exists')) {
        console.error(`    ❌ Error creating ${tableName}:`, error.message);
        // Try alternative approach using direct SQL
        const { error: directError } = await supabase.from('_sql').insert({ query });
        if (directError) {
          console.error(`    ❌ Alternative approach also failed:`, directError.message);
        }
      } else {
        console.log(`    ✅ ${tableName} ready`);
      }
    }

    // Execute index creation queries
    console.log('\n📑 Creating indexes...');
    for (const query of indexQueries) {
      const indexName = query.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
      console.log(`  - Creating index: ${indexName}`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: query 
      }).single();
      
      if (error && !error.message?.includes('already exists')) {
        console.error(`    ❌ Error creating ${indexName}:`, error.message);
      } else {
        console.log(`    ✅ ${indexName} ready`);
      }
    }

    // Insert sample data for testing
    console.log('\n📝 Inserting sample data...');
    
    // Add sample sponsors
    const { error: sponsorError } = await supabase.from('sponsors').insert([
      {
        name: 'Blessed Bakery',
        description: 'Faith-based bakery supporting our ministry',
        tier: 'gold',
        isActive: true
      },
      {
        name: 'Kingdom Books',
        description: 'Christian bookstore and resources',
        tier: 'silver',
        isActive: true
      }
    ]);
    
    if (sponsorError && !sponsorError.message?.includes('duplicate')) {
      console.error('  ❌ Error adding sponsors:', sponsorError.message);
    } else {
      console.log('  ✅ Sample sponsors added');
    }

    // Add sample team members
    const { error: teamError } = await supabase.from('teamMembers').insert([
      {
        name: 'Pastor Johnson',
        role: 'Lead Pastor & Radio Host',
        bio: 'Sharing God\'s Word with passion and purpose for over 15 years.',
        department: 'Leadership',
        orderIndex: 1
      },
      {
        name: 'Minister Sarah',
        role: 'Women\'s Ministry Leader',
        bio: 'Empowering women to walk in their God-given purpose and destiny.',
        department: 'Ministry',
        orderIndex: 2
      },
      {
        name: 'Deacon Michael',
        role: 'Youth Pastor & Music Director',
        bio: 'Inspiring the next generation through music and biblical teaching.',
        department: 'Youth',
        orderIndex: 3
      }
    ]);

    if (teamError && !teamError.message?.includes('duplicate')) {
      console.error('  ❌ Error adding team members:', teamError.message);
    } else {
      console.log('  ✅ Sample team members added');
    }

    // Add welcome chat message
    const { error: chatError } = await supabase.from('liveChatMessages').insert({
      username: 'GKP Radio',
      message: 'Welcome to GKP Radio Live Chat! Share your prayers and testimonies with our community.',
      isVerified: true,
      roomId: 'main'
    });

    if (chatError && !chatError.message?.includes('duplicate')) {
      console.error('  ❌ Error adding welcome message:', chatError.message);
    } else {
      console.log('  ✅ Welcome chat message added');
    }

    console.log('\n✅ Supabase tables setup complete!');
    console.log('📊 Tables created: users, sponsors, episodes, videos, liveChatMessages, contactMessages, newsletterSubscribers, notifications, communityThreads, communityComments, teamMembers');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabaseTables()
  .then(() => {
    console.log('\n🎉 All done! Your Supabase database is ready.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });