# ⚠️ Supabase Schema Reference

This file documents the ACTUAL database schema used in Supabase. **Always refer to this before writing queries.**

## Critical: Table Name Mappings

### Current Tables in Production Supabase (Dec 2024)

| Feature | Table Name | Key Columns | Notes |
|---------|-----------|------------|-------|
| Episodes/Podcasts | `episodes` | id, title, audio_url, created_at | Use `created_at` NOT `published_at` |
| Prayers & Testimonies | `prayercircles` | id, is_testimony (boolean), status, created_at | Use `is_testimony=false` for prayers, `is_testimony=true` for testimonies |
| Videos | `videos` | id, title, video_url, created_at | Use `created_at` for sorting |
| User Profiles | `users` | id, full_name, email, created_at | NOT `profiles` table |
| Comments | `communitycomments` | id, content, created_at | For comments on threads |
| Likes/Reactions | `threadlikes`, `threadreactions`, `commentreactions` | Various | See Supabase dashboard |

## ❌ OLD Names - DO NOT USE

These table names were used in the original code but are WRONG:
- ❌ `podcasts` → Use `episodes` 
- ❌ `prayer_requests` → Use `prayercircles` with `is_testimony=false`
- ❌ `testimonies` → Use `prayercircles` with `is_testimony=true`
- ❌ `profiles` → Use `users`
- ❌ `comments` → Use `communitycomments`
- ❌ Column `published_at` → Use `created_at`

## Query Examples

### ✅ Correct Queries

```typescript
// Get all episodes
const { data } = await supabase
  .from('episodes')
  .select('*')
  .order('created_at', { ascending: false });

// Get prayers (is_testimony = false)
const { data } = await supabase
  .from('prayercircles')
  .select('*')
  .eq('is_testimony', false)
  .order('created_at', { ascending: false });

// Get testimonies (is_testimony = true)
const { data } = await supabase
  .from('prayercircles')
  .select('*')
  .eq('is_testimony', true)
  .order('created_at', { ascending: false });

// Get user profile
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Get videos
const { data } = await supabase
  .from('videos')
  .select('*')
  .order('created_at', { ascending: false });
```

### ❌ Incorrect Queries (These will FAIL)

```typescript
// WRONG - Table doesn't exist
await supabase.from('podcasts').select('*');  // ❌ Use 'episodes'

// WRONG - Table doesn't exist
await supabase.from('prayer_requests').select('*');  // ❌ Use 'prayercircles'

// WRONG - Table doesn't exist
await supabase.from('testimonies').select('*');  // ❌ Use 'prayercircles'

// WRONG - Table doesn't exist
await supabase.from('profiles').select('*');  // ❌ Use 'users'

// WRONG - Column doesn't exist
await supabase.from('episodes').select('*').order('published_at');  // ❌ Use 'created_at'
```

## Implementation Checklist

When adding a new screen or feature that queries the database:

- [ ] Check table names in this file first
- [ ] Use `is_testimony` flag for `prayercircles` table (don't query separate tables)
- [ ] Use `created_at` for date sorting, not `published_at`
- [ ] Verify column names exist (ask Supabase dashboard if unsure)
- [ ] Test queries in Supabase dashboard before adding to app code

## Last Updated

- **Dec 18, 2025**: Initial schema documentation after fixing table name mismatches
