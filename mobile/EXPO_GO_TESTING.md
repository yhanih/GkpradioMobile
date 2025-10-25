# Testing GKP Radio Mobile App with Expo Go

## Quick Start Guide

### Prerequisites

1. **Install Expo Go on your phone**
   - iOS: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Same Network**
   - Your phone and computer must be on the same WiFi network

### Step 1: Set Up Environment Variables

Create a `.env` file in the `/mobile` directory with your configuration:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AzuraCast Configuration
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
EXPO_PUBLIC_AZURACAST_STATION_ID=1

# Optional: Owncast for video streaming
EXPO_PUBLIC_OWNCAST_URL=your_owncast_url
```

**Important:** All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

### Step 2: Install Dependencies

```bash
cd mobile
npm install
```

### Step 3: Start Expo Development Server

```bash
npx expo start
```

This will:
- Start the Metro bundler
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### Step 4: Open App on Your Phone

#### iOS (iPhone/iPad)
1. Open the **Camera** app
2. Point it at the QR code
3. Tap the notification to open in Expo Go

#### Android
1. Open **Expo Go** app
2. Tap "Scan QR code"
3. Point camera at the QR code

### Step 5: Test the App

Once the app loads, you can test:

✅ **Working Features:**
- Navigation between all tabs (Home, Live, Community, Podcasts, Videos)
- Login and Signup screens
- Supabase authentication
- AzuraCast API calls (now playing data)
- All UI components and layouts
- Pull-to-refresh on all screens
- Basic audio playback

⚠️ **Limited Features:**
- Background audio playback (requires development build)
- Audio continues when app is backgrounded (requires development build)
- Some advanced audio session features

### Troubleshooting

#### Can't Connect to Server?
- Ensure phone and computer are on same WiFi
- Try running: `npx expo start --tunnel`
- Check firewall settings

#### Environment Variables Not Working?
- Make sure they're prefixed with `EXPO_PUBLIC_`
- Restart the Expo server after changing .env
- Clear cache: `npx expo start -c`

#### App Crashes on Startup?
- Check the error message in Expo Go
- Verify Supabase credentials are correct
- Try clearing cache: `npx expo start -c`

#### Audio Not Playing?
- This is expected in Expo Go for advanced features
- Basic playback should work
- Full background audio requires a development build

### Development Tips

**Hot Reload**
- Save any file to see changes instantly
- Shake your phone to open dev menu
- Tap "Reload" to refresh manually

**Debug Menu (Shake Phone)**
- Reload
- Show Performance Monitor
- Toggle Element Inspector
- Open Debugger

**Live Updates**
- Changes to JavaScript files reload automatically
- Changes to native code require rebuild

### Next Steps After Expo Go Testing

Once you've tested the UI and basic functionality:

1. **Development Build** - For full audio features
   ```bash
   npx expo install expo-dev-client
   eas build --profile development
   ```

2. **Production Build** - For App Store/Play Store
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### Limitations of Expo Go

Expo Go is a sandbox environment with limitations:

❌ Cannot use custom native modules beyond Expo SDK
❌ Limited background audio capabilities
❌ Cannot test push notifications fully
❌ Some advanced native features unavailable

✅ Perfect for testing UI, navigation, and basic features
✅ Fast iteration and development
✅ Great for demo purposes

---

**Need Help?**
- Check Expo docs: https://docs.expo.dev
- Review mobile app architecture: See `AUDIO_PLAYER.md` and `README.md`
