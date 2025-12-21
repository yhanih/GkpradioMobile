-- Populate Complete GKP Radio Schedule
-- This migration adds the full 24-hour daily programming schedule
-- Based on the official GKP Radio schedule document

-- First, clear the sample data from the previous migration
DELETE FROM public.schedule;

-- Insert complete daily schedule
-- Using "Mon-Fri" for regular weekday programming and "Daily" for automated/repeat content

-- Morning Programming (6 AM - 12 PM)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Mon-Fri', 'Wake-up Y''all', NULL, '06:00:00', '09:00:00', true),
('Mon-Fri', 'In Case You Did Not Know', NULL, '09:00:00', '10:00:00', true),
('Mon-Fri', 'Kingdom Teachings', 'Pastor Myles Monroe', '10:00:00', '11:00:00', true),
('Mon-Fri', 'Lunch with Jane Peter', 'Jane Peter', '11:00:00', '12:00:00', true);

-- Afternoon Programming (12 PM - 5 PM)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Mon-Fri', 'Marriage Talk', 'Dustin Scott', '12:00:00', '13:00:00', true),
('Mon-Fri', 'Testimonies', 'Stan Lewis', '13:00:00', '14:00:00', true),
('Mon-Fri', 'Bragging on My Kids', NULL, '14:00:00', '15:00:00', true),
('Mon-Fri', '4-Point Connect to Heaven', 'Evan', '15:00:00', '17:00:00', true);

-- Evening Programming (5 PM - 10 PM)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Mon-Fri', 'Sheffield Family Hour', 'Pastor George', '17:00:00', '18:00:00', true),
('Mon-Fri', 'Youth Corner', 'Melissa Burt', '18:00:00', '19:00:00', true),
('Mon-Fri', 'Let''s Talk Money', 'Steve Richards', '19:00:00', '20:00:00', true);

-- Bed Time Prayers (8 PM - 9 PM)
-- Note: These appear to run alongside other programming, possibly on different days
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Daily', 'Bed Time Prayer for Children', NULL, '20:00:00', '20:30:00', true),
('Daily', 'Bed Time Prayer for Youth', NULL, '20:30:00', '21:00:00', true);

-- Late Evening (8 PM - 10 PM alternate programming)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Mon-Fri', 'My Spouse, My Heart', 'Jeff & Suzie Spencer', '20:00:00', '21:00:00', true),
('Mon-Fri', 'Meditation & Relaxation', 'Joyce Smith', '21:00:00', '22:00:00', true);

-- Late Night Music (10 PM - 12 AM)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Daily', 'Praise & Worship Music', NULL, '22:00:00', '23:59:59', false);

-- Overnight Repeat Programming (12 AM - 6 AM)
INSERT INTO public.schedule (day_of_week, show_title, hosts, start_time, end_time, is_live)
VALUES 
('Daily', 'Wake-up Y''all (Repeat)', NULL, '00:00:00', '03:00:00', false),
('Daily', 'Kingdom Break', 'Pastor Myles Monroe', '03:00:00', '04:00:00', false),
('Daily', 'Marriage Talk (Repeat)', 'Dustin Scott', '04:00:00', '05:00:00', false),
('Daily', 'Testimonies (Repeat)', 'Stan Lewis', '05:00:00', '06:00:00', false);

-- Verify the data
SELECT 
    day_of_week,
    show_title,
    hosts,
    start_time,
    end_time,
    is_live
FROM public.schedule
ORDER BY start_time;
