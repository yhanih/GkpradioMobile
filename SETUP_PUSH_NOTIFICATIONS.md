# Setup Push Notifications - Complete Guide

This guide will help you set up push notifications fully by adding the `push_token` column to your database.

## Option 1: Using Supabase MCP Server (Recommended - Automated)

If you have the Supabase MCP server configured, I can run the migration directly. Otherwise, follow the setup steps below.

### Setup MCP Server (One-time setup)

1. **Get your Supabase Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn
   - Click **Settings** → **API**
   - Copy the **service_role** key (NOT the anon key)

2. **Configure MCP in Cursor:**
   - Edit `~/.cursor/mcp.json` (create if it doesn't exist)
   - Add this configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "https://fychjnaxljwmgoptjsxn.supabase.co",
        "SUPABASE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

3. **Replace `YOUR_SERVICE_ROLE_KEY_HERE`** with your actual service role key

4. **Restart Cursor:**
   - Quit Cursor completely (Cmd+Q)
   - Reopen Cursor
   - The MCP server will connect automatically

5. **Once connected, ask me to run the migration!**

---

## Option 2: Manual Migration via Dashboard (Quick - 2 minutes)

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/fychjnaxljwmgoptjsxn/sql/new

2. **Copy and paste this SQL:**

```sql
-- Add push_token column to users table for push notification support
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.push_token IS 'Expo push notification token for sending push notifications to this user';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users(push_token) 
WHERE push_token IS NOT NULL;
```

3. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)

4. **Verify success:**
   - You should see: "Success. No rows returned"
   - Go to **Table Editor** → **users** table
   - Verify `push_token` column exists

---

## Option 3: Using Supabase CLI (If installed)

If you have the Supabase CLI installed:

```bash
# Set your service role key
export SUPABASE_ACCESS_TOKEN=your_service_role_key

# Run the migration
supabase db execute --file mobile/migrations/06_add_push_token_column.sql
```

---

## Verify Push Notifications Work

After running the migration:

1. **Test in the app:**
   - Open the app
   - Go to **Hub** tab
   - Toggle **Push Notifications** on
   - Check for errors in console
   - Verify no database errors occur

2. **Check the database:**
   - Go to Supabase **Table Editor** → **users**
   - Find your user row
   - Verify `push_token` column has a value (if notifications enabled)

---

## What This Fixes

✅ **Database Schema:** `push_token` column now exists  
✅ **TypeScript Types:** Already updated to include `push_token`  
✅ **No More Errors:** Push notification toggle won't crash  
✅ **Full Functionality:** Push notifications will work end-to-end

---

## Next Steps

Once the migration is complete:
- Push notifications will be fully functional
- Users can enable/disable notifications in the Hub screen
- Tokens will be stored in the database
- You can send push notifications via Expo's push notification service

---

**Need help?** Let me know which option you'd like to use, and I'll guide you through it!

