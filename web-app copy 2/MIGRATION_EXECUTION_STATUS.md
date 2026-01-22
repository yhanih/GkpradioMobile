# Homepage Migrations Execution Status

## MCP Limitation

**The Supabase MCP tools do not support raw SQL execution.**

Available MCP tools:
- `queryDatabase` - Read data from existing tables
- `insertData` - Insert rows into existing tables  
- `updateData` - Update existing rows
- `deleteData` - Delete existing rows
- `listTables` - List table names

**Missing capability:** Execute DDL statements (CREATE TABLE, CREATE FUNCTION, ALTER TABLE, etc.)

## Migration Files Created

All migration files have been created and are ready:

1. ✅ `supabase/functions/run-homepage-migrations/index.ts` - Edge function to execute migrations
2. ✅ `web-app/supabase/migrations/combined_homepage_migrations.sql` - Combined SQL (ready to run)
3. ✅ Individual migration files in `web-app/supabase/migrations/`

## Execution Options

### Option 1: Supabase Dashboard (Recommended - 2 minutes)

1. Open: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new
2. Copy contents of `web-app/supabase/migrations/combined_homepage_migrations.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: Should see "Success. No rows returned"

### Option 2: Supabase CLI (If installed)

```bash
supabase db execute --file web-app/supabase/migrations/combined_homepage_migrations.sql
```

### Option 3: Edge Function (Requires deployment)

```bash
# Deploy function
supabase functions deploy run-homepage-migrations

# Execute
curl -X POST "https://fychjnaxljwmgoptjsxn.supabase.co/functions/v1/run-homepage-migrations" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Post-Execution Verification (via MCP)

After running the migrations, I can verify via MCP:

- ✅ Query `prayercircle_prayers` table (should return empty array, not "table not found")
- ✅ Test `pray_for_request()` RPC function call
- ✅ Test `get_homepage_stats()` RPC function call

## Next Steps

**Please run the SQL migration manually using Option 1 above, then I can verify the results via MCP.**
