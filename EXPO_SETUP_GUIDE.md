# 📱 Complete Expo App Setup Guide for Replit

## Overview

This guide explains how to set up the **GKP Radio Mobile App** from scratch in the Replit environment. This is a React Native + Expo application featuring live radio streaming, user authentication, community features, podcasts, and videos.

---

## 🎯 What You'll Build

A production-ready mobile app with:
- ✅ Live 24/7 radio streaming (AzuraCast integration)
- ✅ User authentication (Supabase)
- ✅ Community hub (prayers & testimonies)
- ✅ Podcasts and videos library
- ✅ Real-time now-playing data
- ✅ Cross-platform (iOS & Android via Expo Go)

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Replit account** (free or paid)
2. **Expo Go app** on your phone:
   - iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
3. **Supabase account** (free tier works) - [Sign up here](https://supabase.com)
4. **Optional**: Expo EAS account for production builds

---

## 🚀 Step-by-Step Setup

### Step 1: Install Node.js in Replit

```bash
# The agent should run this for you:
programming_language_install_tool(programming_languages=["nodejs-20"])
```

After installation, verify:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 2: Create Project Structure

Create the following folder structure:

```
workspace/
├── mobile/                    # Expo app (main focus)
│   ├── src/
│   │   ├── screens/          # All app screens
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # External integrations
│   │   └── types/            # TypeScript definitions
│   ├── assets/               # Icons and images
│   ├── App.tsx               # Main entry point
│   ├── app.json              # Expo configuration
│   ├── package.json          # Dependencies
│   ├── tsconfig.json         # TypeScript config
│   ├── tailwind.config.js    # NativeWind config
│   └── babel.config.js       # Babel config
├── supabase_schema.sql       # Database schema
├── .env.example              # Environment template
└── replit.md                 # Project documentation
```

### Step 3: Initialize Expo Project

Navigate to the mobile folder and install dependencies:

```bash
cd mobile
npm install
```

**Core Dependencies** (already in package.json):

```json
{
  "dependencies": {
    "@expo/ngrok": "^4.1.3",
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-navigation/bottom-tabs": "^7.5.0",
    "@react-navigation/native": "^7.1.18",
    "@supabase/supabase-js": "^2.76.1",
    "axios": "^1.12.2",
    "expo": "^54.0.20",
    "expo-av": "^16.0.7",
    "expo-constants": "^18.0.10",
    "expo-linear-gradient": "^15.0.7",
    "expo-secure-store": "^15.0.7",
    "expo-status-bar": "~3.0.8",
    "nativewind": "^4.2.1",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "^4.1.3",
    "react-native-safe-area-context": "^5.6.1",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^3.0.0",
    "tailwindcss": "^3.4.18"
  }
}
```

### Step 4: Configure app.json

Create `mobile/app.json` with these essential settings:

```json
{
  "expo": {
    "name": "GKP Radio",
    "slug": "gkp-radio",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "gkpradio",
    "primaryColor": "#047857",
    "ios": {
      "bundleIdentifier": "com.gkpradio.mobile"
    },
    "android": {
      "package": "com.gkpradio.mobile",
      "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"]
    },
    "extra": {
      "supabaseUrl": "YOUR_SUPABASE_URL",
      "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY",
      "azuracastBaseUrl": "http://74.208.102.89:8080"
    }
  }
}
```

### Step 5: Set Up Environment Variables

Create `.env` file in the **root directory** (not inside mobile folder):

```env
# AzuraCast Radio Configuration
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
EXPO_PUBLIC_STREAM_URL=https://stream.godkingdomprinciplesradio.com/live

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration (optional)
EXPO_PUBLIC_API_URL=https://godkingdomprinciplesradio.com/api
```

**Important**: Add `.env` to `.gitignore` to keep secrets secure!

### Step 6: Configure Supabase Database

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire `supabase_schema.sql` file
4. Click **Run** to create all tables, policies, and triggers

**Tables created:**
- `profiles` - User profiles
- `prayer_requests` - Community prayers
- `testimonies` - User testimonies
- `podcasts` - Audio content
- `videos` - Video content
- `likes` - Content likes
- `comments` - User comments

### Step 7: Set Up Replit Workflow

Configure the workflow to run the Expo dev server with tunnel mode:

```bash
# Use the workflows_set_run_config_tool:
name: "Expo Dev Server"
command: "cd mobile && npx expo start --tunnel --clear"
wait_for_port: null
output_type: "console"
```

**Why tunnel mode?**
- Tunnel mode (`--tunnel`) uses ngrok to create a public URL
- This allows your phone to connect to the Replit server from anywhere
- No need to be on the same WiFi network
- Perfect for cloud development environments like Replit

### Step 8: Create Essential Files

#### A. Main App Entry (`mobile/App.tsx`)

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './src/contexts/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import PodcastsScreen from './src/screens/PodcastsScreen';
import VideoScreen from './src/screens/VideoScreen';
// ... import icons and other screens

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Live" component={LiveScreen} />
          <Tab.Screen name="Community" component={CommunityScreen} />
          <Tab.Screen name="Podcasts" component={PodcastsScreen} />
          <Tab.Screen name="Videos" component={VideoScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
```

#### B. Supabase Client (`mobile/src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### C. AzuraCast API (`mobile/src/lib/azuracast.ts`)

```typescript
import axios from 'axios';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.azuracastBaseUrl || '';

export const azuracast = {
  getNowPlaying: async () => {
    const response = await axios.get(`${BASE_URL}/api/nowplaying/1`);
    return response.data;
  },
  
  getStreamUrl: () => {
    return `${BASE_URL}/radio/8000/radio.mp3`;
  }
};
```

#### D. Babel Config (`mobile/babel.config.js`)

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: ['nativewind/babel'],
  };
};
```

#### E. TypeScript Config (`mobile/tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Step 9: Start the Development Server

Click the **Run** button in Replit, or manually run:

```bash
cd mobile && npx expo start --tunnel --clear
```

**What happens:**
1. Metro bundler starts compiling your app
2. Expo creates a tunnel using ngrok
3. A QR code appears in the console
4. The app is ready to preview!

**Console output should show:**
```
› Metro waiting on exp://xxx-xxx-xxx.exp.direct
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Using Expo Go
› Tunnel ready.
```

### Step 10: Test on Your Phone

**For iOS:**
1. Open the built-in Camera app
2. Point it at the QR code in the Replit console
3. Tap the notification that appears
4. Expo Go will open and load your app

**For Android:**
1. Open the Expo Go app
2. Tap "Scan QR Code"
3. Point your camera at the QR code
4. The app will load automatically

**First load may take 1-2 minutes** as it downloads all JavaScript bundles.

---

## 🎨 Key Features Implementation

### Live Radio Streaming

Uses `expo-av` for audio playback:

```typescript
import { Audio } from 'expo-av';

const sound = new Audio.Sound();
await sound.loadAsync({ uri: streamUrl });
await sound.playAsync();
```

### Authentication

Uses Supabase Auth with AsyncStorage for session persistence:

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});
```

### Real-time Data

Fetches data from Supabase with pull-to-refresh:

```typescript
const { data: prayers, error } = await supabase
  .from('prayer_requests')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## 🔧 Troubleshooting

### QR Code Not Appearing
- Check that the workflow is running (green status)
- Look for "Tunnel ready" in the console
- Try restarting the workflow

### "Network Error" on Phone
- Ensure you're using `--tunnel` mode (not LAN)
- Check your phone has internet connection
- Wait 30 seconds for tunnel to fully initialize

### "Unable to Resolve Module"
- Run `cd mobile && npm install` again
- Clear cache: `npx expo start --clear`
- Restart the Replit workspace

### Supabase Connection Errors
- Verify credentials in `app.json` under `extra`
- Check Supabase dashboard is accessible
- Ensure RLS policies are set up correctly

### Audio Not Playing
- Check `EXPO_PUBLIC_STREAM_URL` is correct
- Test stream URL in browser first
- Ensure phone volume is up and not muted

---

## 📦 Project Files Checklist

Essential files you need:

- ✅ `mobile/package.json` - Dependencies
- ✅ `mobile/app.json` - Expo config
- ✅ `mobile/App.tsx` - Main app
- ✅ `mobile/babel.config.js` - NativeWind setup
- ✅ `mobile/tsconfig.json` - TypeScript
- ✅ `mobile/src/lib/supabase.ts` - Database client
- ✅ `mobile/src/lib/azuracast.ts` - Radio API
- ✅ `mobile/src/contexts/AuthContext.tsx` - Auth state
- ✅ `mobile/src/screens/` - All screen components
- ✅ `supabase_schema.sql` - Database schema
- ✅ `.env` - Environment variables
- ✅ `.gitignore` - Exclude .env and node_modules

---

## 🚀 Next Steps

### For Development:
1. Build out screen components in `mobile/src/screens/`
2. Create reusable UI components in `mobile/src/components/`
3. Add more features (comments, likes, profile editing)
4. Test on both iOS and Android devices

### For Production:
1. Set up EAS (Expo Application Services):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. Build for iOS:
   ```bash
   eas build --platform ios
   ```

3. Build for Android:
   ```bash
   eas build --platform android
   ```

4. Submit to app stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

## 🎯 Quick Start Command Summary

```bash
# 1. Install Node.js (via agent tool)
programming_language_install_tool(["nodejs-20"])

# 2. Install dependencies
cd mobile && npm install

# 3. Set up environment variables
# Create .env file with Supabase and AzuraCast credentials

# 4. Set up Supabase database
# Run supabase_schema.sql in Supabase dashboard

# 5. Configure workflow
workflows_set_run_config_tool(
  name="Expo Dev Server",
  command="cd mobile && npx expo start --tunnel --clear",
  output_type="console"
)

# 6. Click Run button in Replit

# 7. Scan QR code with Expo Go app on your phone

# Done! 🎉
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Replit Mobile App Templates](https://replit.com/@replit/Expo)

---

## ✨ Tips for Success

1. **Always use tunnel mode** in Replit for reliable mobile connectivity
2. **Keep .env secure** - never commit API keys to Git
3. **Test on real devices** - simulators don't show true performance
4. **Use TypeScript** - catch errors before they reach users
5. **Follow React Native best practices** - use FlatList for lists, avoid inline styles
6. **Monitor bundle size** - keep app under 50MB for fast downloads
7. **Implement error boundaries** - graceful error handling improves UX

---

## 🎉 You're Ready!

You now have everything you need to build and run the GKP Radio mobile app in Replit. The setup is complete, the workflow is configured, and you're ready to develop, test, and eventually publish to the App Store and Google Play.

**Happy coding!** 🚀📱
