#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  let contents = '';
  try {
    contents = readFileSync(envPath, 'utf8');
  } catch (_error) {
    return;
  }

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^"|"$/g, '');
    }
  }
}

function cleanHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, '').trim();
}

function extractMediaUrl(html, type) {
  const sourceRegex = /<source[^>]+src=["']([^"']+)["']/i;
  const tagRegex = type === 'audio'
    ? /<audio[^>]+src=["']([^"']+)["']/i
    : /<video[^>]+src=["']([^"']+)["']/i;
  const sourceMatch = (html || '').match(sourceRegex);
  if (sourceMatch?.[1]) return sourceMatch[1];
  const tagMatch = (html || '').match(tagRegex);
  return tagMatch?.[1] || null;
}

async function fetchWp(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WordPress fetch failed: ${res.status} ${url}`);
  return res.json();
}

async function ensureImporterUser(supabaseAdmin, email) {
  const listRes = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listRes.error) throw listRes.error;
  const existing = listRes.data.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password: `Importer-${Math.random().toString(36).slice(2)}!`,
    email_confirm: true,
    user_metadata: { full_name: 'WordPress Importer' },
  });
  if (createRes.error || !createRes.data.user) {
    throw createRes.error || new Error('Failed to create importer auth user');
  }
  return createRes.data.user.id;
}

async function run() {
  loadEnv();

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const WP_API_BASE =
    process.env.WORDPRESS_API_BASE_URL || 'https://godkingdomprinciplesradio.com/apis/wp-json';
  const IMPORTER_EMAIL = process.env.SUPABASE_IMPORTER_EMAIL || 'importer@gkpradio.local';
  const DRY_RUN = process.argv.includes('--dry-run');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in mobile/.env'
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Starting WordPress -> Supabase import');
  console.log(`WordPress API: ${WP_API_BASE}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}`);

  const [podcastsRaw, videosRaw, radioRaw, testimoniesRaw] = await Promise.all([
    fetchWp(`${WP_API_BASE}/wp/v2/podcasts?per_page=100&_embed=1`),
    fetchWp(`${WP_API_BASE}/wp/v2/videos?per_page=100&_embed=1`),
    fetchWp(`${WP_API_BASE}/wp/v2/radio?per_page=1&_embed=1`),
    fetchWp(`${WP_API_BASE}/wp/v2/testimonies?per_page=100&_embed=1`),
  ]);

  const podcasts = podcastsRaw.map((p) => ({
    title: cleanHtml(p.title?.rendered) || 'Untitled Podcast',
    description: cleanHtml(p.content?.rendered),
    audio_url: extractMediaUrl(p.content?.rendered, 'audio'),
    thumbnail_url: p?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
    duration: null,
    created_at: p.date || new Date().toISOString(),
  }));

  const videos = videosRaw.map((v) => ({
    title: cleanHtml(v.title?.rendered) || 'Untitled Video',
    description: cleanHtml(v.content?.rendered),
    video_url: extractMediaUrl(v.content?.rendered, 'video'),
    thumbnail_url: v?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
    duration: null,
    created_at: v.date || new Date().toISOString(),
  }));

  const radioItem = radioRaw?.[0];
  const radioSchedule = radioItem
    ? {
        title: cleanHtml(radioItem.title?.rendered) || 'Radio Schedule',
        description: cleanHtml(radioItem.content?.rendered),
        start_time: null,
        end_time: null,
        day_of_week: null,
        image_url: radioItem?.content?.rendered?.match(/src="([^"]+)"/)?.[1] || null,
      }
    : null;

  console.log(
    `Fetched ${podcasts.length} podcasts, ${videos.length} videos, ${testimoniesRaw.length} testimonies`
  );

  if (DRY_RUN) {
    console.log('Dry run complete. No data was written.');
    return;
  }

  const importerUserId = await ensureImporterUser(supabaseAdmin, IMPORTER_EMAIL);
  await supabaseAdmin.from('profiles').upsert({
    id: importerUserId,
    full_name: 'WordPress Importer',
    avatar_url: null,
    bio: 'System user for WordPress content imports',
  });

  // Reset and load media + schedule
  await supabaseAdmin.from('podcasts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('radio_schedule').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (podcasts.length) {
    const { error } = await supabaseAdmin.from('podcasts').insert(podcasts);
    if (error) throw error;
  }
  if (videos.length) {
    const { error } = await supabaseAdmin.from('videos').insert(videos);
    if (error) throw error;
  }
  if (radioSchedule) {
    const { error } = await supabaseAdmin.from('radio_schedule').insert([radioSchedule]);
    if (error) throw error;
  }

  // Reset and load community content from testimonies
  await supabaseAdmin.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('post_likes').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const testimonyMap = new Map();
  for (const t of testimoniesRaw) {
    const postPayload = {
      title: cleanHtml(t.title?.rendered) || 'Untitled Testimony',
      content: cleanHtml(t.content?.rendered),
      category: 'Testimonies',
      author_id: importerUserId,
      is_pinned: false,
      created_at: t.date || new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([postPayload])
      .select('id')
      .single();
    if (error) throw error;
    testimonyMap.set(String(t.id), data.id);
  }

  let importedComments = 0;
  for (const t of testimoniesRaw) {
    const wpComments = await fetchWp(`${WP_API_BASE}/wp/v2/comments?post=${t.id}&per_page=100&_embed=1`);
    const targetPostId = testimonyMap.get(String(t.id));
    if (!targetPostId || !wpComments.length) continue;

    const commentPayload = wpComments.map((c) => ({
      post_id: targetPostId,
      author_id: importerUserId,
      content: `[${c.author_name || 'WP User'}] ${cleanHtml(c.content?.rendered)}`,
      created_at: c.date || new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin.from('comments').insert(commentPayload);
    if (error) throw error;
    importedComments += commentPayload.length;
  }

  console.log('Import finished successfully');
  console.log(`Inserted podcasts: ${podcasts.length}`);
  console.log(`Inserted videos: ${videos.length}`);
  console.log(`Inserted radio schedule rows: ${radioSchedule ? 1 : 0}`);
  console.log(`Inserted posts (from testimonies): ${testimoniesRaw.length}`);
  console.log(`Inserted comments: ${importedComments}`);
}

run().catch((error) => {
  console.error('Import failed:', error.message || error);
  process.exit(1);
});
