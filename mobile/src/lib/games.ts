import Constants from 'expo-constants';

const DEFAULT_GAMES_WEB_URL = 'https://godkingdomprinciplesradio.com/games';
const DEFAULT_GAMES_API_URL = 'https://godkingdomprinciplesradio.com/api/games';
const GAMES_SITE_ORIGIN = 'https://godkingdomprinciplesradio.com';

export type GkpGameId = 'righteous-quest' | 'word-search' | 'crossword';

export interface GkpGameMeta {
  id: GkpGameId;
  name: string;
  description: string;
  color: string;
  logoUrl: string;
}

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  level?: number | null;
  worms_killed?: number | null;
  words_found?: number | null;
  time_seconds?: number | null;
  created_at: string;
}

/** Main GKP Bible Games brand mark (same asset as godkingdomprinciplesradio.com/games). */
export const GKP_GAMES_BRAND_LOGO_URL =
  `${GAMES_SITE_ORIGIN}/apis/wp-content/uploads/2026/05/gkp-games-logo-1-600x600.png`;

export const GKP_GAMES: GkpGameMeta[] = [
  {
    id: 'righteous-quest',
    name: 'Righteous Quest',
    description:
      'Walk the Path of Righteousness and defeat sin-worms with the Word of God.',
    color: '#4ade80',
    logoUrl: `${GAMES_SITE_ORIGIN}/righteous-quest-logo.svg`,
  },
  {
    id: 'word-search',
    name: 'Bible Word Search',
    description: 'Find hidden Bible words across multiple difficulty levels.',
    color: '#22c55e',
    logoUrl: `${GAMES_SITE_ORIGIN}/word-search-logo.svg`,
  },
  {
    id: 'crossword',
    name: 'Bible Crossword',
    description: 'Test your Bible knowledge with crossword puzzles.',
    color: '#16a34a',
    logoUrl: `${GAMES_SITE_ORIGIN}/crossword-logo.svg`,
  },
];

export function getGamesWebBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { gamesWebUrl?: string } | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_GAMES_WEB_URL?.trim();
  const candidate = fromEnv || extra?.gamesWebUrl?.trim() || DEFAULT_GAMES_WEB_URL;
  return candidate.replace(/\/$/, '');
}

export function getGamesApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { gamesApiUrl?: string } | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_GAMES_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (extra?.gamesApiUrl?.trim()) {
    return extra.gamesApiUrl.trim().replace(/\/$/, '');
  }
  const apiRoot = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/$/, '');
  if (apiRoot) {
    return `${apiRoot}/games`;
  }
  return DEFAULT_GAMES_API_URL;
}

/** Build the website games URL (listing or a specific game). */
export function buildGamesUrl(gameId?: GkpGameId, playerName?: string): string {
  const base = getGamesWebBaseUrl();
  const origin = base.replace(/\/games\/?$/, '');
  const path = gameId ? `/games/${gameId}` : '/games';
  const params = new URLSearchParams({ source: 'mobile', mobile: '1' });
  const trimmedName = playerName?.trim();
  if (trimmedName) {
    params.set('player_name', trimmedName.slice(0, 30));
  }
  return `${origin}${path}?${params.toString()}`;
}

/** Prefer profile full name, then email local-part, for leaderboard display. */
export function resolveGamePlayerName(
  user: { fullname?: string | null; email?: string | null } | null | undefined,
): string | undefined {
  if (!user) {
    return undefined;
  }
  const fromProfile = user.fullname?.trim();
  if (fromProfile) {
    return fromProfile.slice(0, 30);
  }
  const emailLocal = user.email?.split('@')[0]?.trim();
  if (emailLocal) {
    return emailLocal.slice(0, 30);
  }
  return undefined;
}

export function formatGameScore(score: number): string {
  return score.toLocaleString('en-US');
}

export async function fetchGameLeaderboard(
  gameId: GkpGameId,
  limit = 5,
): Promise<LeaderboardEntry[]> {
  const base = getGamesApiBaseUrl();
  const url = `${base}/leaderboard/${gameId}?limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
