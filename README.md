# GKP Radio Mobile App

God Kingdom Principles Radio mobile application built with React Native and Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Running the App

1. **Start the development server:**
   ```bash
   cd mobile
   npm start
   ```

2. **Scan the QR code** with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

3. **Alternative methods:**
   - Press `w` to open in web browser
   - Press `a` to open in Android emulator
   - Press `i` to open in iOS simulator (macOS only)

## 📱 Features

- **Live Radio Streaming**: Listen to GKP Radio 24/7
- **Community Hub**: Connect with 2,500+ believers
- **Podcasts**: Access all shows and sermons
- **Video Content**: Watch services and teachings
- **Prayer Requests**: Share and support community needs
- **Testimonies**: Celebrate God's work

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── CommunityScreen.tsx
│   │   ├── PodcastsScreen.tsx
│   │   ├── VideoScreen.tsx
│   │   └── LiveScreen.tsx
│   ├── components/        # Reusable components
│   │   └── AudioPlayer.tsx
│   └── navigation/        # Navigation config (in App.tsx)
├── assets/                # Images, fonts, etc
├── App.tsx                # Main app entry with navigation
├── app.json               # Expo configuration
└── eas.json               # Build configuration
```

## 🔧 Environment Variables

Create a `.env` file in the `mobile` folder:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_API_URL=https://godkingdomprinciplesradio.com/api
```

## 📦 Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build for Android:**
   ```bash
   eas build -p android --profile production
   ```

4. **Build for iOS:**
   ```bash
   eas build -p ios --profile production
   ```

### Submit to Stores

1. **Submit to Google Play:**
   ```bash
   eas submit -p android
   ```

2. **Submit to App Store:**
   ```bash
   eas submit -p ios
   ```

## 🎨 Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Native navigation
- **Expo Linear Gradient**: Gradient components
- **Expo AV**: Audio/video playback (future integration)
- **React Native Safe Area Context**: Handle device notches/safe areas

## 🔗 Connecting to Web Backend

The mobile app connects to the same Supabase backend as the web version at `https://godkingdomprinciplesradio.com`. This ensures:

- Shared user accounts
- Synchronized prayer requests and testimonies
- Real-time community updates
- Consistent content across platforms

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache
npx expo start -c
```

### Package Version Conflicts
```bash
# Install recommended versions
npx expo install --fix
```

### Build Errors
```bash
# Check EAS build status
eas build:list
```

## 📱 App Store Information

- **Bundle ID (iOS)**: `com.gkpradio.mobile`
- **Package Name (Android)**: `com.gkpradio.mobile`
- **Version**: 1.0.0
- **Primary Color**: #047857 (Green)

## 🙏 Ministry Impact

Join 2,500+ members in:
- 45K+ prayers lifted
- 8.2K+ discussions
- 24/7 live ministry
- Daily encouragement

---

**Built with ❤️ for the Kingdom**
