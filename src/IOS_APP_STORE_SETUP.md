# iOS App Store Setup Guide

## Prerequisites

Before you begin, make sure you have:
- ✅ macOS computer (required for iOS development)
- ✅ Xcode installed (free from Mac App Store)
- ✅ Apple Developer Account ($99/year)
- ✅ Node.js and npm installed

## Step 1: Install Capacitor

Run these commands in your project directory:

```bash
# Install Capacitor CLI and iOS platform
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard

# Initialize Capacitor (if not already done)
npx cap init

# Add iOS platform
npx cap add ios
```

## Step 2: Build Your Web App

```bash
# Build your React app for production
npm run build

# This creates the 'dist' folder that Capacitor will use
```

## Step 3: Sync with iOS

```bash
# Copy web assets to native iOS project
npx cap sync ios

# Or use update if you've already synced before
npx cap update ios
```

## Step 4: Open in Xcode

```bash
# Open the iOS project in Xcode
npx cap open ios
```

## Step 5: Configure Your App in Xcode

### A. Update App Identity
1. In Xcode, select the project in the left sidebar
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. **Bundle Identifier**: Change to your unique ID (e.g., `com.yourcompany.gkpradio`)
5. **Team**: Select your Apple Developer team
6. **Display Name**: "GKP Radio"

### B. Set App Version
1. Go to "General" tab
2. **Version**: 1.0.0
3. **Build**: 1

### C. Update App Icon
1. In Xcode, go to `App/Assets.xcassets/AppIcon.appiconset`
2. Add your app icons in all required sizes:
   - 1024x1024 (App Store)
   - 180x180 (iPhone)
   - 167x167 (iPad Pro)
   - 152x152 (iPad)
   - 120x120 (iPhone)
   - 87x87 (iPhone)
   - 80x80 (iPad)
   - 76x76 (iPad)
   - 60x60 (iPhone)
   - 58x58 (iPad)
   - 40x40 (iPad/iPhone)
   - 29x29 (Settings)
   - 20x20 (Notifications)

### D. Configure Splash Screen
1. Go to `App/Assets.xcassets/Splash.imageset`
2. Add your splash screen image
3. Use your green color (#00A86B) as background

### E. Set Launch Screen
1. In Xcode, select `App/LaunchScreen.storyboard`
2. Customize with your branding

### F. Configure Capabilities
Since you're using audio streaming, you need to enable background audio:

1. Go to "Signing & Capabilities" tab
2. Click "+ Capability"
3. Add **Background Modes**
4. Check ✅ "Audio, AirPlay, and Picture in Picture"

### G. Update Info.plist for Permissions

Add these permissions to `App/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>GKP Radio would like to access your microphone for live chat and interactions.</string>

<key>NSCameraUsageDescription</key>
<string>GKP Radio would like to access your camera to share photos with the community.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>GKP Radio would like to access your photos to share with the community.</string>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## Step 6: Test on Simulator

1. In Xcode, select a simulator (e.g., iPhone 15 Pro)
2. Click the "Play" button or press `Cmd + R`
3. Test all functionality

## Step 7: Test on Real Device

1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click "Play" to build and run on your device
4. **First time**: You may need to trust your developer certificate on the device
   - Go to Settings > General > VPN & Device Management
   - Trust your developer certificate

## Step 8: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" > "+ New App"
3. Fill in details:
   - **Platform**: iOS
   - **Name**: GKP Radio
   - **Primary Language**: English
   - **Bundle ID**: Select the one you configured
   - **SKU**: gkpradio (unique identifier)
   - **User Access**: Full Access

## Step 9: Prepare App Metadata

### App Information
- **Name**: GKP Radio
- **Subtitle**: Faith-Based Community Radio
- **Category**: Music or Lifestyle
- **Content Rights**: Your information

### Privacy Policy & Terms
⚠️ **REQUIRED**: You need to host your privacy policy and terms of service on a public URL
- Update links in your ProfileScreen.tsx
- Apple will verify these links

### Description
Write a compelling description (4000 characters max). Example:

```
GKP Radio - God Kingdom Principles Radio

Experience faith-based community radio like never before. GKP Radio brings you 24/7 live streaming, inspiring podcasts, uplifting videos, and a vibrant community of believers.

Features:
• 24/7 Live Radio Streaming
• Inspiring Podcasts & Sermons
• Video Content Library
• Community Features: Prayer Requests, Testimonies, Discussions
• Real-time Live Chat
• Personalized Profile & Favorites
• Beautiful Apple Glass Design

Join thousands of listeners worldwide in experiencing God's Kingdom Principles through powerful content and community connection.
```

### Keywords
Music, Radio, Christian, Faith, Gospel, Church, Prayer, Bible, Podcast, Community

### Screenshots Required
You need to provide screenshots for:
- iPhone 6.7" (iPhone 15 Pro Max) - Required
- iPhone 6.5" (iPhone 14 Plus) - Required
- iPad Pro 12.9" - If supporting iPad

Take screenshots showing:
1. Home screen with stats
2. Community features
3. Live Radio screen
4. Podcasts library
5. Video content

## Step 10: Archive and Upload

### Create Archive
1. In Xcode, select "Any iOS Device (arm64)" as destination
2. Go to Product > Archive
3. Wait for archive to complete
4. Archive window will open automatically

### Validate Archive
1. Select your archive
2. Click "Validate App"
3. Select your distribution options:
   - Upload your app's symbols: Yes
   - Manage Version and Build Number: Yes
4. Click "Validate"
5. Fix any issues found

### Upload to App Store
1. Click "Distribute App"
2. Select "App Store Connect"
3. Click "Upload"
4. Select same options as validation
5. Click "Upload"
6. Wait for upload to complete (can take 5-30 minutes)

## Step 11: Submit for Review

1. Go to App Store Connect
2. Go to your app > "1.0 Prepare for Submission"
3. Fill in all required fields:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Privacy Policy URL
   - Age Rating
   - Pricing (Free or Paid)
4. Select the build you uploaded
5. Click "Add for Review"
6. Answer review questions honestly
7. Submit!

## Step 12: Review Process

- **Review Time**: Usually 24-48 hours
- **Status**: Check App Store Connect for updates
- **Notifications**: Apple will email you with status updates

### Common Rejection Reasons
1. ❌ **Missing Privacy Policy**: Make sure it's accessible
2. ❌ **Broken Links**: Test all URLs before submitting
3. ❌ **Crashes**: Thoroughly test before submitting
4. ❌ **Incomplete Information**: Fill in all metadata
5. ❌ **Guideline Violations**: Follow [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Step 13: After Approval

Once approved:
1. App will show "Pending Developer Release"
2. Click "Release This Version" to publish immediately
3. OR schedule automatic release

Your app will be live in the App Store within a few hours!

## Updating Your App

For future updates:

```bash
# 1. Make changes to your code
# 2. Update version in Xcode (e.g., 1.0.1)
# 3. Build
npm run build

# 4. Sync
npx cap sync ios

# 5. Open Xcode
npx cap open ios

# 6. Archive and upload (same as Step 10)
```

## Important Notes

### Azuracast Stream Configuration
⚠️ **Before submitting**: Make sure to configure your actual Azuracast stream URL in `/utils/AudioContext.tsx`. Apple reviewers will test the app, so the demo stream should work OR your real stream should be configured.

### Supabase Configuration
If you're using Supabase for authentication/database:
- Configure your production Supabase project
- Update environment variables
- Test thoroughly before submission

### App Store Guidelines Compliance
- ✅ No copyright violations
- ✅ Privacy policy clearly states data usage
- ✅ All features work as described
- ✅ No hidden features or functionality
- ✅ Appropriate content ratings

### Required URLs
Make sure these are publicly accessible:
- Privacy Policy URL
- Terms of Service URL
- Support URL (can be email: mailto:support@yourcompany.com)

## Helpful Resources

- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## Cost Summary

- Apple Developer Account: **$99/year**
- Mac computer: Required (if you don't have one)
- Xcode: Free
- Capacitor: Free
- App Store submission: Free (included in developer account)

## Estimated Timeline

- Setup & Configuration: 2-4 hours
- First build & testing: 1-2 hours
- Metadata preparation: 2-3 hours
- Review process: 24-48 hours
- **Total**: 2-3 days from start to App Store

---

Good luck with your App Store submission! 🚀

If you need help at any step, refer to this guide or check the official Apple documentation.
