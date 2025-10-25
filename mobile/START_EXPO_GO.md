# 🚀 Start Testing with Expo Go - Quick Guide

## Prerequisites Checklist

- [ ] **Expo Go app installed** on your phone
  - iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
  
- [ ] **Phone and computer on same WiFi network**

## Step-by-Step Instructions

### 1️⃣ Set Up Environment Variables

Copy the example file and fill in your credentials:

```bash
cd mobile
cp .env.example .env
```

Edit `.env` with your actual values:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
EXPO_PUBLIC_AZURACAST_STATION_ID=1
```

**Where to find these values:**
- **Supabase URL & Key**: Go to your Supabase project → Settings → API
- **AzuraCast**: Already configured (default values work)

### 2️⃣ Install Dependencies (if not done)

```bash
npm install
```

### 3️⃣ Start Expo Development Server

```bash
npx expo start
```

You should see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 4️⃣ Open on Your Phone

**iOS:**
1. Open your **Camera** app
2. Point at the QR code on your screen
3. Tap the notification banner
4. App opens in Expo Go ✨

**Android:**
1. Open **Expo Go** app
2. Tap "Scan QR code"
3. Scan the QR code
4. App loads ✨

### 5️⃣ Test the App!

**What to Test:**

✅ **Navigation** - Swipe through tabs: Home, Live, Community, Podcasts, Videos
✅ **Live Screen** - See AzuraCast now playing info
✅ **Audio Player** - Tap "Listen Live" (basic playback works)
✅ **Mini Player** - Bottom player visible on all tabs
✅ **Authentication** - Tap profile icon → Login/Signup screens
✅ **Pull to Refresh** - Pull down on any screen
✅ **UI Design** - Check colors, layout, spacing

**Known Limitations in Expo Go:**
⚠️ Background audio won't work fully (needs development build)
⚠️ Audio may stop when app goes to background

## Troubleshooting

### "Cannot connect to Metro"
```bash
# Try tunnel mode (slower but works around network issues)
npx expo start --tunnel
```

### Environment variables not loading
```bash
# Clear cache and restart
npx expo start -c
```

### App crashes on startup
- Check that Supabase URL/Key are correct
- Make sure all EXPO_PUBLIC_ variables are set
- Check the error message in Expo Go

### Can't scan QR code
- Ensure phone and computer are on same WiFi
- Use `--tunnel` mode as workaround
- Manually type the URL shown in terminal into Expo Go

## Development Tips

**Hot Reload:** Save any file → See changes instantly ⚡

**Dev Menu:** Shake your phone or press:
- iOS: Cmd + D (simulator)
- Android: Cmd/Ctrl + M (emulator)

**Debug:** Press `j` in terminal to open Chrome debugger

## Next Steps After Testing

Once you've tested the UI:

1. **Give Feedback** - What looks good? What needs work?
2. **Development Build** - For full background audio
3. **Production Build** - For App Store/Play Store

---

**Questions?** See the full guide in `EXPO_GO_TESTING.md`
