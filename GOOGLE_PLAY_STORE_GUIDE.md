# Google Play Store Publishing Guide for GKP Radio

## Prerequisites
- Google Play Console account and access
- EAS CLI installed and logged in (`npm i -g eas-cli`)
- App package name: `com.gkpradio.mobile`
- **Current release (see `mobile/app.json`):** version **1.0.1**, Android `versionCode` **3**, iOS `buildNumber` **2**

> Always run builds from the **`mobile/`** directory so `app.json` and `eas.json` resolve correctly.

## Step 1: Setup EAS Project
```bash
# Navigate to mobile directory
cd mobile

# Login to EAS (already done)
eas login

# Initialize EAS project (if not already configured)
eas project:init
```

## Step 2: Configure Build Settings
Your `eas.json` is already configured with:
- Remote version source (recommended)
- Auto-increment enabled
- Android app-bundle build type
- Production track submission

## Pre-submit checklist (Play Console)
- [ ] **Privacy policy** URL live (app uses `extra.privacyPolicyUrl` in `mobile/app.json`).
- [ ] **Data safety** form completed (matches permissions: network, optional camera/mic/storage as used).
- [ ] **Content rating** questionnaire completed.
- [ ] **Target API** meets Google requirements (Expo SDK 54 / EAS Build uses current Android targets).
- [ ] **Store listing:** short + full description, 512×512 icon, feature graphic (1024×500), phone screenshots.
- [ ] **Signing:** Play App Signing enabled (default for new apps); upload key registered in Play Console.
- [ ] **EAS secrets** (if used): `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set on [expo.dev](https://expo.dev) for the project (see `mobile/eas.json` `production.env`).

## Step 3: Build for Production
```bash
cd mobile

# Optional: verify project health
npm run doctor

# Build Android App Bundle (AAB) for Google Play — or use: npm run build:android
eas build --platform android --profile production

# If you encounter EAS project issues, try a local build:
eas build --platform android --profile production --local
```

## Step 4: Submit to Google Play Store

### Option B: Manual Upload (Current Primary Method)
Since the Google Service Account is not yet configured, use this method:
1. After the EAS build finishes, click the link in your terminal to go to the EAS dashboard (or run `eas build:list`)
2. Download the built `.aab` (Android App Bundle) file from the EAS dashboard to your computer
3. Go to [Google Play Console](https://play.google.com/console)
4. Select your app: **GKP Radio**
5. Navigate to **Release** > **Production** (or **Internal testing**)
6. Click **Create new release**
7. Upload the downloaded `.aab` file
8. Complete the release notes and store listing details
9. Click **Save**, then **Review release**, and finally **Start rollout** to submit for review

### Option A: Automated Submission via EAS (Future Method)
Once you have configured a Google Service Account, you can automate submissions directly from your terminal:

```bash
cd mobile

# Submit the latest production build (after it finishes on EAS)
npm run submit:android

# Or explicitly:
eas submit --platform android --profile production
```

#### How to setup Option A (Google Service Account)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Play Android Developer API**
3. Create a Service Account (IAM & Admin > Service accounts > Create)
4. Create and download a JSON key for this service account
5. In Google Play Console, go to **Users and permissions** (or Setup > API access)
6. Invite the service account email and grant it "Admin" or "Release to production" permissions
7. When you run `eas submit`, provide the path to the downloaded JSON key file when prompted

## Required Store Assets
Ensure you have:
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2, phone size)
- App description
- Privacy policy URL (already configured: https://godkingdomprinciplesradio.com/privacy-policy)

## Environment Variables
Set these in your environment or EAS dashboard:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://fychjnaxljwmgoptjsxn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Technical notes
- **Cleartext HTTP (radio / AzuraCast):** `usesCleartextTraffic` is set via the `expo-build-properties` plugin in `mobile/app.json` (not the `android` block), so the config matches Expo’s schema and `expo-doctor` passes.

## Troubleshooting Common Issues

### 1. EAS Project Not Configured
```bash
eas project:configure
# Or create a new project on EAS dashboard and link it
```

### 2. Plugin Resolution Errors
Ensure all plugins in `app.json` are properly formatted:
```json
"plugins": [
  ["expo-font"],
  ["expo-video"]
]
```

### 3. Build Failures
- Check dependencies: `npm install`
- Clear cache: `expo start --clear`
- Update EAS CLI: `npm install -g eas-cli`

### 4. Google Play Console Rejection
- Verify app permissions match usage
- Ensure privacy policy is accessible
- Check content rating compliance

## Version management
- **User-facing version:** `expo.version` in `mobile/app.json` (e.g. `1.0.1`).
- **Android `versionCode`:** must increase for every Play upload (`android.versionCode` in `mobile/app.json`).
- **EAS:** `production` uses `autoIncrement: true` and `appVersionSource: remote` in `mobile/eas.json` — version codes can also be managed on EAS; keep local `app.json` in sync when you cut a release.
- Bump `version` + `versionCode` before each store submission if you do not rely solely on remote versioning.

## Post-Submission
1. Monitor review status in Google Play Console
2. Respond to any review feedback promptly
3. Once approved, app will be available on Play Store

## Quick Commands Reference
```bash
# Build and submit in one command
eas build --platform android --profile production && eas submit --platform android --profile production

# Check build status
eas build:list

# View submission history
eas submit:list
```

## Support Resources
- EAS Build documentation: https://docs.expo.dev/build/introduction/
- Google Play Console help: https://support.google.com/googleplay/android-developer
- Expo deployment guide: https://docs.expo.dev/distribution/app-stores/
