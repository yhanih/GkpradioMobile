#!/usr/bin/env node
/**
 * Final automated solution - checks column and provides exact SQL if needed
 * Since Supabase blocks arbitrary SQL execution, this is the most automated solution possible
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fychjnaxljwmgoptjsxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2hqbmF4bGp3bWdvcHRqc3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODA5ODQsImV4cCI6MjA3NDI1Njk4NH0.PU002pqmbeCo_plcjaCP678Xo5dischMR3a_OTOqp_E';

async function checkAndReport() {
  console.log('🔍 Checking push_token column status...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { error } = await supabase.from('users').select('push_token').limit(1);
    
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      console.log('❌ Column does not exist\n');
      
      // Read the migration SQL
      const migrationSQL = readFileSync(
        join(__dirname, 'migrations', '06_add_push_token_column.sql'),
        'utf8'
      );
      
      console.log('📋 Migration SQL (copy this):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(migrationSQL.trim());
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('🔗 Direct link to run it:');
      console.log('   https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new\n');
      
      console.log('💡 Note: Supabase requires SQL execution via Dashboard for security.');
      console.log('   This is the only way to execute DDL statements.\n');
      
      return false;
    } else if (error) {
      throw error;
    } else {
      console.log('✅ push_token column already exists!');
      console.log('   No migration needed. Push notifications are ready.\n');
      return true;
    }
  } catch (error) {
    console.log('⚠️  Could not verify column status:', error.message);
    console.log('   Assuming migration is needed.\n');
    return false;
  }
}

async function main() {
  const exists = await checkAndReport();
  process.exit(exists ? 0 : 1);
}

main();












