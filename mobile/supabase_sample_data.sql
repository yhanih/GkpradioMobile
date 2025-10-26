-- GKP Radio Sample Data
-- This file contains sample data for testing the GKP Radio mobile app
-- Run this AFTER running supabase_schema.sql

-- Note: You'll need to replace the UUID values below with actual user IDs
-- from your auth.users table after creating test accounts.
-- For now, we'll use placeholder UUIDs that you can update.

-- ============================================================================
-- SAMPLE PODCASTS
-- ============================================================================
INSERT INTO public.podcasts (title, description, audio_url, duration, thumbnail_url, author, category, is_featured, published_at)
VALUES
    (
        'Walking in Faith: Daily Devotional',
        'Join us as we explore the practical application of faith in our daily lives. This episode discusses overcoming challenges through prayer and trust in God.',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        240,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        'Pastor James Thompson',
        'Daily Devotionals',
        true,
        NOW() - INTERVAL '2 days'
    ),
    (
        'Understanding Scripture: Book of Romans',
        'A deep dive into the Book of Romans, exploring Paul''s powerful message about grace, faith, and righteousness. Perfect for Bible study groups.',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        1800,
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
        'Dr. Sarah Mitchell',
        'Bible Study',
        true,
        NOW() - INTERVAL '5 days'
    ),
    (
        'Marriage and Family in God''s Design',
        'Exploring biblical principles for strong marriages and healthy families. Practical wisdom for couples and parents.',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        1620,
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
        'Pastor Mark & Lisa Anderson',
        'Family & Relationships',
        false,
        NOW() - INTERVAL '1 week'
    ),
    (
        'Prayer Warriors: Intercession that Changes Lives',
        'Learn the power of intercessory prayer and how to effectively pray for others. Includes testimonies and practical prayer strategies.',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        1440,
        'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400',
        'Minister Grace Williams',
        'Prayer & Worship',
        false,
        NOW() - INTERVAL '10 days'
    ),
    (
        'Youth Empowerment: Finding Your Purpose',
        'A message for young people seeking God''s plan for their lives. Topics include career, relationships, and spiritual growth.',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        1380,
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        'Youth Pastor David Chen',
        'Youth Ministry',
        false,
        NOW() - INTERVAL '2 weeks'
    );

-- ============================================================================
-- SAMPLE VIDEOS
-- ============================================================================
INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, category, is_featured, published_at)
VALUES
    (
        'Sunday Worship Service - Breakthrough',
        'Experience our powerful Sunday worship service with uplifting praise, worship, and an inspiring message about breaking through barriers.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400',
        3600,
        'Sunday Service',
        true,
        NOW() - INTERVAL '3 days'
    ),
    (
        'Baptism Celebration - New Beginnings',
        'Witness the joy and celebration as new believers publicly declare their faith through baptism.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400',
        1200,
        'Special Events',
        true,
        NOW() - INTERVAL '1 week'
    ),
    (
        'Community Outreach Highlights',
        'See how our church is making a difference in the community through food drives, charity work, and acts of kindness.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',
        900,
        'Outreach',
        false,
        NOW() - INTERVAL '2 weeks'
    ),
    (
        'Worship Night - Encounter His Presence',
        'An evening dedicated to worship and praise. Join us as we encounter God''s presence through music and prayer.',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400',
        2700,
        'Worship',
        false,
        NOW() - INTERVAL '3 weeks'
    );

-- ============================================================================
-- INSTRUCTIONS FOR ADDING PRAYER REQUESTS AND TESTIMONIES
-- ============================================================================

-- To add sample prayer requests and testimonies, you need actual user IDs.
-- Follow these steps:

-- 1. Create test user accounts through your app or Supabase dashboard
-- 2. Get the user IDs from auth.users table
-- 3. Run queries like this (replace USER_ID_HERE with actual UUIDs):

/*
-- Sample Prayer Request
INSERT INTO public.prayer_requests (user_id, title, description, is_anonymous, status)
VALUES
    (
        'USER_ID_HERE',
        'Healing for My Family',
        'Please pray for my mother who is battling cancer. We believe in God''s healing power and ask for your prayers.',
        false,
        'active'
    );

-- Sample Testimony
INSERT INTO public.testimonies (user_id, title, content, is_anonymous, is_featured)
VALUES
    (
        'USER_ID_HERE',
        'God Restored My Marriage',
        'After years of struggle, God miraculously restored my marriage. Through prayer, counseling, and faith, we are stronger than ever. Glory to God!',
        false,
        true
    );
*/

-- ============================================================================
-- QUICK TEST: Verify Data Was Inserted
-- ============================================================================

-- Run these queries to verify the sample data:

-- Check podcasts
-- SELECT COUNT(*), COUNT(CASE WHEN is_featured THEN 1 END) as featured FROM public.podcasts;

-- Check videos
-- SELECT COUNT(*), COUNT(CASE WHEN is_featured THEN 1 END) as featured FROM public.videos;

-- Check prayer requests
-- SELECT COUNT(*) FROM public.prayer_requests;

-- Check testimonies
-- SELECT COUNT(*) FROM public.testimonies;

-- ============================================================================
-- CLEANUP (if needed)
-- ============================================================================

-- If you need to remove all sample data and start fresh:
/*
DELETE FROM public.comments;
DELETE FROM public.likes;
DELETE FROM public.prayer_requests;
DELETE FROM public.testimonies;
DELETE FROM public.videos;
DELETE FROM public.podcasts;
-- Note: Do NOT delete from profiles as they are linked to auth.users
*/
