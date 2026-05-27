# Mobile endpoint & environment inventory

**App:** GKP Radio · `com.gkpradio.mobile` · Expo SDK 54 · version `1.0.4`  
**Purpose:** EAS env verification and VPS routing alignment after WordPress recovery.

---

## EAS / build-time environment variables

Set in EAS project secrets and/or `mobile/.env` for local dev. All `EXPO_PUBLIC_*` are embedded in production builds.

| Variable | Default (if unset) | Used by | Required for |
|----------|-------------------|---------|--------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `app.config.js` → `https://hgjwpebygzrnkcaflcqh.supabase.co` | `supabase.ts` | Auth, community, media fallback |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `app.config.js` extra | `supabase.ts` | Same |
| `EXPO_PUBLIC_WORDPRESS_API_BASE_URL` | `https://godkingdomprinciplesradio.com/apis/wp-json` | `backend.ts`, `merch.ts` | Podcasts/videos WP fetch, merch base |
| `EXPO_PUBLIC_WORDPRESS_RADIO_STATUS_URL` | `…/custom-api/v1/radio-status` | `backend.ts` | Radio metadata (primary) |
| `EXPO_PUBLIC_STORE_PRODUCTS_URL` | `{BASE}/custom-api/v1/products` | `merch.ts` | Override full products URL |
| `EXPO_PUBLIC_STORE_PREPARE_CART_URL` | `{BASE}/custom-api/v1/prepare-cart` | `merch.ts` | Override checkout prep URL |
| `EXPO_PUBLIC_STREAM_URL` | `http://74.208.102.89:8080/listen/gkp_radio/radio.mp3` | `backend.ts` | Radio stream fallback |
| `EXPO_PUBLIC_AZURACAST_NOW_PLAYING_URL` | `https://stream.godkingdomprinciplesradio.com/api/nowplaying/gkp_radio` | `backend.ts` | Radio metadata fallback |
| `EXPO_PUBLIC_MERCH_STORE_WEB_URL` | `https://godkingdomprinciplesradio.com/shop` | `openMerchStoreBrowser.ts`, `app.config.js` | Browser fallback store |
| `EXPO_PUBLIC_DONATE_URL` | `https://godkingdomprinciplesradio.com/donate` | `donation.ts` | Giving handoff |
| `EXPO_PUBLIC_LIVE_VIDEO_URL` / `EXPO_PUBLIC_OWNCAST_URL` | (empty) | `backend.ts` | Live video fallback |
| `EXPO_PUBLIC_LIVE_VIDEO_TITLE` | `Kingdom Principles Live Show` | `backend.ts` | Live video UI |
| `EXPO_PUBLIC_LIVE_VIDEO_THUMBNAIL_URL` | (empty) | `backend.ts` | Live video thumb |
| `EXPO_PUBLIC_SENTRY_DSN` | (disabled) | `App.tsx` | Crash reporting |
| `EXPO_PUBLIC_APP_SHARE_URL` | `https://gkpradio.com` | `appShare.ts` | Share app link |
| `EXPO_PUBLIC_APP_STORE_URL` | (empty) | `appShare.ts` | Rate app |
| `EXPO_PUBLIC_IOS_APP_STORE_ID` | (empty) | `appShare.ts` | App Store deep link |
| `EXPO_PUBLIC_PLAY_STORE_URL` | Play Store listing | `appShare.ts` | Android rate |
| `EXPO_PUBLIC_HELP_DESK_EMAIL` | `helpdesk@gkpradio.com` | `contact.ts` | mailto |
| `EXPO_PUBLIC_FEEDBACK_EMAIL` | `feedback@gkpradio.com` | `contact.ts` | mailto |
| `EXPO_PUBLIC_LIVE_CHAT_ROOM_ID` | (unset) | `RadioExpandedSheet.tsx` | Live chat (optional) |
| `EXPO_PUBLIC_EXPO_PROJECT_ID` | EAS project in config | `notifications.ts` | Push token |
| `EXPO_PUBLIC_API_URL` | Documented only | **Not used in `src/`** | N/A (Express unused) |

**Scripts only (never bundle in app):**

| Variable | Default | Script |
|----------|---------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | — | `import-wordpress-to-supabase.mjs` |
| `WORDPRESS_API_BASE_URL` | `…/apis/wp-json` | import script |
| `SUPABASE_IMPORTER_EMAIL` | `importer@gkpradio.local` | import script |

---

## `app.config.js` baked-in values (production fallback)

| Key | Value |
|-----|-------|
| `extra.supabaseUrl` | `https://hgjwpebygzrnkcaflcqh.supabase.co` |
| `extra.supabaseAnonKey` | (JWT anon — see config) |
| `extra.azuracastBaseUrl` | `http://74.208.102.89:8080` |
| `extra.privacyPolicyUrl` | `https://godkingdomprinciplesradio.com/privacy` |
| `extra.merchStoreWebUrl` | `https://godkingdomprinciplesradio.com/shop` |
| `ios.bundleIdentifier` / `android.package` | `com.gkpradio.mobile` |
| `scheme` | `gkpradio` |
| `ios.associatedDomains` | `applinks:gkpradio.com` |

---

## HTTP API call graph (runtime)

### WordPress — **broken when `/apis` missing** (`merch.ts`, `backend.ts`)

| Method | URL pattern | Module | Screens / features |
|--------|-------------|--------|-------------------|
| GET | `{BASE}/custom-api/v1/products` | `merch.ts` | MerchStore, Home spotlight |
| POST | `{BASE}/custom-api/v1/prepare-cart` | `merch.ts` | CartSheet checkout |
| GET | `{BASE}/custom-api/v1/radio-status` | `backend.ts` | AudioContext (via `fetchRadioStatusFromAzuraCast`) |
| GET | `{BASE}/wp/v2/podcasts?…` | `backend.ts` | Home, Media (WP first, Supabase fallback) |
| GET | `{BASE}/wp/v2/videos?…` | `backend.ts` | Home, Media |

`BASE` = `EXPO_PUBLIC_WORDPRESS_API_BASE_URL` or default `https://godkingdomprinciplesradio.com/apis/wp-json`.

### WordPress — **hardcoded base** (`wordpress.ts` — ignores env)

| Method | URL | Features |
|--------|-----|----------|
| POST | `…/jwt-auth/v1/token` | Legacy (unused by auth screens) |
| POST | `…/custom-auth/v1/register` | Legacy |
| GET | `…/wp/v2/users/me`, users | Legacy |
| GET | `…/custom-api/v1/radio-status` | Legacy `getRadioStatus` |
| GET | `…/wp/v2/radio` | Schedule |
| GET | `…/wp/v2/podcasts` | PodcastsScreen, Profile bookmarks |
| GET | `…/wp/v2/videos` | VideoScreen, Profile bookmarks |
| GET/POST | `…/wp/v2/testimonies`, comments, likes | Legacy community WP paths |

**Hardcoded base:** `https://godkingdomprinciplesradio.com/apis/wp-json` (line 3, `wordpress.ts`).

### AzuraCast / streaming

| Method | URL | Module | Notes |
|--------|-----|--------|-------|
| GET | `EXPO_PUBLIC_AZURACAST_NOW_PLAYING_URL` | `backend.ts` | Radio fallback + queue |
| GET | `{azuracastBaseUrl}/api/nowplaying/{id}` | `azuracast.ts` | Axios (if used) |
| GET | `{azuracastBaseUrl}/api/stations` | `azuracast.ts` | Station list |
| Play | `stream_url` from API or `EXPO_PUBLIC_STREAM_URL` | `AudioContext` | expo-audio / expo-av |

Defaults: now-playing `https://stream.godkingdomprinciplesradio.com/api/nowplaying/gkp_radio`; direct IP `http://74.208.102.89:8080`.

### Supabase REST / Realtime

**Host:** `EXPO_PUBLIC_SUPABASE_URL` or `extra.supabaseUrl` → `https://hgjwpebygzrnkcaflcqh.supabase.co`

| Area | Tables / APIs | Primary screens |
|------|---------------|-----------------|
| Auth | `auth.*` | Login, Signup, reset password |
| Community | `posts`, `comments`, `post_likes`, `post_reactions`, `profiles`, `blocked_users`, `reports` | Community, PostDetail, Profile |
| Media fallback | `podcasts`, `videos` | Media, Home |
| Live | `live_events`, `live_radio_messages` | Media, RadioExpandedSheet |
| Schedule | `radio_schedule` | Live / schedule |
| Social | `bookmarks` | Bookmarks |
| Stats | `profiles`, `posts`, `podcasts`, `videos` counts | Home |
| Push | Expo push token on `profiles` | Notifications |

### Website handoff (SPA — **expected HTML**)

| URL | Purpose |
|-----|---------|
| `https://godkingdomprinciplesradio.com/shop?source=mobile` | Merch browser fallback |
| `https://godkingdomprinciplesradio.com/donate?amount=…&source=mobile` | Donations |
| `https://godkingdomprinciplesradio.com/terms` | Legal |
| `https://godkingdomprinciplesradio.com/privacy` | Privacy |
| `https://godkingdomprinciplesradio.com` | Hub links |
| `https://godkingdomprinciplesradio.com/connect` | Hub |

Checkout URL from `prepare-cart` is **dynamic** (WooCommerce on WP host).

### Deep links

| URL | Purpose |
|-----|---------|
| `gkpradio://auth/callback` | Email confirm / magic link |
| `gkpradio://reset-password` | Password reset |
| `https://gkpradio.com` | Universal links (associated domain) |

### Not used by mobile app

| URL | Note |
|-----|------|
| `https://godkingdomprinciplesradio.com/api/*` | `EXPO_PUBLIC_API_URL` documented; no `src/` references |
| WooCommerce `wc/v3/*` | Not called |

---

## Failure behavior summary

| Endpoint family | HTML/SPA response | App behavior |
|-----------------|-------------------|--------------|
| `custom-api/v1/products` | SPA HTML (fixed 2026-05-27) | Error + “Shop online” |
| `prepare-cart` | SPA / wrong root URL (fixed 2026-05-27) | Checkout error; server now returns `/apis/?gkp_cart=…` |
| `radio-status` | 404 `rest_no_route` | Falls back to AzuraCast now-playing URL |
| `wp/v2/podcasts|videos` via `backend.ts` | Yes | Falls back to Supabase |
| Same via `wordpress.ts` | Yes | Error, no fallback |
| `/shop`, `/donate` | Yes (intentional) | WebBrowser / Linking |

**Merch HTML guard** (`merch.ts`): rejects `Content-Type: text/html` or body starting with `<!DOCTYPE` / `<html`.

---

## EAS verification checklist (after VPS fix)

1. Open [expo.dev](https://expo.dev) → project `gkp-radio` → **Environment variables** for `production` profile.
2. Confirm `EXPO_PUBLIC_WORDPRESS_API_BASE_URL` = `https://godkingdomprinciplesradio.com/apis/wp-json` (or new API host if migrated).
3. If using temporary override during cutover, set full URLs:
   - `EXPO_PUBLIC_STORE_PRODUCTS_URL`
   - `EXPO_PUBLIC_STORE_PREPARE_CART_URL`
4. Rebuild **only if** changing `EXPO_PUBLIC_*` or `app.config.js` — OTA alone cannot fix baked env from prior build.
5. Store build identifiers: iOS `com.gkpradio.mobile`, Android `com.gkpradio.mobile`, version `1.0.4`.

---

## Post-recovery mobile hardening (backlog)

- [ ] Point `wordpress.ts` at `EXPO_PUBLIC_WORDPRESS_API_BASE_URL`
- [ ] Route PodcastsScreen / VideoScreen through `backend.ts` for Supabase fallback
- [ ] Consider `api.` subdomain in EAS to isolate from SPA deploys

---

*Generated for VPS/mobile incident handoff. See also `VPS_WORDPRESS_RECOVERY_CHECKLIST.md`.*
