# ⚠️ Supabase Schema Reference

This file documents the ACTUAL database schema used in Supabase. **Always refer to this before writing queries.**

## Critical: Table Name Mappings

### Current Tables in Production Supabase (Dec 2024)

| Feature | Table Name | Key Columns | Notes |
|---------|-----------|------------|-------|
| Episodes/Podcasts | `episodes` | id, title, audio_url, created_at | Use `created_at` for sorting |
| Community Content | `communitythreads` | id, userid, title, content, category, createdat | Feature: prayers, testimonies |
| Videos | `videos` | id, title, video_url, created_at | Use `created_at` for sorting |
| User Profiles | `users` | id, full_name, email, created_at | NOT `profiles` table |
| Comments | `communitycomments` | id, content, created_at | For comments on threads |
| Social (Following) | `prayercircles` | id, followerid, followingid | NOT for prayer requests |
| Likes/Reactions | `threadlikes`, `threadreactions`, `commentreactions` | Various | See Supabase dashboard |

## ❌ OLD Names - DO NOT USE

These table names were used in the original code but are WRONG:
- ❌ `podcasts` → Use `episodes` 
- ❌ `prayer_requests` → Use `communitythreads` with category filter
- ❌ `testimonies` → Use `communitythreads` with category filter
- ❌ `profiles` → Use `users`
- ❌ `comments` → Use `communitycomments`
- ❌ Column `published_at` → Use `created_at` or `createdat` (depending on table)

## Query Examples

### ✅ Correct Queries

```typescript
// Get all episodes
const { data } = await supabase
  .from('episodes')
  .select('*')
  .order('created_at', { ascending: false });

// Get all prayers (NO is_testimony filter - column doesn't exist yet)
const { data } = await supabase
  .from('prayercircles')
  .select('*')
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

// WRONG - Column doesn't exist (yet)
await supabase.from('prayercircles').select('*').eq('is_testimony', true);  // ❌ Column not added

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
