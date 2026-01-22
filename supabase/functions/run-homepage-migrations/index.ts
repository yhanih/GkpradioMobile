// Supabase Edge Function to run homepage backend migrations
// Executes: prayercircle_prayers table, pray_for_request RPC, get_homepage_stats RPC

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use SUPABASE_DB_URL (default) or fallback to DATABASE_URL
    const dbUrl = Deno.env.get("SUPABASE_DB_URL") || Deno.env.get("DATABASE_URL");
    if (!dbUrl) {
      throw new Error("SUPABASE_DB_URL or DATABASE_URL environment variable is not set");
    }

    const client = new Client(dbUrl);
    await client.connect();

    const results: Array<{ migration: string; success: boolean; error?: string }> = [];

    try {
      // Migration 1: Create prayercircle_prayers table
      const migration1SQL = `
        -- Create table to track prayer actions (users praying for prayer requests)
        CREATE TABLE IF NOT EXISTS public.prayercircle_prayers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            prayercircle_id UUID NOT NULL REFERENCES public.prayercircles(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(prayercircle_id, user_id)
        );

        -- Enable RLS
        ALTER TABLE public.prayercircle_prayers ENABLE ROW LEVEL SECURITY;

        -- Drop existing policy if it exists, then create
        DROP POLICY IF EXISTS "Anyone can view prayer counts" ON public.prayercircle_prayers;
        CREATE POLICY "Anyone can view prayer counts"
            ON public.prayercircle_prayers FOR SELECT
            USING (true);

        DROP POLICY IF EXISTS "Authenticated users can add prayers" ON public.prayercircle_prayers;
        CREATE POLICY "Authenticated users can add prayers"
            ON public.prayercircle_prayers FOR INSERT
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_prayercircle_prayers_prayercircle ON public.prayercircle_prayers(prayercircle_id);
        CREATE INDEX IF NOT EXISTS idx_prayercircle_prayers_user ON public.prayercircle_prayers(user_id);

        -- Grant permissions
        GRANT SELECT, INSERT ON public.prayercircle_prayers TO authenticated;
        GRANT SELECT ON public.prayercircle_prayers TO anon;
      `;

      await client.queryArray(migration1SQL);
      results.push({ migration: "prayercircle_prayers table", success: true });

      // Migration 2: Create pray_for_request RPC function
      const migration2SQL = `
        -- Create RPC function to track prayer actions atomically
        CREATE OR REPLACE FUNCTION pray_for_request(prayercircle_id UUID)
        RETURNS JSON AS $$
        DECLARE
          current_user_id UUID;
          prayer_count INTEGER;
          result JSON;
        BEGIN
          -- Get current user ID (can be NULL for anonymous users)
          current_user_id := auth.uid();
          
          -- Insert prayer action (idempotent via UNIQUE constraint)
          -- Allow NULL user_id for anonymous prayers
          INSERT INTO prayercircle_prayers (prayercircle_id, user_id)
          VALUES (prayercircle_id, current_user_id)
          ON CONFLICT (prayercircle_id, user_id) DO NOTHING;
          
          -- Count total prayers for this request
          SELECT COUNT(*) INTO prayer_count
          FROM prayercircle_prayers
          WHERE prayercircle_id = pray_for_request.prayercircle_id;
          
          -- Return result
          SELECT json_build_object(
            'success', true,
            'prayer_count', prayer_count,
            'user_prayed', current_user_id IS NOT NULL
          ) INTO result;
          
          RETURN result;
        EXCEPTION
          WHEN OTHERS THEN
            -- Return error
            SELECT json_build_object(
              'success', false,
              'error', SQLERRM
            ) INTO result;
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Grant execute permission to authenticated and anon users
        GRANT EXECUTE ON FUNCTION pray_for_request(UUID) TO authenticated, anon;
      `;

      await client.queryArray(migration2SQL);
      results.push({ migration: "pray_for_request function", success: true });

      // Migration 3: Create get_homepage_stats RPC function (optional)
      const migration3SQL = `
        -- Create RPC function to get homepage stats efficiently
        -- Handles case where is_testimony column may not exist
        CREATE OR REPLACE FUNCTION get_homepage_stats()
        RETURNS JSON AS $$
        DECLARE
          result JSON;
          prayer_count INTEGER;
        BEGIN
          -- Count prayer requests (handle optional is_testimony column)
          BEGIN
            SELECT COUNT(*) INTO prayer_count 
            FROM prayercircles 
            WHERE is_testimony = false OR is_testimony IS NULL;
          EXCEPTION WHEN undefined_column THEN
            -- If is_testimony doesn't exist, count all prayercircles
            SELECT COUNT(*) INTO prayer_count FROM prayercircles;
          END;
          
          SELECT json_build_object(
            'community_members', (SELECT COUNT(*) FROM users),
            'discussions', (SELECT COUNT(*) FROM communitythreads),
            'prayer_requests', prayer_count,
            'community_support', '24/7'
          ) INTO result;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Grant execute permission to authenticated and anon users
        GRANT EXECUTE ON FUNCTION get_homepage_stats() TO authenticated, anon;
      `;

      await client.queryArray(migration3SQL);
      results.push({ migration: "get_homepage_stats function", success: true });

      await client.end();

      return new Response(
        JSON.stringify({
          success: true,
          message: "All migrations completed successfully",
          results,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (dbError: unknown) {
      await client.end();
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      results.push({
        migration: "database operation",
        success: false,
        error: errorMessage,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          results,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
