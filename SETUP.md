# GKP Radio Mobile App - Setup Instructions

## 🚨 IMPORTANT: Required Configuration Before Testing

### 1. Configure the Live Radio Stream URL

Before you can test the audio playback, you **must** set your actual radio stream URL:

1. **Find your stream URL from your radio streaming provider** (e.g., Zeno.fm, Radio.co, Shoutcast, Icecast)
2. **Create a `.env` file** in the `mobile` folder (copy from `.env.example`)
3. **Add your stream URL:**

```env
EXPO_PUBLIC_STREAM_URL=https://your-actual-stream-url-here
```

**Example stream URLs:**
- Zeno.fm: `https://stream.zeno.fm/your-station-id`
- Radio.co: `https://s3.radio.co/your-station/listen`
- Shoutcast: `http://your-server:port/stream`

### 2. Restart the Expo Dev Server

After adding the `.env` file:

```bash
# In Replit, restart the "Expo Dev Server" workflow
# Or manually:
cd mobile
npm start
```

### 3. Test on Your Phone

1. Install **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code shown in the console

3. Test the audio player:
   - Tap the play button in the bottom audio player
   - Stream should start playing
   - Controls should work (play/pause)

## 🎯 Next Steps

### For Development
- Configure Supabase connection for community features
- Add actual content from your backend API
- Test all screens and features

### For Production Deployment

1. **Update app icons and splash screen:**
   - Replace `mobile/assets/icon.png` with your app icon (1024x1024)
   - Replace `mobile/assets/splash-icon.png` with your splash screen
   - Replace `mobile/assets/adaptive-icon.png` for Android

2. **Configure EAS Build:**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

3. **Build for app stores:**
   ```bash
   # Android build
   eas build -p android --profile production
   
   # iOS build
   eas build -p ios --profile production
   ```

4. **Submit to stores:**
   ```bash
   # Submit to Google Play
   eas submit -p android
   
   # Submit to App Store
   eas submit -p ios
   ```

## 🔧 Troubleshooting

### Stream Not Playing
- ✅ Check that your `.env` file exists and has the correct URL
- ✅ Test the stream URL directly in a browser
- ✅ Make sure the URL is accessible (not behind authentication)
- ✅ Check console logs for errors

### Expo Go Connection Issues
- ✅ Make sure your phone and computer are on the same network
- ✅ Try using the "Tunnel" connection method if local network doesn't work
- ✅ Restart both the Expo server and Expo Go app

### Package Version Warnings
- ✅ Run `npx expo install --fix` to align all packages with Expo SDK

## 📱 App Store Information

- **Bundle ID (iOS)**: `com.gkpradio.mobile`
- **Package Name (Android)**: `com.gkpradio.mobile`
- **App Name**: GKP Radio
- **Version**: 1.0.0

## 🆘 Need Help?

Check the main [README.md](./README.md) for more documentation.
