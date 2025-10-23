
# GKP Radio Mobile App

## Overview
Native iOS and Android application for GKP Radio (God Kingdom Principles Radio). Built with React Native and Expo, ready for App Store and Google Play publication.

## Project Information
- **Original Figma Design**: https://www.figma.com/design/mrLXItbOF9hR7vWJCUfDx1/Website-Feedback-Request
- **Tech Stack**: React Native 0.81, Expo SDK 54, TypeScript
- **UI Framework**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation 7
- **Audio**: Expo AV

## Mobile App Development

### Framework
- **React Native** with Expo SDK 54 for cross-platform development
- **Navigation**: React Navigation 7 with bottom tab navigator
- **Audio Streaming**: Expo AV for live radio playback
- **Build & Deployment**: EAS Build for App Store and Google Play submission
- **Environment Config**: Environment variables for stream URL and API endpoints
- **Bundle IDs**: 
  - iOS: `com.gkpradio.mobile`
  - Android: `com.gkpradio.mobile`

## Quick Start

1. Click the **Run** button to start the Expo Dev Server
2. Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
3. Scan the QR code shown in the console
4. App loads immediately for real-time testing

## Configuration

Before testing audio playback, configure your stream URL in `mobile/.env`:

```env
EXPO_PUBLIC_STREAM_URL=https://your-actual-stream-url-here
```

## Publishing to App Stores

The app is production-ready. To publish:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for stores
npm run build:android  # For Google Play
npm run build:ios      # For App Store

# Submit to stores
npm run submit:android
npm run submit:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # All 5 app screens
│   └── components/        # Audio player & shared components
├── assets/                # App icons & images
├── App.tsx                # Main entry with navigation
├── app.json               # Expo configuration
├── eas.json               # Build configuration
└── package.json           # Dependencies
```

## Recent Changes

### Jan 23, 2025 - Refactored to Mobile-Only
- ✅ Removed web app files and dependencies
- ✅ Updated project structure to focus on mobile development
- ✅ Simplified build scripts and workflows
- ✅ Updated documentation for mobile-only project

### Oct 23, 2025 - Mobile App Development
- ✅ Created full React Native + Expo mobile app
- ✅ Implemented all 5 screens with React Native
- ✅ Set up functional audio player with Expo AV
- ✅ Configured React Navigation with bottom tabs
- ✅ Prepared app.json for App Store and Google Play
- ✅ Set up EAS Build for production
- ✅ Expo Dev Server running with QR code testing
