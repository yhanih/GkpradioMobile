# GKP Radio - Mobile App (React Native + Expo)

Faith-based digital community platform for iOS and Android.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for testing)

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your Supabase and AzuraCast credentials
```

3. **Start development server**:
```bash
npm start
```

4. **Run on device**:
- Download **Expo Go** app on your iOS/Android device
- Scan the QR code from the terminal

## 📱 Testing

### iOS (Mac only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web (for testing)
```bash
npm run web
```

## 🏗️ Build for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI**:
```bash
npm install -g eas-cli
```

2. **Login to Expo**:
```bash
eas login
```

3. **Configure EAS**:
```bash
eas build:configure
```

4. **Build for iOS**:
```bash
eas build --platform ios
```

5. **Build for Android**:
```bash
eas build --platform android
```

6. **Submit to stores**:
```bash
eas submit --platform ios
eas submit --platform android
```

## 📂 Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home
│   │   ├── community.tsx  # Community
│   │   ├── podcasts.tsx   # Podcasts
│   │   ├── videos.tsx     # Videos
│   │   └── live.tsx       # Live Radio
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable components
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase client
│   └── azuracast.ts      # AzuraCast API
├── assets/               # Images, fonts, etc.
└── app.json              # Expo configuration
```

## 🎨 Design System

- **Primary Color**: `#047857` (Green - Kingdom/Growth)
- **Accent Color**: `#ef4444` (Red - Live/Urgent)
- **Typography**: System default (SF Pro on iOS, Roboto on Android)
- **Spacing**: 4px base unit

## 🔧 Configuration

### Environment Variables

Create `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
EXPO_PUBLIC_AZURACAST_STATION_ID=1
```

### App Configuration

Edit `app.json` for:
- App name and slug
- Bundle identifiers
- Icons and splash screens
- Permissions

## 📱 Features

- ✅ Live 24/7 radio streaming (AzuraCast)
- ✅ User authentication (Supabase Auth)
- ✅ Home dashboard with stats
- ✅ Community prayers & testimonies
- ✅ Podcasts library
- ✅ Videos library
- ✅ Persistent audio player
- ✅ Real-time updates

## 🚢 Deployment

### App Store (iOS)

1. Apple Developer account ($99/year)
2. Create app in App Store Connect
3. Build with EAS: `eas build --platform ios`
4. Submit: `eas submit --platform ios`

### Google Play (Android)

1. Google Play Developer account ($25 one-time)
2. Create app in Google Play Console
3. Build with EAS: `eas build --platform android`
4. Submit: `eas submit --platform android`

## 🔗 Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)

## 📄 License

Copyright © 2025 GKP Radio
