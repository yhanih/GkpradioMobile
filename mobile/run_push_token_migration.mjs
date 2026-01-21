#!/usr/bin/env node
/**
 * Script to run the push_token migration using Supabase Management API
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node mobile/run_push_token_migration.mjs
 */

const SUPABASE_URL = 'https://fychjnaxljwmgoptjsxn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set\n');
  console.log('📝 To get your service role key:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn');
  console.log('   2. Click Settings → API');
  console.log('   3. Copy the "service_role" key (NOT the anon key)\n');
  console.log('💡 Then run:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_key_here node mobile/run_push_token_migration.mjs\n');
  process.exit(1);
}

const migrationSQL = `ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN public.users.push_token IS 'Expo push notification token for sending push notifications to this user';

CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
WHERE push_token IS NOT NULL;`;

async function runMigration() {
  try {
    console.log('🔄 Checking push_token column status...\n');
    
    // First, check if column exists by trying to query it
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=push_token&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (checkResponse.ok) {
      console.log('✅ push_token column already exists!');
      console.log('   Migration not needed.\n');
      process.exit(0);
    } else if (checkResponse.status === 400) {
      const errorText = await checkResponse.text();
      if (errorText.includes('column') && errorText.includes('does not exist')) {
        console.log('❌ Column does not exist - running migration...\n');
      } else {
        throw new Error(`Check failed: ${errorText}`);
      }
    } else {
      throw new Error(`Check failed with status ${checkResponse.status}`);
    }

    // Execute migration using Supabase Management API
    // Note: Supabase REST API doesn't support arbitrary SQL execution
    // We need to use the Dashboard SQL Editor or Supabase CLI
    
    console.log('⚠️  Supabase REST API does not support direct SQL execution.');
    console.log('   This is a security feature - SQL must be run via Dashboard or CLI.\n');
    console.log('📋 Please run this SQL in your Supabase Dashboard:\n');
    console.log('='.repeat(70));
    console.log(migrationSQL);
    console.log('='.repeat(70));
    console.log('\n🔗 Quick link: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new');
    console.log('\n💡 Alternative: Set up Supabase MCP server for direct access!');
    console.log('   See: SUPABASE_MCP_SETUP.md\n');
    
    process.exit(1);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If check failed, assume column doesn't exist
    console.log('\n📋 Please run this SQL in your Supabase Dashboard:\n');
    console.log('='.repeat(70));
    console.log(migrationSQL);
    console.log('='.repeat(70));
    console.log('\n🔗 Quick link: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new\n');
    
    process.exit(1);
  }
}

runMigration();
