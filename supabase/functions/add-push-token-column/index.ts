// Supabase Edge Function to add push_token column
// This can be called via HTTP to automate the migration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute the migration SQL
    const migrationSQL = `
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS push_token TEXT;

      COMMENT ON COLUMN public.users.push_token IS 'Expo push notification token for sending push notifications to this user';

      CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
      WHERE push_token IS NOT NULL;
    `;

    // Execute via RPC or direct query
    // Note: Supabase Edge Functions can execute SQL via the PostgREST API
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL,
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      // We'll need to use the Supabase client's query method
      // Actually, we can't execute arbitrary SQL via the JS client
      // We need to use the database connection directly
      
      // Alternative: Use Deno's Postgres client
      const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
      
      // Parse connection string from Supabase URL
      const dbUrl = Deno.env.get('DATABASE_URL') ?? '';
      if (!dbUrl) {
        throw new Error('DATABASE_URL not set');
      }

      const client = new Client(dbUrl);
      await client.connect();
      
      try {
        await client.queryArray(migrationSQL);
        await client.end();
        
        return new Response(
          JSON.stringify({ success: true, message: 'Migration completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (dbError) {
        await client.end();
        throw dbError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Migration completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});












