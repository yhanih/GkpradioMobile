#!/usr/bin/env node
/**
 * Automated script to add push_token column to users table
 * Uses Supabase RPC to call a database function
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fychjnaxljwmgoptjsxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2hqbmF4bGp3bWdvcHRqc3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODA5ODQsImV4cCI6MjA3NDI1Njk4NH0.PU002pqmbeCo_plcjaCP678Xo5dischMR3a_OTOqp_E';

async function checkColumnExists() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('push_token')
      .limit(1);
    
    if (error) {
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function createMigrationFunction() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // First, try to create the function via RPC (won't work with anon key, but let's try)
  // Actually, we need to create the function first in the database
  // This requires the function to already exist or be created via SQL Editor
  
  console.log('📝 Creating migration function in database...');
  
  // Read the function SQL
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const functionSQL = fs.readFileSync(
    path.join(__dirname, 'migrations', '07_create_add_push_token_function.sql'),
    'utf8'
  );
  
  console.log('⚠️  Function needs to be created in database first.');
  console.log('   Attempting to call existing function...\n');
  
  // Try to call the function if it exists
  try {
    const { data, error } = await supabase.rpc('add_push_token_column');
    
    if (error) {
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.log('❌ Migration function does not exist yet.');
        console.log('   Need to create it first.\n');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Migration function executed successfully!');
    return true;
  } catch (error) {
    console.log('⚠️  Could not execute function:', error.message);
    return false;
  }
}

async function executeMigration() {
  console.log('🔄 Automating push_token migration...\n');
  
  // Check if column exists
  const exists = await checkColumnExists();
  
  if (exists) {
    console.log('✅ push_token column already exists!');
    console.log('   No migration needed.\n');
    return true;
  }
  
  console.log('📝 Column does not exist. Creating it...\n');
  
  // Try to create and call the migration function
  const success = await createMigrationFunction();
  
  if (!success) {
    // Fallback: Use direct SQL execution via fetch (won't work but let's try)
    console.log('🔄 Attempting direct SQL execution...\n');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token TEXT;'
        })
      });
      
      if (response.ok) {
        console.log('✅ Migration executed successfully!\n');
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.log('❌ Direct SQL execution not available.');
      console.log('   Supabase requires SQL via Dashboard, CLI, or database functions.\n');
      
      // Last resort: Provide clear instructions
      console.log('💡 To complete automatically, you need to:');
      console.log('   1. Run this SQL in Supabase Dashboard (one-time setup):');
      console.log('      mobile/migrations/07_create_add_push_token_function.sql');
      console.log('   2. Then this script can call the function automatically.\n');
      
      return false;
    }
  }
  
  return success;
}

// Run the migration
executeMigration().then(success => {
  if (success) {
    // Verify it worked
    checkColumnExists().then(exists => {
      if (exists) {
        console.log('✅ Verification: push_token column now exists!');
        console.log('   Push notifications are ready to use.\n');
        process.exit(0);
      } else {
        console.log('⚠️  Migration may have failed. Please verify manually.\n');
        process.exit(1);
      }
    });
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
