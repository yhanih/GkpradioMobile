#!/usr/bin/env node
/**
 * Call Supabase Edge Function to execute migration
 * This is fully automated if the Edge Function is deployed
 */

const SUPABASE_URL = 'https://fychjnaxljwmgoptjsxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2hqbmF4bGp3bWdvcHRqc3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODA5ODQsImV4cCI6MjA3NDI1Njk4NH0.PU002pqmbeCo_plcjaCP678Xo5dischMR3a_OTOqp_E';

async function callEdgeFunction() {
  console.log('🔄 Calling Supabase Edge Function to execute migration...\n');
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/add-push-token-column`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Migration executed successfully via Edge Function!');
      console.log('   push_token column is now available.\n');
      return true;
    } else {
      console.log('⚠️  Edge Function not deployed or returned error:');
      console.log(`   ${result.error || 'Unknown error'}\n`);
      return false;
    }
  } catch (error) {
    console.log('⚠️  Edge Function not available:');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Automated Migration via Edge Function\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const success = await callEdgeFunction();
  
  if (!success) {
    console.log('💡 Edge Function needs to be deployed first.');
    console.log('   See: supabase/functions/add-push-token-column/\n');
    console.log('   Or use the manual migration in Supabase Dashboard.\n');
  }
  
  process.exit(success ? 0 : 1);
}

main();












