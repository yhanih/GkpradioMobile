# iOS App Store build & upload

## No EAS cloud quota — local build + Transporter (default for this project)

**We do not use EAS cloud builds when quota is exhausted.** Build on your Mac, then upload with Apple **Transporter** (or Xcode Organizer).

### Prerequisites (one-time)

- macOS with **Xcode** (signed in with your Apple Developer account)
- **Transporter** from the Mac App Store
- `npm install` already done in `mobile/`
- Distribution cert + App Store provisioning profile for `com.gkpradio.mobile` (EAS can manage these once via `eas credentials`, or use Xcode **Signing & Capabilities**)

### 1. Commit your changes

EAS local and Xcode both use your working tree — commit so the IPA matches what you tested.

### 2. Build IPA locally (recommended)

From `mobile/`:

```bash
npm run appstore:ios:local
```

This runs `eas build --platform ios --profile production --local` — compiles on **your Mac**, does **not** use EAS cloud build minutes.

When it finishes, note the `.ipa` path (often `mobile/build-*.ipa` in the project directory).

**Alternative — Xcode only** (no EAS build CLI):

```bash
npm run appstore:ios:prebuild
open ios/*.xcworkspace
```

In Xcode: select **Any iOS Device** → **Product → Archive** → **Distribute App** → **App Store Connect** → export `.ipa` or upload from Organizer.

### 3. Upload with Transporter

1. Open **Transporter** (Mac App Store).
2. Sign in with the Apple ID that has App Store Connect access for GKP Radio.
3. Drag the `.ipa` into Transporter → **Deliver**.
4. Wait until processing completes in [App Store Connect](https://appstoreconnect.apple.com) → **TestFlight** / your app version.

### 4. Submit for review (App Store Connect)

1. Open the app version → select the new build → **Save**.
2. Fill **What’s New** and review notes.
3. **Submit for Review**.

You do **not** need `npm run appstore:ios:submit` if you use Transporter (that command is for EAS Submit / API key upload).

---

## EAS cloud build (when you have quota)

From `mobile/`:

### 1. Build (cloud compile, build number auto-increments)

```bash
npm run appstore:ios
```

### 2. When build is **Finished** on [expo.dev](https://expo.dev), upload to App Store Connect

```bash
npm run appstore:ios:submit
```

First upload may ask for Apple ID / App Store Connect app — that is normal.

### One command (build + upload, interactive)

After `ascAppId` is set in `eas.json` (see below):

```bash
npm run appstore:ios:all
```

Uses `--auto-submit` **without** `--non-interactive` so EAS can prompt if needed.

Legacy alias (build then submit as two steps):

```bash
npm run release:ios
```

---

## One-time setup (required for non-interactive)

### 1. App Store Connect App ID (`ascAppId`)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **GKP Radio**
2. Open the app → **App Information** → copy the **Apple ID** (numeric, e.g. `1234567890`)
3. In `mobile/eas.json`, replace `REPLACE_WITH_APP_STORE_CONNECT_APP_ID` under `submit.production.ios.ascAppId`

### 2. Apple credentials in EAS

Run once (interactive):

```bash
cd mobile
eas credentials
```

Or use an [App Store Connect API key](https://docs.expo.dev/submit/ios/#app-store-connect-api-key) and store it in EAS.

### 3. Log in to EAS

```bash
eas login
```

---

## What this does **not** do (Apple limits)

| Action | Automated? | Where |
|--------|------------|--------|
| Build IPA | Yes | `npm run appstore:ios` |
| Upload to App Store Connect / TestFlight | Yes | `--auto-submit` |
| Set age rating to 18+ | No | App Store Connect → Age Rating |
| Paste Review Notes / demo account | No | App Store Connect → App Review Information |
| Reply to rejection (1.2, 2.1b) | No | Resolution Center |
| Click **Submit for Review** | No | App Store Connect (after build is linked) |

EAS gets the binary to Apple; **you still submit for review** in App Store Connect (about 2 minutes).

---

## Full resubmit flow (minimal manual)

1. `cd mobile && npm run appstore:ios` — wait ~15–25 min
2. App Store Connect → version → select new build → **Save**
3. Age Rating + Review Notes (see `APPLE_REVIEW_RESUBMISSION_ROADMAP.md` Step 3)
4. Resolution Center → paste 1.2 + 2.1b replies (Step 4)
5. **Submit for Review**

Optional: create reviewer login:

```bash
npm run appstore:review-user
```

---

## Troubleshooting

- **Interactive prompts**: `ascAppId` missing or wrong → fix `eas.json`
- **Submit failed**: run `eas submit --platform ios --latest` after build ID appears on [expo.dev](https://expo.dev)
- **Build only**: `npm run build:ios`

### `6763207173 is not a valid ID for this relationship` (409)

Your **Apple ID** in App Information can be correct and upload still fail. Common fixes:

1. **App Store Connect → Agreements** — accept any pending contracts (Business / Paid Apps).
2. **Regenerate the Submit API key** (most common fix):
   - [expo.dev](https://expo.dev) → project **gkp-radio** → **Credentials** → iOS → **com.gkpradio.mobile**
   - Under **App Store Connect API Key**, remove the old Submit key
   - Locally: `cd mobile && eas credentials` → iOS → production → **App Store Connect: Manage your API Key** → **Add a new API Key for EAS Submit**
3. Confirm `eas.json` has `appleTeamId`: `C3C9R5MRL2` (GOD KINGDOM PRINCIPLES RADIO LLC / GKP RADIO LLC).
4. Retry: `eas submit --platform ios --profile production --path ./build-XXXX.ipa`
5. **Fallback:** upload the same `.ipa` with Apple **Transporter** (uses Apple ID login, not the API key).
