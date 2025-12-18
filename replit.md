# GKP Radio Mobile App

## Overview
Native iOS and Android application for GKP Radio (God Kingdom Principles Radio). Built with React Native and Expo, featuring live radio streaming, community engagement, and content management. Production-ready for App Store and Google Play.

## Project Information
- **Original Figma Design**: https://www.figma.com/design/mrLXItbOF9hR7vWJCUfDx1/Website-Feedback-Request
- **Tech Stack**: React Native 0.81, Expo SDK 54, TypeScript
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Streaming**: AzuraCast for live radio and now-playing data
- **UI Framework**: React Native StyleSheet API
- **Navigation**: React Navigation 7
- **Audio**: Expo AV
- **Storage**: AsyncStorage for session persistence

## Backend Architecture

### Supabase Integration
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Email/password with secure session management

### ⚠️ ACTUAL Database Schema (Dec 2024)
**CRITICAL: These are the REAL table names in Supabase. Always use these in queries:**
- `episodes` - Audio content (NOT `podcasts`)
- `videos` - Video content
- `prayercircles` - Community prayers with `is_testimony` boolean flag
- `users` - User profiles and metadata (NOT `profiles`)
- `communitycomments` - Comments on community content
- `threadlikes`, `threadreactions`, `commentreactions` - Engagement data
- See Supabase dashboard for complete table list

**Note**: The app originally used different table names (`podcasts`, `prayer_requests`, `profiles`, `testimonies`). These were renamed in Supabase. All queries in the app code have been updated to use the correct table names above.

- **Security**: RLS policies ensure users can only modify their own content
- **Real-time**: Automatic profile creation on user signup via triggers

### AzuraCast Integration
- **Server**: http://74.208.102.89:8080
- **Live Stream**: Real-time audio streaming
- **Now Playing**: Live metadata (song, artist, album art)
- **Listener Stats**: Real-time listener count and schedule data
- **Polling**: Updates every 10 seconds

## Mobile App Development

### Framework
- **React Native** with Expo SDK 54 for cross-platform development
- **Navigation**: React Navigation 7 with bottom tab navigator
- **Audio Streaming**: Expo AV for live radio playback with background support
- **State Management**: React Context for authentication
- **Build & Deployment**: EAS Build for App Store and Google Play submission
- **Environment Config**: Environment variables for Supabase and AzuraCast endpoints
- **Bundle IDs**: 
  - iOS: `com.gkpradio.mobile`
  - Android: `com.gkpradio.mobile`

## Quick Start

1. Click the **Run** button to start the Expo Dev Server
2. Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
3. Scan the QR code shown in the console
4. App loads immediately for real-time testing

**For detailed setup instructions from scratch**, see `mobile/SETUP.md`

## Environment Configuration

Required environment variables (set in Replit Secrets):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
```

## Database Setup

1. Go to your Supabase dashboard → SQL Editor
2. Run the SQL schema from `supabase_schema.sql`
3. Tables, RLS policies, and triggers will be created automatically
4. Initial data can be added via Supabase dashboard or API

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
│   ├── screens/           # All app screens
│   │   ├── HomeScreen.tsx           # Stats & featured content
│   │   ├── LiveScreen.tsx           # Live radio with now-playing
│   │   ├── CommunityScreen.tsx      # Prayers & testimonies
│   │   ├── PodcastsScreen.tsx       # Podcast library
│   │   ├── VideoScreen.tsx          # Video library
│   │   └── auth/                    # Login & signup screens
│   ├── components/        # Reusable components
│   │   └── AudioPlayer.tsx          # Live streaming player
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx          # Authentication state
│   ├── lib/               # External integrations
│   │   ├── supabase.ts              # Supabase client
│   │   └── azuracast.ts             # AzuraCast API
│   └── types/             # TypeScript definitions
│       └── database.types.ts        # Supabase schema types
├── assets/                # App icons & images
├── App.tsx                # Main entry with navigation
├── app.json               # Expo configuration
├── eas.json               # Build configuration
├── babel.config.js        # Babel configuration
└── package.json           # Dependencies
```

## Features

### Completed
- ✅ **Authentication**: Email/password login and signup with Supabase
- ✅ **Live Radio**: AzuraCast streaming with now-playing data and album art
- ✅ **Community**: Prayer requests and testimonies with real-time data
- ✅ **Content**: Podcasts and videos from Supabase database
- ✅ **Statistics**: Real-time counts for prayers, testimonies, and content
- ✅ **Error Handling**: User-facing error states with retry functionality
- ✅ **Pull-to-Refresh**: All screens support refresh gestures
- ✅ **Empty States**: Graceful UI for empty data scenarios
- ✅ **Audio Cleanup**: Proper resource management on navigation

### Future Enhancements
- 📋 Add prayer request and testimony submission forms
- 📋 Implement likes and comments functionality
- 📋 Add user profile management
- 📋 Enable push notifications for prayer requests
- 📋 Add offline support and content caching
- 📋 Implement search functionality
- 📋 Add content filtering and categories

## Recent Changes

### Dec 18, 2025 - Database Schema Alignment
- ✅ Fixed critical table name mismatches between app code and Supabase schema
- ✅ Mapped `podcasts` → `episodes` in all queries
- ✅ Mapped `prayer_requests` → `prayercircles` with `is_testimony` filter
- ✅ Mapped `profiles` → `users` in all queries
- ✅ Fixed column reference from `published_at` → `created_at`
- ✅ Updated all 5 screens (HomeScreen, CommunityScreen, PodcastsScreen, VideoScreen, ProfileScreen)
- ✅ Updated AuthContext for user signup
- ✅ Added schema documentation to prevent future mismatches

### Oct 26, 2025 - Code Optimization & Bug Fixes
- ✅ Fixed critical Supabase configuration bug with proper error handling
- ✅ Removed unused dependencies (nativewind, tailwindcss) to reduce bundle size
- ✅ Removed duplicate design-handoff folder and obsolete web files
- ✅ Removed duplicate assets, docs, and schema files from root
- ✅ Cleaned up babel configuration
- ✅ Exported `isSupabaseConfigured` flag for graceful error handling
- ✅ Significantly reduced project size and complexity

### Jan 24, 2025 - Documentation & Setup Guides
- ✅ Created comprehensive design handoff package (4,844 lines)
- ✅ Added complete Expo setup guide for Replit environment
- ✅ Documented all design specs for mobile-to-web consistency
- ✅ Included all screen components and patterns for web team
- ✅ Created color reference, design guide, and implementation roadmap

### Jan 24, 2025 - Supabase Database Integration
- ✅ Created comprehensive database schema with RLS policies
- ✅ Integrated Supabase authentication with secure storage
- ✅ Updated all screens to fetch real data from Supabase
- ✅ Added TypeScript types for all database tables
- ✅ Implemented error handling with user-facing retry UI
- ✅ Added pull-to-refresh on all data screens
- ✅ Fixed AudioPlayer cleanup bug using useRef

### Jan 23, 2025 - Refactored to Mobile-Only
- ✅ Removed web app files and dependencies
- ✅ Updated project structure to focus on mobile development
- ✅ Simplified build scripts and workflows
- ✅ Updated documentation for mobile-only project

### Oct 23, 2025 - Mobile App Development & AzuraCast Integration
- ✅ Created full React Native + Expo mobile app
- ✅ Implemented all 5 screens with React Native
- ✅ Integrated AzuraCast for live radio streaming
- ✅ Set up functional audio player with Expo AV
- ✅ Configured React Navigation with bottom tabs
- ✅ Prepared app.json for App Store and Google Play
- ✅ Set up EAS Build for production
- ✅ Expo Dev Server running with QR code testing

## Development Notes

### Code Conventions
- **Component Pattern**: Functional components with hooks
- **State Management**: React Context for global state (auth)
- **Error Handling**: Try-catch with user-facing error states
- **Loading States**: ActivityIndicator for async operations
- **Type Safety**: Full TypeScript coverage with Supabase types
- **Styling**: StyleSheet API (no inline styles)

### Performance Considerations
- Database queries use proper indexing (defined in schema)
- Count queries use `{ count: 'exact', head: true }` for efficiency
- Images use URI caching
- Audio cleanup prevents memory leaks
- Pull-to-refresh prevents redundant queries during loading

### Security
- RLS policies protect all user-generated content
- Authentication tokens stored securely in AsyncStorage
- API keys managed via environment variables
- No secrets committed to repository
