import { supabase } from './supabase';
import { PostType, getPostTypeForCategory, isPrayerCategory } from '../constants/categories';

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
  };
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

const WORDPRESS_RADIO_STATUS_URL =
  process.env.EXPO_PUBLIC_WORDPRESS_RADIO_STATUS_URL ||
  'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/radio-status';

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

function sanitizeText(value: string | null | undefined): string {
  return (value || '').replace(/<[^>]*>?/gm, '');
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

async function loadPostsWithCompatibility() {
  const selectWithTypeAndAnonymous =
    'id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous';
  const withTypeAndAnonymous = await supabase
    .from('posts')
    .select(selectWithTypeAndAnonymous)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!withTypeAndAnonymous.error) {
    return withTypeAndAnonymous;
  }

  const withTypeOnly = await supabase
    .from('posts')
    .select('id,title,content,category,post_type,author_id,is_pinned,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!withTypeOnly.error) {
    return withTypeOnly;
  }

  if (!isMissingSchemaError(withTypeOnly.error, 'post_type')) {
    return withTypeOnly;
  }

  return supabase
    .from('posts')
    .select('id,title,content,category,author_id,is_pinned,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
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

function normalizePostTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizePostContent(value: string): string {
  return value.trim();
}

function mapCreatePostError(error: unknown): CreatePostError {
  if (error instanceof CreatePostError) return error;
  const message = error instanceof Error ? error.message : 'Failed to create post';
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
  currentUserId?: string
): Promise<BackendThread[]> {
  const { data: posts, error } = await loadPostsWithCompatibility();

  if (error || !posts) {
    throw new Error(error?.message || 'Failed to load posts');
  }

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [reactionAgg, commentsRes, profilesRes] = await Promise.all([
    getReactionAggregates(postIds, currentUserId),
    postIds.length
      ? supabase.from('comments').select('id,post_id').in('post_id', postIds)
      : Promise.resolve({ data: [], error: null } as any),
    authorIds.length
      ? supabase.from('profiles').select('id,full_name,avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (commentsRes.error) throw new Error(commentsRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const comments = commentsRes.data || [];
  const profiles = profilesRes.data || [];

  const commentsByPost = new Map<string, number>();
  const profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();

  comments.forEach((c: { post_id: string }) => {
    commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) || 0) + 1);
  });

  profiles.forEach((p: { id: string; full_name: string | null; avatar_url: string | null }) => {
    profileById.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
  });

  const mapped = posts.map((p: any) => {
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
          }
        : null,
    } as BackendThread;
  });

  if (sortBy === 'popular') {
    mapped.sort(
      (a, b) =>
        Math.max(b.like_count, b.prayer_count) - Math.max(a.like_count, a.prayer_count) ||
        b.createdat.localeCompare(a.createdat)
    );
  } else if (sortBy === 'discussed') {
    mapped.sort(
      (a, b) => b.comment_count - a.comment_count || b.createdat.localeCompare(a.createdat)
    );
  } else {
    mapped.sort((a, b) => b.createdat.localeCompare(a.createdat));
  }

  return dedupeThreads(mapped);
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
  const normalizedTitle = normalizePostTitle(params.title || '');
  const normalizedContent = normalizePostContent(params.content || '');
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
      const withPostType = await supabase
        .from('posts')
        .insert(fullInsert)
        .select('id,title,content,category,post_type,author_id,is_pinned,created_at,is_anonymous')
        .single();
      if (!withPostType.error) {
        return withPostType;
      }

      if (
        !isMissingSchemaError(withPostType.error, 'post_type') &&
        !isMissingSchemaError(withPostType.error, 'is_anonymous')
      ) {
        return withPostType;
      }

      return supabase
        .from('posts')
        .insert(baseInsert)
        .select('id,title,content,category,author_id,is_pinned,created_at')
        .single();
    })();

    const { data, error } = await withTimeout(createPromise, CREATE_POST_TIMEOUT_MS);
    if (error || !data) {
      throw new Error(error?.message || 'Failed to create post');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url')
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
  const posts = await fetchCommunityPosts('newest', currentUserId);
  return posts.find((p) => p.id === postId) || null;
}

export async function fetchCommentsForPost(postId: string): Promise<BackendComment[]> {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('id,post_id,author_id,content,created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error || !comments) throw new Error(error?.message || 'Failed to load comments');

  const userIds = [...new Set(comments.map((c) => c.author_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,full_name,avatar_url')
    .in('id', userIds);

  if (profilesError) throw new Error(profilesError.message);
  const profileById = new Map(
    (profiles || []).map((p: any) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
  );

  return comments.map((c: any) => {
    const profile = profileById.get(c.author_id);
    return {
      id: c.id,
      threadid: c.post_id,
      userid: c.author_id,
      content: sanitizeText(c.content),
      createdat: c.created_at,
      users: profile
        ? { id: c.author_id, fullname: profile.full_name, avatarurl: profile.avatar_url }
        : null,
    } as BackendComment;
  });
}

export async function createCommentForPost(
  postId: string,
  userId: string,
  content: string
): Promise<BackendComment> {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    throw new CreatePostError('validation', 'Comment cannot be empty.');
  }
  if (!userId) {
    throw new CreatePostError('auth', 'You must be signed in to comment.');
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
  if (error || !data) throw new Error(error?.message || 'Failed to create comment');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,avatar_url')
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
    throw new Error(error.message);
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

  if (error || !data) {
    throw new Error(error?.message || 'Failed to fetch upcoming live shows');
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

export async function fetchRadioStatusFromAzuraCast(): Promise<BackendRadioStatus> {
  try {
    const primaryResponse = await fetch(WORDPRESS_RADIO_STATUS_URL);
    const primaryData = await primaryResponse.json();

    return {
      is_live: Boolean(primaryData?.live?.is_live),
      current_show: primaryData?.now_playing?.song?.title || 'Faith & Worship',
      stream_url: primaryData?.station?.listen_url || STREAM_URL_FALLBACK,
      now_playing: primaryData?.now_playing?.song
        ? {
            title: primaryData.now_playing.song.title || 'Live Stream',
            artist: primaryData.now_playing.song.artist || 'GKP Radio',
            art: primaryData.now_playing.song.art,
          }
        : undefined,
    };
  } catch (_error) {
    try {
      const response = await fetch(AZURACAST_NOW_PLAYING_URL);
      const data = await response.json();

      return {
        is_live: Boolean(data?.live?.is_live),
        current_show: data?.now_playing?.song?.title || 'Faith & Worship',
        stream_url: data?.station?.listen_url || STREAM_URL_FALLBACK,
        now_playing: data?.now_playing?.song
          ? {
              title: data.now_playing.song.title || 'Live Stream',
              artist: data.now_playing.song.artist || 'GKP Radio',
              art: data.now_playing.song.art,
            }
          : undefined,
      };
    } catch (_nestedError) {
      return {
        is_live: false,
        current_show: 'Faith & Worship',
        stream_url: STREAM_URL_FALLBACK,
        now_playing: undefined,
      };
    }
  }
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const prayerCountPromise = (async () => {
    const byType = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('post_type', 'prayer');
    if (!byType.error) {
      return byType;
    }
    if (!isMissingSchemaError(byType.error, 'post_type')) {
      return byType;
    }
    return supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .in('category', ['Prayer Requests', 'Pray for Others']);
  })();

  const [profilesCountRes, prayersCountRes, podcastsCountRes, videosCountRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    prayerCountPromise,
    supabase.from('podcasts').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
  ]);

  if (profilesCountRes.error) throw new Error(profilesCountRes.error.message);
  if (prayersCountRes.error) throw new Error(prayersCountRes.error.message);
  if (podcastsCountRes.error) throw new Error(podcastsCountRes.error.message);
  if (videosCountRes.error) throw new Error(videosCountRes.error.message);

  return {
    familyMembers: profilesCountRes.count || 0,
    prayersLifted: prayersCountRes.count || 0,
    mediaItems: (podcastsCountRes.count || 0) + (videosCountRes.count || 0),
  };
}

export async function fetchCommunityCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('posts').select('category');
  if (error || !data) throw new Error(error?.message || 'Failed to fetch category counts');

  const counts: Record<string, number> = { all: data.length };
  for (const row of data as Array<{ category: string | null }>) {
    const category = row.category || 'Uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}
