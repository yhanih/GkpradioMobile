# GKP Radio Database Setup Guide

This guide will walk you through setting up the Supabase database for the GKP Radio mobile app.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A Supabase project created
- Your Supabase URL and anon key (already configured in `mobile/.env`)

## Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Log in to your Supabase dashboard at https://supabase.com
2. Select your project: **fychjnaxljwmgoptjsxn**
3. Click on the **SQL Editor** icon in the left sidebar

### Step 2: Run the Schema SQL

1. Click **New query** to create a new SQL query
2. Open the file `mobile/supabase_schema.sql` in this project
3. Copy the entire contents of the file
4. Paste it into the Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

**Expected Result**: You should see a success message. This creates all the necessary tables:
- `profiles`
- `prayer_requests`
- `testimonies`
- `podcasts`
- `videos`
- `likes`
- `comments`

### Step 3: Verify Tables Were Created

1. Click on the **Table Editor** icon in the left sidebar
2. You should see all 7 tables listed
3. Click on each table to verify it has the correct columns

### Step 4: Add Sample Data (Optional but Recommended)

1. Go back to the **SQL Editor**
2. Click **New query**
3. Open the file `mobile/supabase_sample_data.sql`
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click **Run**

**Expected Result**: Sample podcasts and videos will be added to your database.

### Step 5: Create Test User Accounts

To test prayer requests and testimonies (which require authenticated users):

#### Option A: Using the Mobile App
1. Run the app on your device or simulator
2. Navigate to the Profile tab
3. Click "Sign Up"
4. Create a test account with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`

#### Option B: Using Supabase Dashboard
1. Go to **Authentication** > **Users** in the Supabase dashboard
2. Click **Add user** > **Create new user**
3. Enter email and password
4. Click **Create user**

### Step 6: Add Sample Prayer Requests and Testimonies

After creating a test user:

1. Go to **Authentication** > **Users** in Supabase
2. Copy the user ID (UUID) of your test user
3. Go to **SQL Editor** and create a new query
4. Run this SQL (replace `USER_ID_HERE` with your actual user ID):

```sql
-- Add a sample prayer request
INSERT INTO public.prayer_requests (user_id, title, description, is_anonymous, status)
VALUES
    (
        'USER_ID_HERE',
        'Guidance for Career Decision',
        'I am facing a major career decision and need God''s wisdom and guidance. Please pray for clarity and peace.',
        false,
        'active'
    ),
    (
        'USER_ID_HERE',
        'Healing for a Friend',
        'My close friend was diagnosed with a serious illness. Praying for complete healing and strength for their family.',
        false,
        'active'
    );

-- Add a sample testimony
INSERT INTO public.testimonies (user_id, title, content, is_anonymous, is_featured)
VALUES
    (
        'USER_ID_HERE',
        'God Provided for My Family',
        'When I lost my job, I didn''t know how we would make it. But God provided in miraculous ways - through unexpected blessings and opportunities. We never missed a meal, and I found an even better job. God is faithful!',
        false,
        true
    ),
    (
        'USER_ID_HERE',
        'Breakthrough in Prayer',
        'After months of persistent prayer, God answered in an amazing way. I learned that His timing is perfect, and He hears every prayer.',
        false,
        false
    );
```

### Step 7: Verify All Data

Run these queries in the SQL Editor to verify everything is set up:

```sql
-- Check all tables have data
SELECT 'podcasts' as table_name, COUNT(*) as count FROM public.podcasts
UNION ALL
SELECT 'videos', COUNT(*) FROM public.videos
UNION ALL
SELECT 'prayer_requests', COUNT(*) FROM public.prayer_requests
UNION ALL
SELECT 'testimonies', COUNT(*) FROM public.testimonies
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;
```

You should see:
- 5 podcasts
- 4 videos
- 2+ prayer requests (if you added them)
- 2+ testimonies (if you added them)
- 1+ profiles (your test user)

## Testing the App

After completing the database setup:

1. **Stop and restart the Expo dev server**:
   ```bash
   cd mobile
   npx expo start --clear
   ```

2. **Test each screen**:
   - **Home**: Should show featured podcasts, videos, and testimonies
   - **Community**: Should show prayer requests and testimonies
   - **Podcasts**: Should show all 5 sample podcasts
   - **Videos**: Should show all 4 sample videos
   - **Profile**: Should show user profile (if logged in)

## Troubleshooting

### Error: "Could not find the table 'public.X' in the schema cache"

**Solution**: 
1. Make sure you ran the `supabase_schema.sql` successfully
2. Verify tables exist in **Table Editor**
3. Try restarting your Expo dev server with `--clear` flag

### Error: "PGRST116" (No rows found)

**Solution**: This is normal for empty tables. Add sample data using `supabase_sample_data.sql`.

### Error: "PGRST301" (Permission denied)

**Solution**: 
1. Check that Row Level Security (RLS) policies were created
2. Verify you're signed in if accessing user-specific data
3. Re-run the schema SQL to ensure all policies are in place

### Tables not showing in Table Editor

**Solution**:
1. Refresh the Supabase dashboard
2. Check the SQL output for any error messages
3. Try running the schema SQL again (it's safe to run multiple times)

### Cannot insert data - Foreign key constraint errors

**Solution**:
1. For prayer_requests and testimonies: You MUST have a valid user_id from the profiles table
2. Create a user account first (either through the app or Supabase dashboard)
3. Use that user's ID when inserting data

## Row Level Security (RLS)

The database is configured with Row Level Security for data protection:

- **Public read access**: Anyone can view podcasts, videos, prayer requests, testimonies
- **Authenticated write**: Only logged-in users can create content
- **Owner edit/delete**: Users can only edit/delete their own content

This ensures data security while keeping content accessible to all users.

## Next Steps

After your database is set up:

1. Test all app screens to ensure data loads correctly
2. Try creating new prayer requests and testimonies through the app
3. Test the like and comment features (when implemented)
4. Add your own real content to replace sample data

## Need Help?

- Check the Supabase documentation: https://supabase.com/docs
- Review error logs in the Expo console
- Verify your Supabase URL and anon key in `mobile/.env`
