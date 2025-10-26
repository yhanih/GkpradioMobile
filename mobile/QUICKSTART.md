# GKP Radio - Quick Start Guide

This guide will get your GKP Radio app up and running in **under 10 minutes**.

## Current Status

❌ **Database Not Set Up** - App shows "Unable to load content" errors
✅ **App Configuration** - Supabase credentials configured
✅ **Dependencies** - All packages installed
✅ **Build Configuration** - Ready for deployment

## 🚀 Step-by-Step Setup

### Step 1: Set Up Supabase Database (5 minutes)

**Why**: The app needs database tables to store prayers, testimonies, podcasts, and videos.

1. **Go to Supabase SQL Editor**
   - Open https://supabase.com/dashboard
   - Log in to your account
   - Select your project: `fychjnaxljwmgoptjsxn`
   - Click **SQL Editor** in the left sidebar

2. **Run the Schema SQL**
   - Click **New query**
   - Open `mobile/supabase_schema.sql` in this project
   - Copy **all contents** (Ctrl+A, Ctrl+C)
   - Paste into the Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`
   - ✅ Wait for success message (should take ~5 seconds)

3. **Verify Tables Were Created**
   - Click **Table Editor** in the left sidebar
   - You should see 7 tables:
     - ✅ profiles
     - ✅ prayer_requests
     - ✅ testimonies
     - ✅ podcasts
     - ✅ videos
     - ✅ likes
     - ✅ comments

4. **Add Sample Data** (optional but recommended)
   - Go back to **SQL Editor**
   - Click **New query**
   - Open `mobile/supabase_sample_data.sql`
   - Copy and paste **all contents**
   - Click **Run**
   - ✅ This adds 5 sample podcasts and 4 sample videos

**✨ Database setup complete!**

---

### Step 2: Restart the App (1 minute)

**Why**: The app needs to reload to fetch data from the newly created database.

```bash
# In the terminal, press Ctrl+C to stop the server
# Then restart it:
cd mobile
npx expo start --clear
```

**Expected Result**: 
- No more "Could not find table" errors
- Home screen shows stats (prayers, testimonies, content counts)
- All tabs load successfully

---

### Step 3: Test All Screens (2 minutes)

Open the app and verify each screen works:

#### ✅ Home Screen
- Should show greeting and stats card
- Should display featured podcasts/videos (if any)
- Pull to refresh should work

#### ✅ Community Screen
- Should show prayer requests and testimonies tabs
- Should display "No content" message if empty (normal for new setup)
- Stats should show "0 Prayers, 0 Testimonies"

#### ✅ Podcasts Screen
- Should show 5 sample podcasts (if you ran sample data SQL)
- Each podcast should have title, author, duration

#### ✅ Videos Screen
- Should show 4 sample videos (if you ran sample data SQL)
- Each video should have thumbnail and title

#### ✅ Profile Screen
- Should show sign-up/login screen if not authenticated
- After sign-up, should show profile edit form

---

### Step 4: Create a Test Account (1 minute)

1. **Open the app** on your device/simulator
2. **Navigate to Profile tab**
3. **Click "Sign Up"**
4. **Enter details**:
   - Email: `test@gkpradio.com`
   - Password: `TestPassword123!`
   - Full Name: `Test User`
5. **Click Sign Up**

**Expected Result**:
- Profile created successfully
- Redirected to profile screen
- Your name appears in the app

---

### Step 5: Add Sample Prayer & Testimony (2 minutes)

Now that you have a test account, add sample prayer requests and testimonies:

1. **Get your User ID**:
   - Go to Supabase Dashboard
   - Click **Authentication** → **Users**
   - Copy the ID of your test user (UUID)

2. **Run this SQL** (replace `USER_ID_HERE` with your actual user ID):

```sql
-- Add sample prayer requests
INSERT INTO public.prayer_requests (user_id, title, description, is_anonymous, status)
VALUES
    ('USER_ID_HERE', 'Guidance for Career Decision', 'I am facing a major career decision and need God''s wisdom. Please pray for clarity.', false, 'active'),
    ('USER_ID_HERE', 'Healing for a Friend', 'My close friend was diagnosed with illness. Praying for complete healing.', false, 'active');

-- Add sample testimonies
INSERT INTO public.testimonies (user_id, title, content, is_anonymous, is_featured)
VALUES
    ('USER_ID_HERE', 'God Provided for My Family', 'When I lost my job, God provided in miraculous ways. We never missed a meal!', false, true),
    ('USER_ID_HERE', 'Breakthrough in Prayer', 'After months of persistent prayer, God answered in an amazing way.', false, false);
```

3. **Refresh the app**:
   - Pull down on Community screen
   - You should now see your prayers and testimonies!

---

## ✅ You're Done!

Your app should now be **fully functional** with:

- ✅ All screens loading data
- ✅ Database properly configured
- ✅ Sample content visible
- ✅ User authentication working

---

## What's Next?

### For Testing:
- Try creating prayers and testimonies through the app (when UI is added)
- Test on multiple devices
- Invite friends to test

### For Production:
1. **Add Real Content**:
   - Replace sample podcasts/videos with real content
   - Add your actual radio stream URL
   - Configure AzuraCast if using live radio

2. **Build for Stores**:
   - Follow `DEPLOYMENT.md` for complete guide
   - Run `eas build --platform all --profile production`
   - Submit to App Store and Play Store

3. **Polish**:
   - Update icons to be square (1024x1024)
   - Add screenshots for stores
   - Create privacy policy

---

## Troubleshooting

### Still seeing "Unable to load content" errors?

**Solution**:
1. Verify tables exist in Supabase Table Editor
2. Check your Supabase URL and key in `mobile/.env`
3. Restart Expo server with `--clear` flag
4. Check logs for specific error messages

### "PGRST116" errors?

**Meaning**: Tables exist but have no data (completely normal)

**Solution**: Add sample data or create content through the app

### "PGRST205" errors?

**Meaning**: Tables don't exist in database

**Solution**: Run the `supabase_schema.sql` file again

### App crashes on launch?

**Solution**:
1. Run `npx expo-doctor` to check for issues
2. Clear cache: `npx expo start --clear`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

---

## Quick Commands Reference

```bash
# Start development server
cd mobile && npx expo start

# Clear cache and restart
cd mobile && npx expo start --clear

# Check for issues
cd mobile && npx expo-doctor

# Install dependencies
cd mobile && npm install

# Build for testing
cd mobile && eas build --platform ios --profile preview
cd mobile && eas build --platform android --profile preview
```

---

## Need More Help?

- **Database Setup**: See `DATABASE_SETUP.md`
- **Deployment**: See `DEPLOYMENT.md`
- **General Info**: See `README.md`

---

**Happy coding! 🎉**
