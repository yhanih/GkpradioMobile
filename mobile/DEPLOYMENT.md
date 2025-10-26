# GKP Radio - App Store & Play Store Deployment Guide

This guide covers the complete process of building and deploying the GKP Radio mobile app to the Apple App Store and Google Play Store.

## Prerequisites

Before deploying, ensure you have:

1. ✅ **Expo Account**: Sign up at https://expo.dev
2. ✅ **EAS CLI**: Install with `npm install -g eas-cli`
3. ✅ **Apple Developer Account** ($99/year): https://developer.apple.com
4. ✅ **Google Play Console Account** (one-time $25 fee): https://play.google.com/console
5. ✅ **Supabase Database**: Fully configured with all tables and sample data

## Pre-Deployment Checklist

### 1. Verify Database Setup

Before building, confirm your Supabase database is properly configured:

```bash
# Check that all tables exist in Supabase dashboard:
- profiles
- prayer_requests
- testimonies
- podcasts
- videos
- likes
- comments
```

Run the queries from `DATABASE_SETUP.md` if not already done.

### 2. Test the App Thoroughly

```bash
cd mobile
npx expo start --clear
```

Test all screens:
- ✅ Home screen loads with stats and featured content
- ✅ Community screen shows prayers and testimonies
- ✅ Podcasts screen lists all podcasts
- ✅ Videos screen lists all videos
- ✅ Profile screen allows login/signup and profile editing
- ✅ Live radio streaming works (if enabled)

### 3. Update Version Numbers

Edit `mobile/app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1.0.0"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

**Version Increment Rules:**
- Increment `version` for user-facing updates (e.g., 1.0.0 → 1.0.1)
- Increment `buildNumber` (iOS) and `versionCode` (Android) for every build

### 4. Verify Assets

All icons and images should be properly sized:

```bash
# Icon requirements:
- icon.png: 1024x1024 (recommended)
- adaptive-icon.png: 1024x1024 (recommended)
- splash-icon.png: any size, but should look good centered

# Note: expo-doctor will warn if icons aren't square
# This won't prevent builds but should be fixed for production
```

### 5. Review Environment Variables

Ensure Supabase credentials are configured:

**Option A: Using .env file (development)**
```env
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://fychjnaxljwmgoptjsxn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

**Option B: Using app.json (production)**
```json
"extra": {
  "supabaseUrl": "https://fychjnaxljwmgoptjsxn.supabase.co",
  "supabaseAnonKey": "your_key_here"
}
```

---

## Building with Expo Application Services (EAS)

### Initial Setup

1. **Login to Expo**:
```bash
eas login
```

2. **Configure your project**:
```bash
cd mobile
eas init
```

This creates an `eas.json` configuration file (already exists in this project).

### Build Profiles

The project has three build profiles in `eas.json`:

1. **development**: For testing on devices during development
2. **preview**: For internal testing (TestFlight/Internal Testing)
3. **production**: For App Store and Play Store submission

---

## iOS Build & Deployment

### Step 1: Create iOS Build

For App Store submission:

```bash
cd mobile
eas build --platform ios --profile production
```

For testing (simulator):

```bash
eas build --platform ios --profile preview
```

**What happens:**
- EAS builds your app in the cloud
- You'll get a download link when complete (~10-20 minutes)
- The build will be an `.ipa` file for iOS

### Step 2: Submit to App Store

#### Option A: Automatic Submission via EAS

```bash
eas submit --platform ios --latest
```

You'll need:
- Apple ID
- App-specific password (generate at appleid.apple.com)
- App Store Connect access

#### Option B: Manual Submission via App Store Connect

1. Download the `.ipa` file from EAS
2. Go to https://appstoreconnect.apple.com
3. Create a new app:
   - **Name**: GKP Radio
   - **Bundle ID**: com.gkpradio.mobile
   - **SKU**: gkp-radio-001
   - **Primary Language**: English
4. Upload the `.ipa` using **Transporter** app (macOS)
5. Fill in app metadata:
   - **Description**: "God Kingdom Principles Radio - Broadcasting Truth, Building Community, Transforming Lives"
   - **Keywords**: radio, christian, gospel, prayer, testimony, podcast
   - **Category**: Music & Lifestyle
   - **Privacy Policy URL**: (create one and add here)
   - **Screenshots**: 6.5" iPhone display + 12.9" iPad Pro
6. Submit for review

**iOS Review Time**: Typically 24-48 hours

---

## Android Build & Deployment

### Step 1: Create Android Build

For Google Play Store:

```bash
cd mobile
eas build --platform android --profile production
```

For testing (APK):

```bash
eas build --platform android --profile preview
```

**What happens:**
- EAS builds an `.aab` (Android App Bundle) for production
- Or an `.apk` for testing
- Build time: ~10-20 minutes

### Step 2: Submit to Google Play Store

#### Option A: Automatic Submission via EAS

```bash
eas submit --platform android --latest
```

You'll need a **Google Service Account Key** (JSON file).

#### Option B: Manual Submission via Google Play Console

1. Download the `.aab` file from EAS
2. Go to https://play.google.com/console
3. Create a new app:
   - **App name**: GKP Radio
   - **Default language**: English
   - **App type**: App
   - **Category**: Music & Audio
4. Set up your app:
   - Go to **Production** → **Create new release**
   - Upload the `.aab` file
5. Fill in store listing:
   - **Short description**: Christian radio app with sermons, podcasts, and community features
   - **Full description**: (comprehensive description of features)
   - **Screenshots**: Phone + 7" tablet + 10" tablet
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 PNG
6. Complete questionnaires (privacy, target audience, etc.)
7. Submit for review

**Android Review Time**: Typically a few hours to a few days

---

## Build Commands Reference

### Development Builds

For local device testing:

```bash
# iOS Development
eas build --platform ios --profile development
eas device:create  # Register test devices

# Android Development
eas build --platform android --profile development
```

### Preview Builds

For internal testing (TestFlight/Internal Testing):

```bash
# iOS Preview
eas build --platform ios --profile preview

# Android Preview
eas build --platform android --profile preview
```

### Production Builds

For store submission:

```bash
# Both platforms
eas build --platform all --profile production

# iOS only
eas build --platform ios --profile production

# Android only
eas build --platform android --profile production
```

### Check Build Status

```bash
eas build:list
eas build:view [BUILD_ID]
```

---

## Environment Variables for Production

When building for production, you can set environment variables:

### Option 1: EAS Secrets (Recommended)

```bash
# Set secrets that EAS will use during builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key" --type string
```

### Option 2: In eas.json

Already configured in `eas.json`:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
  }
}
```

---

## App Store Metadata

### Required Information

Prepare these before submission:

#### Screenshots
- **iOS**: 6.5" iPhone (1242 x 2688) + 12.9" iPad Pro (2048 x 2732)
- **Android**: Phone, 7" tablet, 10" tablet

#### App Description

**Short Description** (80 characters):
```
Christian radio app with live streaming, podcasts, prayers, and community
```

**Full Description**:
```
GKP Radio (God Kingdom Principles Radio) brings faith-based content directly to your mobile device. 

Features:
• Live Radio Streaming - Listen to Christian radio 24/7
• On-Demand Podcasts - Stream sermons, teachings, and faith-based conversations
• Video Content - Watch worship services, teachings, and events
• Prayer Requests - Share and support prayer needs within the community
• Testimonies - Read and share stories of God's work
• Community - Connect with believers around the world

Broadcasting Truth. Building Community. Transforming Lives.

Stay connected to your faith wherever you go with GKP Radio.
```

#### Keywords (iOS)
```
christian, radio, gospel, prayer, testimony, sermon, podcast, worship, bible, faith
```

#### Category
- **Primary**: Music
- **Secondary**: Lifestyle

#### Privacy Policy

Required for both stores. Create a privacy policy at your domain or use a generator:
- privacypolicygenerator.info
- freeprivacypolicy.com

### Content Rating

**iOS**:
- 4+ (No inappropriate content)

**Android**:
- Complete the content rating questionnaire
- Typically: Everyone or Teen

---

## Testing Before Production

### iOS TestFlight

1. Build with `preview` or `production` profile
2. Submit to TestFlight (automatic or via App Store Connect)
3. Invite testers via email
4. Testers install TestFlight app and accept invitation

### Android Internal Testing

1. Build with `preview` or `production` profile
2. Upload to Google Play Console → **Internal testing**
3. Add tester emails
4. Testers access via Google Play Store

---

## Post-Deployment

### Monitor Crashes and Analytics

1. **Expo Dashboard**: https://expo.dev
   - View crash reports
   - Monitor builds
   - Check update stats

2. **Sentry** (optional):
```bash
npx expo install sentry-expo
```

### Over-the-Air (OTA) Updates

For small JS/asset changes without rebuilding:

```bash
# Publish update to production
eas update --branch production --message "Bug fixes"

# Users will receive updates automatically
```

**Note**: OTA updates don't work for native code changes (requires new build).

### Version Updates

For each new version:

1. Update version numbers in `app.json`
2. Build new version: `eas build --platform all --profile production`
3. Submit updates to stores
4. Monitor adoption in store console

---

## Troubleshooting

### Build Fails

```bash
# View detailed build logs
eas build:view [BUILD_ID]

# Common issues:
- Missing credentials → Run `eas credentials`
- Invalid app.json → Run `npx expo-doctor`
- Memory errors → Use smaller images
```

### App Rejected by Apple

Common rejection reasons:
1. **Missing Privacy Policy**: Add URL to app.json
2. **Incomplete App Information**: Fill all metadata fields
3. **Crashes on Launch**: Test thoroughly on TestFlight first
4. **Guideline Violations**: Review App Store Review Guidelines

### App Not Appearing in Store

- **iOS**: Check App Store Connect for status
- **Android**: Ensure release is published (not just submitted)
- **Both**: Can take up to 24 hours to appear in search

### Users Report Errors

1. Check Expo dashboard for crash logs
2. Test on affected device/OS version
3. Push OTA update if possible
4. Submit new build if needed

---

## Maintenance Schedule

### Regular Tasks

**Weekly**:
- Review crash reports
- Monitor user feedback/ratings
- Update content (podcasts, videos, etc.)

**Monthly**:
- Check for dependency updates
- Review and respond to user reviews
- Analyze usage analytics

**As Needed**:
- Security patches
- Feature updates
- Bug fixes

### Dependency Updates

```bash
# Check for updates
npx expo-doctor

# Update Expo SDK
npx expo upgrade

# Update other packages
npm update
```

---

## Support and Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build Guide**: https://docs.expo.dev/build/introduction/
- **EAS Submit Guide**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Supabase Docs**: https://supabase.com/docs

---

## Quick Command Reference

```bash
# Login
eas login

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# Publish OTA update
eas update --branch production --message "Updates"

# Check build status
eas build:list
eas build:view [BUILD_ID]

# Manage credentials
eas credentials

# View project status
eas project:info
```

---

## Final Checklist Before First Submission

- [ ] Database fully configured with all tables
- [ ] Sample data added for testing
- [ ] All screens tested and working
- [ ] Icons properly sized (1024x1024)
- [ ] Version numbers set correctly
- [ ] Privacy policy created and URL added
- [ ] Screenshots prepared (iOS and Android)
- [ ] App descriptions written
- [ ] Keywords/categories selected
- [ ] expo-doctor checks pass (except cosmetic warnings)
- [ ] Test build on real devices
- [ ] Legal compliance reviewed

---

**You're ready to deploy GKP Radio! Good luck with your app store submission! 🎉**
