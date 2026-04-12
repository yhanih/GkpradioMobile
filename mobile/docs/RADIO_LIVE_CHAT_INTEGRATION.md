# Radio “Now playing” sheet and live chat — integration guide

The app includes an **Apple Music–style expanded sheet** when the user taps the **artwork + title area** of the floating [`AudioPlayer`](../src/components/AudioPlayer.tsx) bar. The sheet is implemented in [`RadioExpandedSheet`](../src/components/RadioExpandedSheet.tsx): large artwork, **LIVE** badge, play/pause, and a **live chat** section that is **UI-only** until you connect a backend.

This document explains how to replace the preview with a real chat.

---

## Current behavior (preview)

| Piece | Behavior |
|--------|------------|
| Open sheet | Tap **left side** of mini player (art + track text). Heart and play **do not** open the sheet. |
| Chat list | Seeded system message + **local-only** messages if the user is signed in and taps Send. |
| Persistence | Messages reset when the sheet closes. Nothing is sent to a server. |

---

## Recommended architecture

### Option A — Supabase Realtime (fits this repo)

1. **Table** `live_radio_messages` (example):

   - `id` (uuid, default `gen_random_uuid()`)
   - `room_id` (text) — e.g. `'gkp_radio_main'` so you can add more streams later
   - `author_id` (uuid, nullable for anonymous listeners if you allow it)
   - `display_name` (text)
   - `body` (text), max length enforced in app and with a DB check
   - `created_at` (timestamptz, default `now()`)

2. **RLS**

   - `INSERT`: authenticated users only; optional `auth.uid()` = `author_id`.
   - `SELECT`: authenticated (or `true` for read-only public listen if you accept abuse risk — usually authenticated read is safer).

3. **Realtime**

   - Enable replication for `live_radio_messages` (Supabase Dashboard → Database → Replication).
   - In the app, `supabase.channel('room:gkp_radio_main')` + `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_radio_messages', filter: 'room_id=eq.gkp_radio_main' }, handler)`.

4. **Rate limiting / abuse**

   - Edge Function or database trigger to cap messages per user per minute.
   - Reuse your existing **report / block** patterns from community UGC where applicable.

### Option B — Third-party chat (Sendbird, Stream, Firebase, etc.)

- Embed their React Native SDK in `RadioExpandedSheet` instead of the local `messages` state.
- Map `user` from [`AuthContext`](../src/contexts/AuthContext.tsx) to their user id / token.

### Option C — WebSocket to your own API

- Same UI: replace `setMessages` updates with socket `message` events.
- Send `{ type: 'chat', room, body, token }` on submit; validate JWT server-side.

---

## Code touchpoints (minimal integration path for Option A)

1. **Migration**  
   Add `live_radio_messages` + RLS policies under `mobile/migrations/` (or apply in Supabase SQL editor).

2. **`RadioExpandedSheet.tsx`**

   - Replace `SEED_MESSAGES` + local `messages` state with:
     - Initial fetch: `supabase.from('live_radio_messages').select(...).eq('room_id', ROOM).order('created_at', { ascending: true }).limit(50)`.
     - Subscribe to inserts; append new rows to state.
   - **Send**: `supabase.from('live_radio_messages').insert({ room_id: ROOM, author_id: user.id, display_name: ..., body: draft })`.
   - Remove or shorten the preview hint `Text` once live.

3. **Constants**

   - `ROOM_ID = 'gkp_radio_main'` (or from `EXPO_PUBLIC_LIVE_CHAT_ROOM_ID`).

4. **Optional: tie chat to “track session”**

   - Store AzuraCast / `now_playing` song id or title snapshot on each message (`track_label` column) for “who was on air when this was sent” (moderation and replay).

---

## Env vars (suggested)

```bash
EXPO_PUBLIC_LIVE_CHAT_ROOM_ID=gkp_radio_main
```

Use in the sheet when subscribing and inserting.

---

## UX notes

- Keep **play/pause** on the mini bar separate from the tap target that opens the sheet (already done).
- For **keyboard + tab bar**, the sheet uses `KeyboardAvoidingView`; adjust `keyboardVerticalOffset` if the composer is covered on certain devices.
- **Moderation**: surface a “Report” action on long-press per bubble that writes to your existing `reports` table with a new `target_type` if you add one (e.g. `live_chat_message`).

---

## Testing checklist

- [ ] Open sheet from multiple tabs; stream keeps playing.
- [ ] Send message as User A; User B sees it within a second (Realtime).
- [ ] Sign-out user cannot insert (RLS).
- [ ] Rude content: report path works; optional auto-hide for blocked users.

---

## Files reference

| File | Role |
|------|------|
| [`src/components/AudioPlayer.tsx`](../src/components/AudioPlayer.tsx) | Mini player; opens sheet from track area. |
| [`src/components/RadioExpandedSheet.tsx`](../src/components/RadioExpandedSheet.tsx) | Full “now playing” + chat UI — **replace preview logic here**. |
| [`src/contexts/AudioContext.tsx`](../src/contexts/AudioContext.tsx) | `nowPlaying`, `togglePlayback`, artwork/title source. |
| [`src/lib/supabase.ts`](../src/lib/supabase.ts) | Supabase client for queries and channels. |

When integration is done, you can shorten or delete the in-app “preview only” copy in `RadioExpandedSheet` so listeners are not confused.
