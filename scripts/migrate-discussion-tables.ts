import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function migrateDiscussionTables() {
  console.log('🔧 Starting migration for discussion tables...\n');

  try {
    // Check if tables exist
    console.log('📝 Checking existing tables...');
    const { data: existingTables } = await supabase
      .from('pg_tables')
      .select('tablename')
      .in('tablename', ['threadlikes', 'threadfollows']);

    const threadLikesExists = existingTables?.some(t => t.tablename === 'threadlikes');
    const threadFollowsExists = existingTables?.some(t => t.tablename === 'threadfollows');

    // Create threadlikes table if it doesn't exist
    if (!threadLikesExists) {
      console.log('📝 Creating threadlikes table...');
      const createThreadLikesSQL = `
        CREATE TABLE threadlikes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          threadid UUID NOT NULL REFERENCES communitythreads(id) ON DELETE CASCADE,
          userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(threadid, userid)
        );
      `;
      
      const indexThreadLikesSQL = `
        CREATE INDEX idx_threadlikes_threadid ON threadlikes(threadid);
        CREATE INDEX idx_threadlikes_userid ON threadlikes(userid);
      `;

      console.log('  Running SQL:', createThreadLikesSQL.trim());
      console.log('  Creating indexes...');
      console.log('✅ threadlikes table would be created (run this SQL manually in Supabase SQL Editor)\n');
    } else {
      console.log('✅ threadlikes table already exists\n');
    }

    // Create threadfollows table if it doesn't exist
    if (!threadFollowsExists) {
      console.log('📝 Creating threadfollows table...');
      const createThreadFollowsSQL = `
        CREATE TABLE threadfollows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          threadid UUID NOT NULL REFERENCES communitythreads(id) ON DELETE CASCADE,
          userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(threadid, userid)
        );
      `;

      const indexThreadFollowsSQL = `
        CREATE INDEX idx_threadfollows_threadid ON threadfollows(threadid);
        CREATE INDEX idx_threadfollows_userid ON threadfollows(userid);
      `;

      console.log('  Running SQL:', createThreadFollowsSQL.trim());
      console.log('  Creating indexes...');
      console.log('✅ threadfollows table would be created (run this SQL manually in Supabase SQL Editor)\n');
    } else {
      console.log('✅ threadfollows table already exists\n');
    }

    // Check if columns exist in communitythreads
    console.log('📝 Checking columns in communitythreads table...');
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'communitythreads')
      .in('column_name', ['likecount', 'replycount']);

    const likecountExists = columns?.some(c => c.column_name === 'likecount');
    const replycountExists = columns?.some(c => c.column_name === 'replycount');

    if (!likecountExists || !replycountExists) {
      const alterTableSQL = `
        ALTER TABLE communitythreads 
        ${!likecountExists ? 'ADD COLUMN likecount INTEGER DEFAULT 0,' : ''}
        ${!replycountExists ? 'ADD COLUMN replycount INTEGER DEFAULT 0;' : ''}
      `.replace(/,$/, ';');

      console.log('  SQL to run:', alterTableSQL.trim());
      console.log('✅ Columns would be added (run this SQL manually in Supabase SQL Editor)\n');
    } else {
      console.log('✅ Columns already exist\n');
    }

    console.log('\n📋 MIGRATION SQL SCRIPT:');
    console.log('='.repeat(60));
    console.log(`
-- Create threadlikes table
CREATE TABLE IF NOT EXISTS threadlikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threadid UUID NOT NULL REFERENCES communitythreads(id) ON DELETE CASCADE,
  userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(threadid, userid)
);

CREATE INDEX IF NOT EXISTS idx_threadlikes_threadid ON threadlikes(threadid);
CREATE INDEX IF NOT EXISTS idx_threadlikes_userid ON threadlikes(userid);

-- Create threadfollows table
CREATE TABLE IF NOT EXISTS threadfollows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threadid UUID NOT NULL REFERENCES communitythreads(id) ON DELETE CASCADE,
  userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(threadid, userid)
);

CREATE INDEX IF NOT EXISTS idx_threadfollows_threadid ON threadfollows(threadid);
CREATE INDEX IF NOT EXISTS idx_threadfollows_userid ON threadfollows(userid);

-- Add columns to communitythreads
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communitythreads' AND column_name = 'likecount'
  ) THEN
    ALTER TABLE communitythreads ADD COLUMN likecount INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communitythreads' AND column_name = 'replycount'
  ) THEN
    ALTER TABLE communitythreads ADD COLUMN replycount INTEGER DEFAULT 0;
  END IF;
END $$;

-- Initialize counts for existing threads
UPDATE communitythreads ct
SET likecount = COALESCE((
  SELECT COUNT(*) FROM threadlikes tl WHERE tl.threadid = ct.id
), 0)
WHERE likecount IS NULL OR likecount = 0;

UPDATE communitythreads ct
SET replycount = COALESCE((
  SELECT COUNT(*) FROM communitycomments cc WHERE cc.threadid = ct.id
), 0)
WHERE replycount IS NULL OR replycount = 0;
    `);
    console.log('='.repeat(60));
    console.log('\n📝 Copy the SQL above and run it in your Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/_/sql\n');

    console.log('🎉 Migration script completed!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateDiscussionTables();
