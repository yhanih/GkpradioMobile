# One-command iOS upload (EAS)

## Recommended commands

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
