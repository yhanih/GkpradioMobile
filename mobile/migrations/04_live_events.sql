-- Live Events for Video Streaming
-- Create table to manage live streaming events (YouTube Live style)

CREATE TABLE IF NOT EXISTS public.live_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    is_featured BOOLEAN DEFAULT false,
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Live events are viewable by everyone"
    ON public.live_events FOR SELECT
    USING (true);

-- Only authenticated users can insert/update (admin control)
CREATE POLICY "Authenticated users can manage live events"
    ON public.live_events FOR ALL
    USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_events_status ON public.live_events(status);
CREATE INDEX IF NOT EXISTS idx_live_events_scheduled_start ON public.live_events(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_events_featured ON public.live_events(is_featured) WHERE is_featured = true;

-- Sample Data
INSERT INTO public.live_events (title, description, video_url, thumbnail_url, scheduled_start, scheduled_end, status, is_featured, viewer_count)
VALUES 
-- Currently Live Event
('Sunday Morning Worship Service', 'Join us for an inspiring worship experience with praise, worship, and powerful teaching from God''s Word.', 
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
 NOW() - INTERVAL '30 minutes', 
 NOW() + INTERVAL '1 hour 30 minutes', 
 'live', 
 true, 
 247),

-- Upcoming Events
('Wednesday Night Bible Study', 'Deep dive into the Book of Romans with Pastor James. Bring your questions and join the discussion!',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'https://images.unsplash.com/photo-1585564804671-034f1c0b52d1?w=800',
 NOW() + INTERVAL '2 days',
 NOW() + INTERVAL '2 days 2 hours',
 'scheduled',
 false,
 0),

('Youth Connect Live', 'Interactive youth service with worship, games, and relevant teaching for teenagers.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800',
 NOW() + INTERVAL '4 days',
 NOW() + INTERVAL '4 days 1 hour',
 'scheduled',
 true,
 0),

-- Past Event
('Christmas Special Service', 'Celebrate the birth of our Savior with carols, testimonies, and a special Christmas message.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800',
 NOW() - INTERVAL '5 days',
 NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
 'ended',
 false,
 532);

-- Grant permissions
GRANT SELECT ON public.live_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_events TO authenticated;
