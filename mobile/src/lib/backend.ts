import { supabase } from './supabase';
import { PostType, getPostTypeForCategory, isPrayerCategory } from '../constants/categories';
import { isCommunityTextBlocked, UGC_FILTER_USER_MESSAGE } from '../utils/contentUgcFilter';
import { resolveRadioTrackArtist, resolveRadioTrackTitle } from './radioNowPlaying';

export type SortOption = 'newest' | 'popular' | 'discussed';

export interface BackendThread {
  id: string;
  title: string;
  content: string;
  category: string;
  post_type: PostType | null;
  createdat: string;
  like_count: number;
  prayer_count: number;
  comment_count: number;
  user_has_liked: boolean;
  user_has_prayed: boolean;
  userid: string;
  is_anonymous: boolean;
  ispinned: boolean;
  users: {
    id: string;
    fullname: string | null;
    avatarurl: string | null;
    avatarseed: string | null;
  } | null;
}

export interface BackendComment {
  id: string;
  threadid: string;
  userid: string;
  content: string;
  createdat: string;
  users: {
    id: string;
    fullname: string | null;
    avatarurl: string | null;
    avatarseed: string | null;
  } | null;
}

export interface BackendMediaItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  thumbnail_url?: string;
  audio_url?: string;
  video_url?: string;
  duration?: number;
  category?: string;
  is_featured?: boolean;
}

export interface BackendLiveEvent {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  is_featured?: boolean;
  viewer_count?: number;
}

export interface BackendRadioStatus {
  is_live: boolean;
  current_show?: string;
  stream_url: string;
  now_playing?: {
    title: string;
    artist: string;
    art?: string;
    text?: string;
  };
}

export interface RadioQueueItem {
  title: string;
  artist: string;
}

export interface RadioQueueInfo {
  upNext: RadioQueueItem | null;
  recent: RadioQueueItem[];
}

export interface HomeStats {
  familyMembers: number;
  prayersLifted: number;
  mediaItems: number;
}

export type CreatePostErrorCode = 'validation' | 'auth' | 'network' | 'timeout' | 'unknown';
export type ReactionType = 'like' | 'pray';

export class CreatePostError extends Error {
  code: CreatePostErrorCode;
  constructor(code: CreatePostErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const STREAM_URL_FALLBACK =
  process.env.EXPO_PUBLIC_STREAM_URL ||
  'http://74.208.102.89:8080/listen/gkp_radio/radio.mp3';

const AZURACAST_NOW_PLAYING_URL =
  process.env.EXPO_PUBLIC_AZURACAST_NOW_PLAYING_URL ||
  'https://stream.godkingdomprinciplesradio.com/api/nowplaying/gkp_radio';

const AZURACAST_NOW_PLAYING_FALLBACK_URL =
  'http://74.208.102.89:8080/api/nowplaying/gkp_radio';

const WORDPRESS_RADIO_STATUS_URL =
  process.env.EXPO_PUBLIC_WORDPRESS_RADIO_STATUS_URL ||
  'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/radio-status';
const WORDPRESS_API_BASE_URL =
  process.env.EXPO_PUBLIC_WORDPRESS_API_BASE_URL ||
  'https://godkingdomprinciplesradio.com/apis/wp-json';

const LIVE_VIDEO_URL_FALLBACK =
  process.env.EXPO_PUBLIC_LIVE_VIDEO_URL ||
  process.env.EXPO_PUBLIC_OWNCAST_URL ||
  '';

const LIVE_VIDEO_TITLE_FALLBACK =
  process.env.EXPO_PUBLIC_LIVE_VIDEO_TITLE ||
  'Kingdom Principles Live Show';

const LIVE_VIDEO_THUMBNAIL_FALLBACK = process.env.EXPO_PUBLIC_LIVE_VIDEO_THUMBNAIL_URL || undefined;

const POST_TITLE_MIN = 3;
const POST_TITLE_MAX = 100;
const POST_CONTENT_MIN = 10;
const POST_CONTENT_MAX = 1000;
const CREATE_POST_TIMEOUT_MS = 12000;
const ALLOWED_POST_CATEGORIES = new Set([
  'Prayer Requests',
  'Pray for Others',
  'Testimonies',
  'Praise & Worship',
  'Words of Encouragement',
  'Born Again',
  'Youth Voices',
  'Sharing Hobbies',
  'Physical & Mental Health',
  'Money & Finances',
  'To My Wife',
  'To My Husband',
  'Bragging on My Child (ren)',
]);

export function sanitizeText(value: string | null | undefined): string {
  return (value || '').replace(/<[^>]*>?/gm, '');
}

function parseDurationToSeconds(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parts = value
    .trim()
    .split(':')
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return undefined;
}

function extractEmbeddedMediaUrl(html: string, type: 'audio' | 'video'): string | undefined {
  if (!html) return undefined;
  const sourceRegex = /<source[^>]+src=["']([^"']+)["']/i;
  const tagRegex = type === 'audio'
    ? /<audio[^>]+src=["']([^"']+)["']/i
    : /<video[^>]+src=["']([^"']+)["']/i;
  const sourceMatch = html.match(sourceRegex);
  if (sourceMatch?.[1]) return sourceMatch[1];
  const tagMatch = html.match(tagRegex);
  return tagMatch?.[1];
}

async function fetchWordPressCollection(postType: 'podcasts' | 'videos', limit: number): Promise<any[]> {
  const perPage = Math.max(1, Math.min(limit, 100));
  const response = await fetch(
    `${WORDPRESS_API_BASE_URL}/wp/v2/${postType}?per_page=${perPage}&_embed=1`
  );
  if (!response.ok) {
    throw new Error(`WordPress ${postType} fetch failed (${response.status})`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

function dedupeThreads(threads: BackendThread[]): BackendThread[] {
  const seen = new Set<string>();
  const result: BackendThread[] = [];
  for (const thread of threads) {
    if (seen.has(thread.id)) continue;
    seen.add(thread.id);
    result.push(thread);
  }
  return result;
}

function isMissingSchemaError(error: any, marker: string): boolean {
  const message = String(error?.message || '').toLowerCase();
  return message.includes(marker.toLowerCase()) || message.includes('does not exist');
}

/** True when the error likely means this column is absent on public.posts (PostgREST/Postgres wording). */
function errorSuggestsMissingPostsColumn(error: any, column: string): boolean {
  const message = String(error?.message || '').toLowerCase();
  const col = column.toLowerCase();
  if (!message.includes(col)) return false;
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  );
}

async function loadPostsWithCompatibility(
  page?: number,
  pageSize?: number,
  category?: string,
  postType?: PostType | null
) {
  const selectWithTypeAndAnonymous =
    'id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous';

  let query1 = supabase
    .from('posts')
    .select(selectWithTypeAndAnonymous)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query1 = query1.eq('category', category);
  }
  if (postType) {
    query1 = query1.eq('post_type', postType);
  }

  if (page !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query1 = query1.range(from, to);
  } else {
    query1 = query1.limit(100);
  }

  const withTypeAndAnonymous = await query1;

  if (!withTypeAndAnonymous.error) {
    return withTypeAndAnonymous;
  }

  let query2 = supabase
    .from('posts')
    .select('id,title,content,category,post_type,author_id,is_pinned,created_at')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query2 = query2.eq('category', category);
  }
  if (postType) {
    query2 = query2.eq('post_type', postType);
  }

  if (page !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query2 = query2.range(from, to);
  } else {
    query2 = query2.limit(100);
  }

  const withTypeOnly = await query2;

  if (!withTypeOnly.error) {
    return withTypeOnly;
  }

  if (!isMissingSchemaError(withTypeOnly.error, 'post_type')) {
    return withTypeOnly;
  }

  let query3 = supabase
    .from('posts')
    .select('id,title,content,category,author_id,is_pinned,created_at')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query3 = query3.eq('category', category);
  }

  if (page !== undefined && pageSize !== undefined) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query3 = query3.range(from, to);
  } else {
    query3 = query3.limit(100);
  }

  return query3;
}

function isMissingTableError(error: any, tableName: string): boolean {
  return isMissingSchemaError(error, tableName);
}

export async function fetchBlockedUserIds(blockerId: string): Promise<string[]> {
  if (!blockerId?.trim()) return [];
  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', blockerId);
  if (error) {
    if (isMissingTableError(error, 'blocked_users')) {
      return [];
    }
    console.warn('[backend] fetchBlockedUserIds:', error.message);
    return [];
  }
  return (data || []).map((row: { blocked_id: string }) => row.blocked_id);
}

async function ensureModerationProfile(userId: string): Promise<void> {
  const { data, error: readError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (readError) {
    throw new Error(readError.message || 'Could not verify your profile.');
  }
  if (data?.id) return;

  const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId });
  if (upsertError) {
    throw new Error(upsertError.message || 'Could not prepare your profile for this action.');
  }
}

export async function blockCommunityUser(blockerId: string, blockedId: string): Promise<void> {
  if (!blockerId?.trim() || !blockedId?.trim()) {
    throw new CreatePostError('validation', 'Missing user.');
  }
  if (blockerId === blockedId) {
    throw new CreatePostError('validation', 'You cannot block yourself.');
  }
  await ensureModerationProfile(blockerId);
  await ensureModerationProfile(blockedId);

  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error) {
    if (error.code === '23505') {
      return;
    }
    throw new Error(error.message || 'Failed to block user');
  }
}

export async function unblockCommunityUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw new Error(error.message || 'Failed to unblock user');
}

export type CommunityReportTarget = 'post' | 'comment' | 'user' | 'live_chat_message';

export async function reportCommunityContent(params: {
  reporterId: string;
  targetType: CommunityReportTarget;
  targetId: string;
  reason?: string | null;
}): Promise<void> {
  await ensureModerationProfile(params.reporterId);

  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason?.trim() || null,
    status: 'pending',
  });
  if (error) throw new Error(error.message || 'Failed to submit report');
}

async function getReactionAggregates(
  postIds: string[],
  currentUserId?: string
): Promise<{
  likeCounts: Map<string, number>;
  prayCounts: Map<string, number>;
  userLiked: Set<string>;
  userPrayed: Set<string>;
}> {
  const likeCounts = new Map<string, number>();
  const prayCounts = new Map<string, number>();
  const userLiked = new Set<string>();
  const userPrayed = new Set<string>();

  if (!postIds.length) {
    return { likeCounts, prayCounts, userLiked, userPrayed };
  }

  const [countsRes, userReactionsRes] = await Promise.all([
    supabase
      .from('post_reaction_counts')
      .select('post_id, like_count, prayer_count')
      .in('post_id', postIds),
    currentUserId
      ? supabase
          .from('post_reactions')
          .select('post_id, reaction_type')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (countsRes.error) {
    // Legacy fallback (no post_reaction_counts view yet, fallback to querying all reactions)
    const reactionsRes = await supabase
      .from('post_reactions')
      .select('post_id,user_id,reaction_type')
      .in('post_id', postIds);

    if (!reactionsRes.error) {
      (reactionsRes.data || []).forEach((row: { post_id: string; user_id: string; reaction_type: ReactionType }) => {
        if (row.reaction_type === 'pray') {
          prayCounts.set(row.post_id, (prayCounts.get(row.post_id) || 0) + 1);
          if (currentUserId && row.user_id === currentUserId) {
            userPrayed.add(row.post_id);
          }
        } else {
          likeCounts.set(row.post_id, (likeCounts.get(row.post_id) || 0) + 1);
          if (currentUserId && row.user_id === currentUserId) {
            userLiked.add(row.post_id);
          }
        }
      });
      return { likeCounts, prayCounts, userLiked, userPrayed };
    }

    if (!isMissingSchemaError(reactionsRes.error, 'post_reactions')) {
      throw new Error(reactionsRes.error.message);
    }

    // Backward compatibility fallback: legacy post_likes table.
    const likesRes = await supabase.from('post_likes').select('post_id,user_id').in('post_id', postIds);
    if (likesRes.error) {
      throw new Error(likesRes.error.message);
    }

    (likesRes.data || []).forEach((row: { post_id: string; user_id: string }) => {
      likeCounts.set(row.post_id, (likeCounts.get(row.post_id) || 0) + 1);
      prayCounts.set(row.post_id, (prayCounts.get(row.post_id) || 0) + 1);
      if (currentUserId && row.user_id === currentUserId) {
        userLiked.add(row.post_id);
        userPrayed.add(row.post_id);
      }
    });

    return { likeCounts, prayCounts, userLiked, userPrayed };
  }

  (countsRes.data || []).forEach((row: { post_id: string; like_count: number; prayer_count: number }) => {
    likeCounts.set(row.post_id, row.like_count || 0);
    prayCounts.set(row.post_id, row.prayer_count || 0);
  });

  if (!userReactionsRes.error) {
    (userReactionsRes.data || []).forEach((row: { post_id: string; reaction_type: ReactionType }) => {
      if (row.reaction_type === 'pray') {
        userPrayed.add(row.post_id);
      } else {
        userLiked.add(row.post_id);
      }
    });
  }

  return { likeCounts, prayCounts, userLiked, userPrayed };
}

function normalizePostTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePostContent(value: string): string {
  return value.trim();
}

/** PostgREST / Postgres message when ugc_text_is_blocked trigger rejects a row. */
function mapUgcDbBlockMessage(raw: string | undefined): CreatePostError | null {
  const m = String(raw || '').toLowerCase();
  if (!m) return null;
  if (m.includes('content violates community guidelines') || m.includes('ugc_content')) {
    return new CreatePostError('validation', UGC_FILTER_USER_MESSAGE);
  }
  return null;
}

function mapCreatePostError(error: unknown): CreatePostError {
  if (error instanceof CreatePostError) return error;
  const message = error instanceof Error ? error.message : 'Failed to create post';
  const fromDb = mapUgcDbBlockMessage(message);
  if (fromDb) return fromDb;
  const lower = message.toLowerCase();
  if (lower.includes('timeout')) return new CreatePostError('timeout', 'Request timed out');
  if (
    lower.includes('jwt') ||
    lower.includes('auth') ||
    lower.includes('permission') ||
    lower.includes('row-level security')
  ) {
    return new CreatePostError('auth', 'Authentication is required');
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return new CreatePostError('network', 'Network error while creating post');
  }
  return new CreatePostError('unknown', message);
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new CreatePostError('timeout', `Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function fetchCommunityPosts(
  sortBy: SortOption,
  currentUserId?: string,
  page?: number,
  pageSize?: number,
  category?: string,
  postType?: PostType | null
): Promise<BackendThread[]> {
  const { data: posts, error } = await loadPostsWithCompatibility(page, pageSize, category, postType);

  if (error || !posts) {
    throw new Error(error?.message || 'Failed to load posts');
  }

  let combinedRaw = [...posts];

  if (page === 1) {
    try {
      const { data: pinnedData } = await supabase
        .from('posts')
        .select('id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous')
        .eq('is_pinned', true);

      if (pinnedData && pinnedData.length > 0) {
        let filteredPinned = pinnedData;
        if (category && category !== 'all') {
          filteredPinned = filteredPinned.filter((p) => p.category === category);
        }
        if (postType) {
          filteredPinned = filteredPinned.filter((p) => p.post_type === postType);
        }
        combinedRaw = [...filteredPinned, ...combinedRaw];
      }
    } catch (pinErr) {
      console.warn('[backend] Failed to fetch pinned posts:', pinErr);
    }
  }

  const blockedIds = currentUserId ? new Set(await fetchBlockedUserIds(currentUserId)) : new Set<string>();
  const visiblePosts = combinedRaw.filter((p: { author_id: string }) => !blockedIds.has(p.author_id));

  const postIds = visiblePosts.map((p) => p.id);
  const authorIds = [...new Set(visiblePosts.map((p) => p.author_id))];

  const [reactionAgg, commentsRes, profilesRes] = await Promise.all([
    getReactionAggregates(postIds, currentUserId),
    postIds.length
      ? supabase.from('post_comment_counts').select('post_id, comment_count').in('post_id', postIds)
      : Promise.resolve({ data: [], error: null } as any),
    authorIds.length
      ? supabase.from('profiles').select('id,full_name,avatar_url,avatar_seed').in('id', authorIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const profiles = profilesRes.data || [];
  const commentsByPost = new Map<string, number>();

  if (commentsRes.error) {
    // Fallback: Query all comments for the post IDs and count in JS
    const fallbackCommentsRes = postIds.length
      ? await supabase.from('comments').select('id,post_id').in('post_id', postIds)
      : { data: [], error: null };
      
    if (fallbackCommentsRes.error) throw new Error(fallbackCommentsRes.error.message);
    
    (fallbackCommentsRes.data || []).forEach((c: { post_id: string }) => {
      commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) || 0) + 1);
    });
  } else {
    (commentsRes.data || []).forEach((c: { post_id: string; comment_count: number }) => {
      commentsByPost.set(c.post_id, c.comment_count || 0);
    });
  }

  const profileById = new Map<
    string,
    { full_name: string | null; avatar_url: string | null; avatar_seed: string | null }
  >();

  profiles.forEach(
    (p: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      avatar_seed: string | null;
    }) => {
      profileById.set(p.id, {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        avatar_seed: p.avatar_seed,
      });
    },
  );

  const mapped = visiblePosts.map((p: any) => {
    const profile = profileById.get(p.author_id) || null;
    const inferredType = getPostTypeForCategory(p.category || '');
    const postType: PostType = p.post_type || inferredType;
    const likeCount = reactionAgg.likeCounts.get(p.id) || 0;
    const prayerCount = reactionAgg.prayCounts.get(p.id) || 0;
    return {
      id: p.id,
      title: sanitizeText(p.title),
      content: sanitizeText(p.content),
      category: p.category,
      post_type: postType,
      createdat: p.created_at,
      like_count: likeCount,
      prayer_count: prayerCount,
      comment_count: commentsByPost.get(p.id) || 0,
      user_has_liked: reactionAgg.userLiked.has(p.id),
      user_has_prayed: reactionAgg.userPrayed.has(p.id),
      userid: p.author_id,
      is_anonymous: Boolean(p.is_anonymous),
      ispinned: Boolean(p.is_pinned),
      users: profile
        ? {
            id: p.author_id,
            fullname: profile.full_name,
            avatarurl: profile.avatar_url,
            avatarseed: profile.avatar_seed ?? null,
          }
        : null,
    } as BackendThread;
  });

  let result = mapped;
  if (postType) {
    result = mapped.filter((p) => p.post_type === postType);
  }

  if (sortBy === 'popular') {
    result.sort(
      (a, b) =>
        Math.max(b.like_count, b.prayer_count) - Math.max(a.like_count, a.prayer_count) ||
        b.createdat.localeCompare(a.createdat)
    );
  } else if (sortBy === 'discussed') {
    result.sort(
      (a, b) => b.comment_count - a.comment_count || b.createdat.localeCompare(a.createdat)
    );
  } else {
    result.sort((a, b) => b.createdat.localeCompare(a.createdat));
  }

  return dedupeThreads(result);
}

export async function getCommunityStats(): Promise<{ prayers: number; testimonies: number; total: number }> {
  const withType = await supabase.from('posts').select('category,post_type');
  const fallback = withType.error && isMissingSchemaError(withType.error, 'post_type')
    ? await supabase.from('posts').select('category')
    : withType;
  const data = fallback.data as Array<{ category: string | null; post_type?: PostType | null }> | null;
  const error = fallback.error;
  if (error || !data) {
    return { prayers: 0, testimonies: 0, total: 0 };
  }
  const prayers = data.filter((p) =>
    p.post_type ? p.post_type === 'prayer' : isPrayerCategory(p.category || '')
  ).length;
  const testimonies = data.filter((p) => p.category === 'Testimonies').length;
  return { prayers, testimonies, total: data.length };
}

export async function createCommunityPost(params: {
  title: string;
  content: string;
  category: string;
  userId: string;
  postType?: PostType;
  isAnonymous?: boolean;
}): Promise<BackendThread> {
  const normalizedTitle = sanitizeText(normalizePostTitle(params.title || ''));
  const normalizedContent = sanitizeText(normalizePostContent(params.content || ''));
  const category = (params.category || '').trim();
  const userId = (params.userId || '').trim();
  const postType = params.postType || getPostTypeForCategory(category);

  if (!userId) {
    throw new CreatePostError('auth', 'You must be signed in to create a post.');
  }
  if (normalizedTitle.length < POST_TITLE_MIN) {
    throw new CreatePostError(
      'validation',
      `Title must be at least ${POST_TITLE_MIN} characters.`
    );
  }
  if (normalizedTitle.length > POST_TITLE_MAX) {
    throw new CreatePostError(
      'validation',
      `Title must be less than ${POST_TITLE_MAX} characters.`
    );
  }
  if (normalizedContent.length < POST_CONTENT_MIN) {
    throw new CreatePostError(
      'validation',
      `Content must be at least ${POST_CONTENT_MIN} characters.`
    );
  }
  if (normalizedContent.length > POST_CONTENT_MAX) {
    throw new CreatePostError(
      'validation',
      `Content must be less than ${POST_CONTENT_MAX} characters.`
    );
  }
  if (!ALLOWED_POST_CATEGORIES.has(category)) {
    throw new CreatePostError('validation', 'Please select a valid category.');
  }
  if (isCommunityTextBlocked(normalizedTitle) || isCommunityTextBlocked(normalizedContent)) {
    throw new CreatePostError('validation', UGC_FILTER_USER_MESSAGE);
  }

  try {
    const baseInsert = {
      title: normalizedTitle,
      content: normalizedContent,
      category,
      author_id: userId,
    };
    const fullInsert = {
      ...baseInsert,
      post_type: postType,
      is_anonymous: Boolean(params.isAnonymous),
    };

    const createPromise = (async () => {
      const selectFull =
        'id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous';
      const selectWithType =
        'id,title,content,category,post_type,author_id,is_pinned,created_at';
      const selectBase = 'id,title,content,category,author_id,is_pinned,created_at';

      let attempt = await supabase.from('posts').insert(fullInsert).select(selectFull).single();
      if (!attempt.error) {
        return attempt;
      }

      if (
        !isMissingSchemaError(attempt.error, 'post_type') &&
        !isMissingSchemaError(attempt.error, 'is_anonymous')
      ) {
        return attempt;
      }

      const anonMissing = errorSuggestsMissingPostsColumn(attempt.error, 'is_anonymous');
      const typeMissing = errorSuggestsMissingPostsColumn(attempt.error, 'post_type');

      if (anonMissing && !typeMissing) {
        attempt = await supabase
          .from('posts')
          .insert({ ...baseInsert, post_type: postType })
          .select(selectWithType)
          .single();
        if (!attempt.error) {
          return attempt;
        }
      }

      if (typeMissing && !anonMissing) {
        attempt = await supabase
          .from('posts')
          .insert({ ...baseInsert, is_anonymous: Boolean(params.isAnonymous) })
          .select(`${selectBase},is_anonymous`)
          .single();
        if (!attempt.error) {
          return attempt;
        }
      }

      return supabase.from('posts').insert(baseInsert).select(selectBase).single();
    })();

    const { data, error } = await withTimeout(createPromise, CREATE_POST_TIMEOUT_MS);
    if (error || !data) {
      throw new Error(error?.message || 'Failed to create post');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,avatar_seed')
      .eq('id', data.author_id)
      .maybeSingle();

    const created = data as any;
    return {
      id: created.id,
      title: sanitizeText(created.title),
      content: sanitizeText(created.content),
      category: created.category,
      post_type: created.post_type || postType || getPostTypeForCategory(created.category),
      createdat: created.created_at,
      like_count: 0,
      prayer_count: 0,
      comment_count: 0,
      user_has_liked: false,
      user_has_prayed: false,
      userid: created.author_id,
      is_anonymous: Boolean(created.is_anonymous),
      ispinned: Boolean(created.is_pinned),
      users: profile
        ? {
            id: profile.id,
            fullname: profile.full_name,
            avatarurl: profile.avatar_url,
            avatarseed: profile.avatar_seed ?? null,
          }
        : null,
    } as BackendThread;
  } catch (error) {
    throw mapCreatePostError(error);
  }
}

export async function togglePostReaction(
  postId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> {
  const reactionLookup = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle();

  if (!reactionLookup.error) {
    if (reactionLookup.data) {
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType);
      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    });
    if (error) throw new Error(error.message);
    return;
  }

  if (!isMissingSchemaError(reactionLookup.error, 'post_reactions')) {
    throw new Error(reactionLookup.error.message);
  }

  // Legacy fallback (no post_reactions table yet).
  const { data: existing, error: existingError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function toggleCommunityPostLike(postId: string, userId: string): Promise<void> {
  return togglePostReaction(postId, userId, 'like');
}

export async function deleteCommunityPost(postId: string, userId: string): Promise<void> {
  if (!postId?.trim()) {
    throw new CreatePostError('validation', 'Post ID is required.');
  }
  if (!userId?.trim()) {
    throw new CreatePostError('auth', 'You must be signed in to delete a post.');
  }

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', userId)
    .select('id');

  if (error) {
    throw new Error(error.message || 'Failed to delete post');
  }
  if (!data || data.length === 0) {
    throw new CreatePostError('auth', 'You can only delete your own posts.');
  }
}

export async function getPostById(postId: string, currentUserId?: string): Promise<BackendThread | null> {
  const blockedIds = currentUserId ? new Set(await fetchBlockedUserIds(currentUserId)) : new Set<string>();

  const selectFull =
    'id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous';
  let post: any = null;

  let row = await supabase.from('posts').select(selectFull).eq('id', postId).maybeSingle();
  if (!row.error && row.data) {
    post = row.data;
  } else if (row.error && errorSuggestsMissingPostsColumn(row.error, 'is_anonymous')) {
    row = await supabase
      .from('posts')
      .select('id,title,content,category,post_type,author_id,is_pinned,created_at')
      .eq('id', postId)
      .maybeSingle();
    if (row.error) throw new Error(row.error.message);
    post = row.data;
  } else if (row.error && errorSuggestsMissingPostsColumn(row.error, 'post_type')) {
    row = await supabase
      .from('posts')
      .select('id,title,content,category,author_id,is_pinned,created_at')
      .eq('id', postId)
      .maybeSingle();
    if (row.error) throw new Error(row.error.message);
    post = row.data;
  } else if (row.error) {
    throw new Error(row.error.message);
  } else {
    post = row.data;
  }

  if (!post) return null;
  if (blockedIds.has(post.author_id)) return null;

  const postIds = [post.id];
  const [reactionAgg, commentsRes, profileRes] = await Promise.all([
    getReactionAggregates(postIds, currentUserId),
    supabase.from('post_comment_counts').select('comment_count').eq('post_id', postId).maybeSingle(),
    supabase
      .from('profiles')
      .select('id,full_name,avatar_url,avatar_seed')
      .eq('id', post.author_id)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);

  let commentsByPost = 0;
  if (commentsRes.error) {
    // Legacy fallback (no post_comment_counts view yet, use exact count query without downloading columns)
    const countRes = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);
    commentsByPost = countRes.count || 0;
  } else {
    commentsByPost = commentsRes.data?.comment_count || 0;
  }
  const profile = profileRes.data;

  const inferredType = getPostTypeForCategory(post.category || '');
  const postType: PostType = post.post_type || inferredType;
  const likeCount = reactionAgg.likeCounts.get(post.id) || 0;
  const prayerCount = reactionAgg.prayCounts.get(post.id) || 0;

  return {
    id: post.id,
    title: sanitizeText(post.title),
    content: sanitizeText(post.content),
    category: post.category,
    post_type: postType,
    createdat: post.created_at,
    like_count: likeCount,
    prayer_count: prayerCount,
    comment_count: commentsByPost,
    user_has_liked: reactionAgg.userLiked.has(post.id),
    user_has_prayed: reactionAgg.userPrayed.has(post.id),
    userid: post.author_id,
    is_anonymous: Boolean(post.is_anonymous),
    ispinned: Boolean(post.is_pinned),
    users: profile
      ? {
          id: post.author_id,
          fullname: profile.full_name,
          avatarurl: profile.avatar_url,
          avatarseed: profile.avatar_seed ?? null,
        }
      : null,
  } as BackendThread;
}

export async function fetchCommentsForPost(
  postId: string,
  viewerUserId?: string
): Promise<BackendComment[]> {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('id,post_id,author_id,content,created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error || !comments) throw new Error(error?.message || 'Failed to load comments');

  const blockedIds = viewerUserId ? new Set(await fetchBlockedUserIds(viewerUserId)) : new Set<string>();
  const visible = comments.filter((c: { author_id: string }) => !blockedIds.has(c.author_id));

  const userIds = [...new Set(visible.map((c) => c.author_id))];
  let profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    avatar_seed: string | null;
  }[] = [];
  if (userIds.length) {
    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,avatar_seed')
      .in('id', userIds);
    if (profilesError) throw new Error(profilesError.message);
    profiles = data || [];
  }
  const profileById = new Map(
    profiles.map((p) => [
      p.id,
      {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        avatar_seed: p.avatar_seed,
      },
    ]),
  );

  return visible.map((c: any) => {
    const profile = profileById.get(c.author_id);
    return {
      id: c.id,
      threadid: c.post_id,
      userid: c.author_id,
      content: sanitizeText(c.content),
      createdat: c.created_at,
      users: profile
        ? {
            id: c.author_id,
            fullname: profile.full_name,
            avatarurl: profile.avatar_url,
            avatarseed: profile.avatar_seed ?? null,
          }
        : null,
    } as BackendComment;
  });
}

export async function createCommentForPost(
  postId: string,
  userId: string,
  content: string
): Promise<BackendComment> {
  const normalizedContent = sanitizeText(content.trim());
  if (!normalizedContent) {
    throw new CreatePostError('validation', 'Comment cannot be empty.');
  }
  if (!userId) {
    throw new CreatePostError('auth', 'You must be signed in to comment.');
  }
  if (isCommunityTextBlocked(normalizedContent)) {
    throw new CreatePostError('validation', UGC_FILTER_USER_MESSAGE);
  }

  const createPromise = supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: userId,
      content: normalizedContent,
    })
    .select('id,post_id,author_id,content,created_at')
    .single()
    .then((result) => result);

  const { data, error } = await withTimeout(createPromise, CREATE_POST_TIMEOUT_MS);
  if (error || !data) {
    const blocked = mapUgcDbBlockMessage(error?.message);
    if (blocked) throw blocked;
    throw new Error(error?.message || 'Failed to create comment');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,avatar_url,avatar_seed')
    .eq('id', data.author_id)
    .maybeSingle();

  return {
    id: data.id,
    threadid: data.post_id,
    userid: data.author_id,
    content: sanitizeText(data.content),
    createdat: data.created_at,
    users: profile
      ? {
          id: profile.id,
          fullname: profile.full_name,
          avatarurl: profile.avatar_url,
          avatarseed: profile.avatar_seed ?? null,
        }
      : null,
  } as BackendComment;
}

export async function deleteCommunityComment(commentId: string, userId: string): Promise<void> {
  if (!commentId?.trim()) {
    throw new CreatePostError('validation', 'Comment ID is required.');
  }
  if (!userId?.trim()) {
    throw new CreatePostError('auth', 'You must be signed in to delete a comment.');
  }

  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', userId)
    .select('id');

  if (error) {
    throw new Error(error.message || 'Failed to delete comment');
  }
  if (!data || data.length === 0) {
    throw new CreatePostError('auth', 'You can only delete your own comments.');
  }
}

export async function fetchPodcasts(limit: number): Promise<BackendMediaItem[]> {
  try {
    const wpData = await fetchWordPressCollection('podcasts', limit);
    return wpData.map((item: any) => ({
      id: String(item.id),
      title: sanitizeText(item.title?.rendered || item.title || 'Untitled podcast'),
      description: sanitizeText(item.excerpt?.rendered || item.content?.rendered || ''),
      created_at: item.date || new Date().toISOString(),
      thumbnail_url: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || undefined,
      audio_url: item.audio_url || extractEmbeddedMediaUrl(item.content?.rendered || '', 'audio') || undefined,
      duration: parseDurationToSeconds(item.duration),
      category: item.podcast_category || undefined,
    }));
  } catch (_wpError) {
    // Fall back to Supabase during WP outages/migrations.
  }

  const { data, error } = await supabase
    .from('podcasts')
    .select('id,title,description,audio_url,thumbnail_url,duration,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) throw new Error(error?.message || 'Failed to fetch podcasts');
  return data.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    created_at: p.created_at,
    thumbnail_url: p.thumbnail_url || undefined,
    audio_url: p.audio_url || undefined,
    duration: p.duration || undefined,
  }));
}

export async function fetchVideos(limit: number): Promise<BackendMediaItem[]> {
  try {
    const wpData = await fetchWordPressCollection('videos', limit);
    return wpData.map((item: any) => ({
      id: String(item.id),
      title: sanitizeText(item.title?.rendered || item.title || 'Untitled video'),
      description: sanitizeText(item.excerpt?.rendered || item.content?.rendered || ''),
      created_at: item.date || new Date().toISOString(),
      thumbnail_url: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || undefined,
      video_url: item.video_url || extractEmbeddedMediaUrl(item.content?.rendered || '', 'video') || undefined,
      duration: parseDurationToSeconds(item.video_duration ?? item.duration),
      category: item.video_category || undefined,
    }));
  } catch (_wpError) {
    // Fall back to Supabase during WP outages/migrations.
  }

  const { data, error } = await supabase
    .from('videos')
    .select('id,title,description,video_url,thumbnail_url,duration,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) throw new Error(error?.message || 'Failed to fetch videos');
  return data.map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.description || '',
    created_at: v.created_at,
    thumbnail_url: v.thumbnail_url || undefined,
    video_url: v.video_url || undefined,
    duration: v.duration || undefined,
  }));
}

function mapLiveEvent(row: any): BackendLiveEvent {
  return {
    id: String(row.id),
    title: row.title || 'Live Show',
    description: row.description || '',
    video_url: row.video_url,
    thumbnail_url: row.thumbnail_url || undefined,
    scheduled_start: row.scheduled_start,
    scheduled_end: row.scheduled_end || undefined,
    status: row.status,
    is_featured: Boolean(row.is_featured),
    viewer_count: typeof row.viewer_count === 'number' ? row.viewer_count : undefined,
  };
}

export async function fetchCurrentLiveEvent(): Promise<BackendLiveEvent | null> {
  const { data, error } = await supabase
    .from('live_events')
    .select(
      'id,title,description,video_url,thumbnail_url,scheduled_start,scheduled_end,status,is_featured,viewer_count'
    )
    .eq('status', 'live')
    .order('is_featured', { ascending: false })
    .order('scheduled_start', { ascending: false })
    .limit(1);

  if (error) {
    if (!isMissingTableError(error, 'live_events')) {
      throw new Error(error.message);
    }
    if (LIVE_VIDEO_URL_FALLBACK) {
      return {
        id: 'fallback-live-stream',
        title: LIVE_VIDEO_TITLE_FALLBACK,
        description: 'Live video stream from your configured provider.',
        video_url: LIVE_VIDEO_URL_FALLBACK,
        thumbnail_url: LIVE_VIDEO_THUMBNAIL_FALLBACK,
        scheduled_start: new Date().toISOString(),
        status: 'live',
      };
    }
    return null;
  }

  if (data && data.length > 0) {
    return mapLiveEvent(data[0]);
  }

  if (LIVE_VIDEO_URL_FALLBACK) {
    return {
      id: 'fallback-live-stream',
      title: LIVE_VIDEO_TITLE_FALLBACK,
      description: 'Live video stream from your configured provider.',
      video_url: LIVE_VIDEO_URL_FALLBACK,
      thumbnail_url: LIVE_VIDEO_THUMBNAIL_FALLBACK,
      scheduled_start: new Date().toISOString(),
      status: 'live',
    };
  }

  return null;
}

export async function fetchUpcomingLiveEvents(limit: number = 5): Promise<BackendLiveEvent[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('live_events')
    .select(
      'id,title,description,video_url,thumbnail_url,scheduled_start,scheduled_end,status,is_featured,viewer_count'
    )
    .in('status', ['live', 'scheduled'])
    .gte('scheduled_start', nowIso)
    .order('scheduled_start', { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error, 'live_events')) {
      return [];
    }
    throw new Error(error.message || 'Failed to fetch upcoming live shows');
  }
  if (!data) {
    return [];
  }

  return data.map(mapLiveEvent);
}

export async function fetchRadioSchedule(): Promise<any | null> {
  const { data, error } = await supabase
    .from('radio_schedule')
    .select('id,title,description,start_time,end_time,day_of_week,image_url,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;
  return data[0];
}

/** AzuraCast (and WP radio-status proxy) now-playing payload → app radio status. */
function mapNowPlayingPayloadToRadioStatus(data: unknown): BackendRadioStatus | null {
  if (!data || typeof data !== 'object') return null;

  const record = data as Record<string, unknown>;
  if (typeof record.code === 'string' && record.code.startsWith('rest_')) {
    return null;
  }

  const station = record.station as { listen_url?: string } | undefined;
  const nowPlaying = record.now_playing as
    | { song?: { title?: string; text?: string; artist?: string; art?: string } }
    | undefined;
  const live = record.live as { is_live?: boolean } | undefined;

  if (!station?.listen_url && !nowPlaying?.song?.title) {
    return null;
  }

  return {
    is_live: Boolean(live?.is_live),
    current_show: resolveRadioTrackTitle(nowPlaying?.song, 'Faith & Worship'),
    stream_url: station?.listen_url || STREAM_URL_FALLBACK,
    now_playing: nowPlaying?.song
      ? {
          title: resolveRadioTrackTitle(nowPlaying.song, 'Live Stream'),
          artist: resolveRadioTrackArtist(nowPlaying.song.artist),
          art: nowPlaying.song.art,
          text: nowPlaying.song.text,
        }
      : undefined,
  };
}

async function fetchAzuraCastRadioStatus(): Promise<BackendRadioStatus> {
  const urls = [AZURACAST_NOW_PLAYING_URL, AZURACAST_NOW_PLAYING_FALLBACK_URL];
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`AzuraCast now playing failed (${response.status})`);
        continue;
      }
      const data = await response.json();
      const mapped = mapNowPlayingPayloadToRadioStatus(data);
      if (!mapped) {
        lastError = new Error('AzuraCast now playing payload invalid');
        continue;
      }
      return mapped;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('AzuraCast now playing failed');
    }
  }

  throw lastError ?? new Error('AzuraCast now playing failed');
}

export async function fetchRadioStatusFromAzuraCast(): Promise<BackendRadioStatus> {
  try {
    const primaryResponse = await fetch(WORDPRESS_RADIO_STATUS_URL);
    const primaryData = await primaryResponse.json();
    const fromWordPress = mapNowPlayingPayloadToRadioStatus(primaryData);
    if (primaryResponse.ok && fromWordPress) {
      return fromWordPress;
    }
  } catch {
    // WordPress unreachable or invalid JSON — use AzuraCast.
  }

  try {
    return await fetchAzuraCastRadioStatus();
  } catch {
    return {
      is_live: false,
      current_show: 'Faith & Worship',
      stream_url: STREAM_URL_FALLBACK,
      now_playing: undefined,
    };
  }
}

/** Upcoming + recent tracks from AzuraCast now-playing API (playing_next, song_history). */
export async function fetchRadioQueueInfo(): Promise<RadioQueueInfo | null> {
  try {
    const response = await fetch(AZURACAST_NOW_PLAYING_URL);
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;

    const nextSong = (data.playing_next as { song?: Record<string, string> } | null)?.song;
    const upNext: RadioQueueItem | null = nextSong
      ? {
          title: resolveRadioTrackTitle(nextSong, 'Unknown'),
          artist: resolveRadioTrackArtist(nextSong.artist),
        }
      : null;

    const rawHistory = data.song_history;
    const recent: RadioQueueItem[] = [];
    if (Array.isArray(rawHistory)) {
      for (const entry of rawHistory.slice(0, 5)) {
        const s = (entry as { song?: Record<string, string> })?.song;
        if (!s) continue;
        recent.push({
          title: resolveRadioTrackTitle(s, 'Unknown'),
          artist: resolveRadioTrackArtist(s.artist),
        });
      }
    }

    return { upNext, recent };
  } catch {
    return null;
  }
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const safeCount = async (table: string): Promise<number> => {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error) {
      if (isMissingTableError(error, table)) return 0;
      const detail = error.message || (error as { code?: string }).code || 'unknown';
      console.warn(`[fetchHomeStats] count "${table}" failed:`, detail);
      return 0;
    }
    return count || 0;
  };

  const prayerCountPromise = (async () => {
    const byType = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('post_type', 'prayer');
    if (!byType.error) {
      return byType;
    }
    if (isMissingTableError(byType.error, 'posts')) {
      return { count: 0, error: null } as any;
    }

    const fallback = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .in('category', ['Prayer Requests', 'Pray for Others']);
    if (!fallback.error) {
      return fallback;
    }
    if (isMissingTableError(fallback.error, 'posts')) {
      return { count: 0, error: null } as any;
    }

    const msg =
      byType.error.message ||
      fallback.error.message ||
      (byType.error as { code?: string }).code ||
      'prayer count';
    console.warn('[fetchHomeStats] prayer count failed:', msg);
    return { count: 0, error: null } as any;
  })();

  const [profilesCount, prayersCountRes, podcastsCount, videosCount] = await Promise.all([
    safeCount('profiles'),
    prayerCountPromise,
    safeCount('podcasts'),
    safeCount('videos'),
  ]);

  return {
    familyMembers: profilesCount,
    prayersLifted: prayersCountRes.count || 0,
    mediaItems: podcastsCount + videosCount,
  };
}

export async function fetchCommunityCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('post_category_counts').select('category, count');
  
  if (error) {
    // Legacy fallback (no post_category_counts view yet, use in-memory count)
    const fallbackRes = await supabase.from('posts').select('category');
    if (fallbackRes.error || !fallbackRes.data) {
      throw new Error(fallbackRes.error?.message || 'Failed to fetch category counts');
    }
    const counts: Record<string, number> = { all: fallbackRes.data.length };
    for (const row of fallbackRes.data as Array<{ category: string | null }>) {
      const category = row.category || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }

  const counts: Record<string, number> = { all: 0 };
  let total = 0;
  (data || []).forEach((row: { category: string | null; count: number }) => {
    const category = row.category || 'Uncategorized';
    const c = Number(row.count || 0);
    counts[category] = c;
    total += c;
  });
  counts['all'] = total;
  return counts;
}

export interface BackendNotification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: 'like' | 'pray' | 'comment' | 'discussion';
  post_id: string;
  comment_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    fullname: string | null;
    avatarurl: string | null;
    avatarseed: string | null;
  } | null;
}

export async function fetchUserNotifications(userId: string): Promise<BackendNotification[]> {
  const baseSelect =
    'id, recipient_id, actor_id, type, post_id, comment_id, message, is_read, created_at';

  let { data, error } = await supabase
    .from('notifications')
    .select(
      `${baseSelect}, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url, avatar_seed)`
    )
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    const fallback = await supabase
      .from('notifications')
      .select(`${baseSelect}, actor:profiles(id, full_name, avatar_url, avatar_seed)`)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message || 'Failed to fetch notifications');

  return (data || []).map((row: any) => {
    const actorProfile = row.actor as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      avatar_seed: string | null;
    } | null;

    return {
      id: row.id,
      recipient_id: row.recipient_id,
      actor_id: row.actor_id,
      type: row.type,
      post_id: row.post_id,
      comment_id: row.comment_id,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at,
      actor: actorProfile
        ? {
            id: actorProfile.id,
            fullname: actorProfile.full_name,
            avatarurl: actorProfile.avatar_url,
            avatarseed: actorProfile.avatar_seed,
          }
        : null,
    };
  });
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.warn('[fetchUnreadNotificationCount]', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_id', userId);

  if (error) throw new Error(error.message || 'Failed to mark notification as read');
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(error.message || 'Failed to mark notifications as read');
}
