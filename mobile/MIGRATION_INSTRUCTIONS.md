# Migration Instructions - Push Token Column

## Quick Fix for 95/100 Readiness

This migration adds the `push_token` column to the `users` table, fixing the critical database schema issue.

---

## Step 1: Run the Migration in Supabase

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: **fychjnaxljwmgoptjsxn**

2. **Open SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run the Migration:**
   - Open the file: `mobile/migrations/06_add_push_token_column.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd+Enter / Ctrl+Enter)

4. **Verify Success:**
   - You should see: "Success. No rows returned"
   - Go to **Table Editor** > **users** table
   - Verify `push_token` column exists

---

## Step 2: Verify Expo Project ID (Optional but Recommended)

The Expo project ID is currently hardcoded. To make it configurable:

1. **Find your Expo Project ID:**
   - Go to: https://expo.dev
   - Select your project: **gkp-radio**
   - The Project ID is shown in the project settings
   - OR check `app.json` for the `owner` field

2. **Verify the ID matches:**
   - Current value: `3cc18e67-a1d7-4f5a-bcc5-48e3dde78f96`
   - If different, update in `mobile/src/lib/notifications.ts` line 33
   - OR add to `app.json` under `extra.expoProjectId`

---

## Step 3: Test Push Notifications

After running the migration:

1. **Test in the app:**
   - Open the app
   - Go to **Hub** tab
   - Toggle **Push Notifications** on
   - Check for errors in console
   - Verify no database errors occur

2. **Check the database:**
   - Go to Supabase **Table Editor** > **users**
   - Find your user row
   - Verify `push_token` column has a value (if notifications enabled)

---

## What This Fixes

✅ **Database Schema Issue:** `push_token` column now exists  
✅ **TypeScript Types:** Updated to include `push_token`  
✅ **No More Errors:** Push notification toggle won't crash  

---

## Next Steps After Migration

Once this is done, you'll be at **95/100** readiness. Remaining items:
- Fix app icons (make them square)
- Test on real devices
- Configure Sentry (optional)

---

## Troubleshooting

**Error: "column push_token already exists"**
- This is fine! The column already exists. Migration is safe to run multiple times.

**Error: "relation users does not exist"**
- Your table might be named differently. Check `SCHEMA_REFERENCE.md` for actual table names.

**Push notifications still not working**
- This is expected - you need a backend to send notifications
- Token storage is working, but sending requires a Supabase Edge Function or backend service












