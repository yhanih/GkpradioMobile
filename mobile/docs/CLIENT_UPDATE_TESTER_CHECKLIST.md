# Client update — tester verification checklist

Use this after installing a **new** TestFlight/App Store build (not an older approved build).

## 1. Confirm you have the new build

**More** tab → scroll to **About** → **App Version**

- Must show **`1.0.5 (build …)`** or higher
- Must show line: **`Client update package · Mar 2026`**

If you do **not** see that line, you are on an **old binary** — uninstall the app and install the latest TestFlight build.

## 2. Feature checks

| # | Where to test | Expected |
|---|----------------|----------|
| 1 | **More** → section title | **Settings** (not “Preferences”) |
| 2 | **More** → Settings | Row **Notifications** (not “Activity”) |
| 3 | **Profile** → Settings | Row **Notifications** (not “Activity”) |
| 4 | **Home** → green stats card → **Promotions** | Opens with **green “Back to Home”** bar at top (not full Safari) |
| 5 | **Games** tab → play any game | **“Return to Radio”** bar at top |
| 6 | **Games** → Bible Word Search | Game loads (not blank / crash) — requires VPS patch |
| 7 | **Sign up** new account | **“Account created”** full screen with email instructions |
| 8 | **Community** → new discussion | Appears under **More → Notifications** after SQL migration on server |

## 3. Server steps (developer — not visible in app alone)

- **Supabase:** run `mobile/migrations/27_discussion_post_notifications.sql` on project `hgjwpebygzrnkcaflcqh`
- **VPS:** run `python3 mobile/scripts/patch-vps-games-player-name.py` (fixes Word Search JS)

## 4. Build reminder

Local changes are **not** on testers’ phones until you:

1. Commit all `mobile/` changes
2. Bump iOS build in `app.config.js` / EAS
3. `npm run appstore:ios:local` (from `mobile/`) **after** `npx expo prebuild` if native deps changed
4. Upload new `.ipa` via Transporter → TestFlight

An `.ipa` in the repo folder is **not** automatically what TestFlight serves unless that exact file was uploaded.
