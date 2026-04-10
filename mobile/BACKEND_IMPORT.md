# WordPress to Supabase Import

This project includes a one-time importer that migrates existing WordPress content into your Supabase backend tables.

## What It Imports

- `podcasts` -> `public.podcasts`
- `videos` -> `public.videos`
- `radio` schedule -> `public.radio_schedule`
- `testimonies` -> `public.posts` (category: `Testimonies`)
- testimony comments -> `public.comments`

## Important Behavior

- The script is **idempotent by reset**: it clears target tables before inserting fresh data.
- It creates/reuses one Supabase Auth user (`SUPABASE_IMPORTER_EMAIL`) and uses that profile as author for imported posts/comments.
- Existing likes/bookmarks are not imported.

## Required Environment Variables (`mobile/.env`)

- `EXPO_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional: `SUPABASE_IMPORTER_EMAIL` (default: `importer@gkpradio.local`)
- optional: `WORDPRESS_API_BASE_URL` (default: `https://godkingdomprinciplesradio.com/apis/wp-json`)

## Run

Dry run:

```bash
npm run seed:wordpress:dry
```

Write import:

```bash
npm run seed:wordpress
```
