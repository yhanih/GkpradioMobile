-- Migration: Create public.games table and populate with 5 initial games
-- Enable RLS and allow public SELECT access.

CREATE TABLE IF NOT EXISTS public.games (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    color text NOT NULL,
    logo_url text NOT NULL,
    icon text,
    route text,
    categories text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read access to everyone (anon and authenticated)
DROP POLICY IF EXISTS "games_read_all" ON public.games;
CREATE POLICY "games_read_all" ON public.games
    FOR SELECT TO public USING (true);

-- Insert/Update the 5 games
INSERT INTO public.games (id, name, description, color, logo_url, icon, route, categories)
VALUES
  (
    'righteous-quest',
    'Righteous Quest',
    'Walk the Path of Righteousness and defeat sin-worms with the Word of God.',
    '#4ade80',
    'https://godkingdomprinciplesradio.com/righteous-quest-logo.svg',
    '⚔️',
    '/games/righteous-quest',
    ARRAY['Action']
  ),
  (
    'word-search',
    'Bible Word Search',
    'Find hidden Bible words across multiple difficulty levels.',
    '#22c55e',
    'https://godkingdomprinciplesradio.com/word-search-logo.svg',
    '🔍',
    '/games/word-search',
    ARRAY['Puzzle', 'Word']
  ),
  (
    'crossword',
    'Bible Crossword',
    'Test your Bible knowledge with crossword puzzles.',
    '#16a34a',
    'https://godkingdomprinciplesradio.com/crossword-logo.svg',
    '📝',
    '/games/crossword',
    ARRAY['Puzzle', 'Word']
  ),
  (
    'wave-defender',
    'Kingdom Defender',
    'Defend the cross from oncoming sin-worms by clicking them. Set new high scores and top the leaderboard!',
    '#f59e0b',
    'https://godkingdomprinciplesradio.com/kingdom-defender-logo.svg',
    '🛡️',
    '/games/wave-defender',
    ARRAY['Action']
  ),
  (
    'bible-quiz',
    'GKP Bible Quiz',
    'Test your scripture knowledge with interactive trivia across Bronze, Silver, and Gold tiers.',
    '#f59e0b',
    'https://godkingdomprinciplesradio.com/bible-quiz-logo.svg',
    '❓',
    '/games/bible-quiz',
    ARRAY['Puzzle']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  logo_url = EXCLUDED.logo_url,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  categories = EXCLUDED.categories,
  updated_at = timezone('utc'::text, now());
