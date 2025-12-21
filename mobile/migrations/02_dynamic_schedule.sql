-- Dynamic Radio Schedule
-- Move hardcoded schedule to database for real-time updates

CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week TEXT NOT NULL, -- e.g., 'Mon-Fri', 'Saturday', 'Sunday'
    show_title TEXT NOT NULL,
    hosts TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Schedule is viewable by everyone"
    ON public.schedule FOR SELECT
    USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_day ON public.schedule(day_of_week);

-- Initial Data
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Mon–Fri', 'My Spouse, My Heart', 'Jeff & Suzie Spencer', '20:00:00', '21:00:00', false),
('Saturday', 'Kingdom Finances', 'Dr. Sarah Johnson', '10:00:00', '11:00:00', false),
('Sunday', 'Morning Worship Service', 'Pastor James Williams', '09:00:00', '11:30:00', false);

-- Grant permissions
GRANT SELECT ON public.schedule TO anon, authenticated;
