#!/usr/bin/env node
/**
 * Fully automated migration using Supabase REST API
 * Attempts multiple methods to execute the migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fychjnaxljwmgoptjsxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2hqbmF4bGp3bWdvcHRqc3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODA5ODQsImV4cCI6MjA3NDI1Njk4NH0.PU002pqmbeCo_plcjaCP678Xo5dischMR3a_OTOqp_E';

async function checkColumnExists() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { error } = await supabase.from('users').select('push_token').limit(1);
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      return false;
    }
    return !error;
  } catch {
    return false;
  }
}

async function executeViaRPC() {
  console.log('🔄 Method 1: Attempting RPC call...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Try calling a function that might exist
    const { data, error } = await supabase.rpc('add_push_token_column');
    if (!error) {
      console.log('✅ Success via RPC!\n');
      return true;
    }
  } catch (error) {
    // Function doesn't exist, continue to next method
  }
  
  return false;
}

async function executeViaManagementAPI() {
  console.log('🔄 Method 2: Attempting Management API...');
  
  // Try Supabase Management API endpoint
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.log('   Service role key not available\n');
    return false;
  }
  
  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '06_add_push_token_column.sql'),
      'utf8'
    );
    
    // Try different API endpoints
    const endpoints = [
      `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
      `${SUPABASE_URL}/management/v1/projects/fychjnaxljwmgoptjsxn/database/execute`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: migrationSQL }),
        });
        
        if (response.ok) {
          console.log('✅ Success via Management API!\n');
          return true;
        }
      } catch (error) {
        // Try next endpoint
        continue;
      }
    }
  } catch (error) {
    console.log('   Management API not available\n');
  }
  
  return false;
}

async function executeViaSupabaseCLI() {
  console.log('🔄 Method 3: Attempting Supabase CLI...');
  
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    // Check if supabase CLI is available
    await execAsync('which supabase');
    
    const migrationFile = join(__dirname, 'migrations', '06_add_push_token_column.sql');
    
    // Try to execute via CLI
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      process.env.SUPABASE_ACCESS_TOKEN = serviceKey;
    }
    
    try {
      const { stdout, stderr } = await execAsync(
        `supabase db execute --file "${migrationFile}" --project-ref fychjnaxljwmgoptjsxn`,
        { env: { ...process.env } }
      );
      
      if (!stderr || stderr.includes('Success')) {
        console.log('✅ Success via Supabase CLI!\n');
        return true;
      }
    } catch (error) {
      // CLI might not be linked or configured
      console.log('   CLI not properly configured\n');
    }
  } catch (error) {
    console.log('   Supabase CLI not available\n');
  }
  
  return false;
}

async function createAndCallFunction() {
  console.log('🔄 Method 4: Creating function via Edge Function...');
  
  // This would require creating an Edge Function first
  // Not fully automated without setup
  console.log('   Edge Function method requires setup\n');
  return false;
}

async function main() {
  console.log('🚀 Fully Automated Push Token Migration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check if already exists
  const exists = await checkColumnExists();
  if (exists) {
    console.log('✅ push_token column already exists!');
    console.log('   No migration needed.\n');
    return true;
  }
  
  console.log('📝 Column does not exist. Attempting automated migration...\n');
  
  // Try all methods
  const methods = [
    executeViaRPC,
    executeViaManagementAPI,
    executeViaSupabaseCLI,
    createAndCallFunction,
  ];
  
  for (const method of methods) {
    const success = await method();
    if (success) {
      // Verify
      const verified = await checkColumnExists();
      if (verified) {
        console.log('✅ Migration completed and verified!');
        console.log('   push_token column is now available.\n');
        return true;
      }
    }
  }
  
  console.log('❌ All automated methods failed.');
  console.log('   Supabase requires SQL execution via Dashboard for security.\n');
  console.log('💡 Quick solution:');
  console.log('   1. Open: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new');
  console.log('   2. Copy: mobile/migrations/06_add_push_token_column.sql');
  console.log('   3. Paste and Run\n');
  
  return false;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});












