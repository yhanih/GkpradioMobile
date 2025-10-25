# Supabase Row Level Security (RLS) Policies

This document outlines the required RLS policies for all tables in the GKP Radio Supabase database to ensure proper security.

## Critical Security Requirements

All tables must have RLS enabled and appropriate policies to prevent unauthorized access.

## Table-Specific RLS Policies

### 1. **users** Table
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (public directory)
CREATE POLICY "Public profiles are viewable by everyone"
ON users FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Only authenticated users can insert (handled by auth)
CREATE POLICY "Authenticated users can create profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

### 2. **contactMessages** Table
```sql
-- Enable RLS
ALTER TABLE contactMessages ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can insert contact messages
CREATE POLICY "Anyone can submit contact message"
ON contactMessages FOR INSERT
WITH CHECK (true); -- Public form, but rate-limited at application level

-- Only admins can view contact messages
CREATE POLICY "Only admins can view contact messages"
ON contactMessages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can update contact messages (mark as read)
CREATE POLICY "Only admins can update contact messages"
ON contactMessages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 3. **notifications** Table
```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = userId);

-- System/Edge Functions can create notifications (service role)
-- No INSERT policy for regular users

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = userId);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = userId);
```

### 4. **episodes** Table
```sql
-- Enable RLS
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Everyone can view published episodes
CREATE POLICY "Public episodes are viewable by everyone"
ON episodes FOR SELECT
USING (isPublished = true);

-- Only admins can insert episodes
CREATE POLICY "Only admins can create episodes"
ON episodes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can update episodes
CREATE POLICY "Only admins can update episodes"
ON episodes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can delete episodes
CREATE POLICY "Only admins can delete episodes"
ON episodes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 5. **videos** Table
```sql
-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view published videos
CREATE POLICY "Public videos are viewable by everyone"
ON videos FOR SELECT
USING (isPublished = true);

-- Only admins can insert videos
CREATE POLICY "Only admins can create videos"
ON videos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can update videos
CREATE POLICY "Only admins can update videos"
ON videos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can delete videos
CREATE POLICY "Only admins can delete videos"
ON videos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 6. **communityThreads** Table
```sql
-- Enable RLS
ALTER TABLE communityThreads ENABLE ROW LEVEL SECURITY;

-- Everyone can view public threads
CREATE POLICY "Public threads are viewable by everyone"
ON communityThreads FOR SELECT
USING (true);

-- Authenticated users can create threads
CREATE POLICY "Authenticated users can create threads"
ON communityThreads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update their own threads
CREATE POLICY "Users can update own threads"
ON communityThreads FOR UPDATE
USING (auth.uid() = userId);

-- Users can only delete their own threads (soft delete)
CREATE POLICY "Users can delete own threads"
ON communityThreads FOR DELETE
USING (auth.uid() = userId);
```

### 7. **communityComments** Table
```sql
-- Enable RLS
ALTER TABLE communityComments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Public comments are viewable by everyone"
ON communityComments FOR SELECT
USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON communityComments FOR INSERT
WITH CHECK (auth.uid() = userId);

-- Users can only update their own comments
CREATE POLICY "Users can update own comments"
ON communityComments FOR UPDATE
USING (auth.uid() = userId);

-- Users can only delete their own comments
CREATE POLICY "Users can delete own comments"
ON communityComments FOR DELETE
USING (auth.uid() = userId);
```

### 8. **sponsors** Table
```sql
-- Enable RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Everyone can view active sponsors
CREATE POLICY "Public sponsors are viewable by everyone"
ON sponsors FOR SELECT
USING (isActive = true);

-- Only admins can insert sponsors
CREATE POLICY "Only admins can create sponsors"
ON sponsors FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can update sponsors
CREATE POLICY "Only admins can update sponsors"
ON sponsors FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Only admins can delete sponsors
CREATE POLICY "Only admins can delete sponsors"
ON sponsors FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

### 9. **liveChatMessages** Table (NEW - Required for Live page)
```sql
-- Create table for live chat persistence
CREATE TABLE liveChatMessages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  isVerified BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  roomId VARCHAR(100) DEFAULT 'main'
);

-- Enable RLS
ALTER TABLE liveChatMessages ENABLE ROW LEVEL SECURITY;

-- Everyone can view recent chat messages
CREATE POLICY "Recent chat messages are public"
ON liveChatMessages FOR SELECT
USING (
  timestamp > (NOW() - INTERVAL '24 hours')
);

-- Anyone can insert chat messages (rate-limited at app level)
CREATE POLICY "Anyone can send chat messages"
ON liveChatMessages FOR INSERT
WITH CHECK (true);

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
ON liveChatMessages FOR DELETE
USING (auth.uid() = userId);
```

### 10. **newsletterSubscribers** Table
```sql
-- Enable RLS
ALTER TABLE newsletterSubscribers ENABLE ROW LEVEL SECURITY;

-- Only admins can view subscribers
CREATE POLICY "Only admins can view subscribers"
ON newsletterSubscribers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Anyone can subscribe (public form)
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletterSubscribers FOR INSERT
WITH CHECK (true);

-- Subscribers can update their own record (unsubscribe)
CREATE POLICY "Subscribers can update own subscription"
ON newsletterSubscribers FOR UPDATE
USING (email = auth.jwt()->>'email');
```

## Storage Bucket Policies

### Avatar Bucket
```sql
-- Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Implementation Priority

1. **CRITICAL - Immediate**: contactMessages, notifications, users
2. **HIGH - Phase 1**: communityThreads, communityComments, sponsors
3. **MEDIUM - Phase 2**: episodes, videos, liveChatMessages
4. **LOW - Phase 3**: newsletterSubscribers, storage buckets

## Testing RLS Policies

Use the Supabase SQL Editor to test policies:

```sql
-- Test as anonymous user
SET ROLE anon;
SELECT * FROM contactMessages; -- Should fail

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM notifications; -- Should only show user's notifications

-- Reset to default
RESET ROLE;
```

## Notes

- All admin operations should be moved to Edge Functions with service role access
- Rate limiting should be implemented at the application level for public forms
- Consider implementing CAPTCHA for public forms to prevent abuse
- Regular audit of RLS policies is recommended