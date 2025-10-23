# GKP Radio - Web & Mobile Platform

## Overview
Complete digital platform for GKP Radio (God Kingdom Principles Radio) including both a web application and a native mobile app. The platform features live radio streaming, podcast browsing, video content, and community engagement tools.

### Web Application
Mobile-responsive web app built with React, TypeScript, Vite, and Tailwind CSS.

### Mobile Application  
Native iOS and Android app built with React Native and Expo, ready for App Store and Google Play publication.

## Project Information
- **Original Figma Design**: https://www.figma.com/design/mrLXItbOF9hR7vWJCUfDx1/Website-Feedback-Request
- **Tech Stack**: React 18, TypeScript, Vite 6, Tailwind CSS 3
- **UI Components**: shadcn/ui with Radix UI primitives
- **Build System**: Vite with SWC for fast compilation

## Project Structure
```
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── figma/           # Figma-specific utilities
│   │   ├── AudioPlayer.tsx  # Audio streaming player
│   │   ├── BottomNav.tsx    # Mobile bottom navigation
│   │   ├── HomeScreen.tsx   # Main home screen
│   │   ├── CommunityScreen.tsx
│   │   ├── PodcastsScreen.tsx
│   │   ├── VideoScreen.tsx
│   │   └── LiveScreen.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind imports and theme
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies

```

## Recent Changes

### Oct 23, 2025 - Mobile App Development ✨
- ✅ **Created full React Native + Expo mobile app** in `mobile/` folder
- ✅ Migrated all 5 screens (Home, Community, Podcasts, Video, Live) to React Native
- ✅ Implemented functional audio player with Expo AV for live radio streaming
- ✅ Set up React Navigation with bottom tab navigation
- ✅ Configured app.json for App Store (iOS) and Google Play (Android)
- ✅ Set up EAS Build for production app builds
- ✅ Created environment variable configuration for stream URL and API endpoints
- ✅ Installed all dependencies with Expo SDK 54 compatibility
- ✅ Expo Dev Server running with QR code for instant testing
- ✅ Complete documentation: mobile/README.md and mobile/SETUP.md

### Oct 22, 2025 - Web App Setup
- ✅ Set up web app for Replit environment
- ✅ Configured Vite to run on port 5000 with host 0.0.0.0
- ✅ **CRITICAL FIX**: Added `allowedHosts: true` to Vite config for Replit proxy compatibility
- ✅ Created TypeScript configuration files (tsconfig.json, tsconfig.node.json)
- ✅ Set up Tailwind CSS v3 with proper configuration
- ✅ Added PostCSS configuration
- ✅ Created .gitignore for Node.js projects
- ✅ Configured deployment settings for Replit autoscale
- ✅ Installed all required dependencies

## Development
- **Start dev server**: `npm run dev` (runs on http://localhost:5000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## Key Features
- 🎵 Live audio streaming with player controls
- 📱 Mobile-first responsive design
- 🏠 Home screen with community stats (2.5K members, 8.2K messages, 45K prayers)
- 👥 Community engagement section
- 🎙️ Podcasts library
- 📹 Video content
- 📡 Live radio streaming
- 🎨 Modern UI with shadcn/ui components

## Configuration Notes
- **Port**: 5000 (required for Replit)
- **Host**: 0.0.0.0 (allows Replit proxy access)
- **Allowed Hosts**: Set to `true` in vite.config.ts (critical for Replit proxy compatibility)
- **Deployment**: Autoscale mode with Vite preview server
- **Build Output**: `build/` directory

## Dependencies Highlights
- React 18 with React DOM
- Vite 6 with SWC plugin for fast builds
- Tailwind CSS 3 with tailwindcss-animate
- Radix UI components (@radix-ui/react-*)
- Lucide React for icons
- Additional UI libraries: recharts, react-hook-form, react-day-picker

## User Preferences
None specified yet.

## Architecture Decisions

### Web Application
- **Build System**: Using Vite for fast HMR and optimized builds
- **Styling**: Tailwind CSS for utility-first styling with shadcn/ui for pre-built components
- **Type Safety**: Full TypeScript support throughout the codebase
- **Component Library**: shadcn/ui provides accessible, customizable components

### Mobile Application
- **Framework**: React Native with Expo SDK 54 for cross-platform development
- **Navigation**: React Navigation 7 with bottom tab navigator
- **Audio Streaming**: Expo AV for live radio playback
- **Build & Deployment**: EAS Build for App Store and Google Play submission
- **Environment Config**: Environment variables for stream URL and API endpoints
- **Bundle IDs**: 
  - iOS: `com.gkpradio.mobile`
  - Android: `com.gkpradio.mobile`

## Mobile App Testing
The Expo Dev Server is running! Test the mobile app instantly:
1. Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code shown in the "Expo Dev Server" workflow console
3. App loads immediately on your phone for real-time testing

## Publishing to App Stores
The mobile app is production-ready. To publish:
```bash
cd mobile
eas build -p android --profile production  # For Google Play
eas build -p ios --profile production      # For App Store
eas submit -p android                       # Submit to Google Play
eas submit -p ios                           # Submit to App Store
```

See `mobile/SETUP.md` for detailed deployment instructions.
