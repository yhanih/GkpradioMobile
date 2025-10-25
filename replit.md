# GKP Radio - Faith-Based Digital Community Platform

## Overview
GKP Radio is a faith-based digital community platform offering live audio streaming, podcasts, video content, and interactive discussions. It aims to serve as both a radio station and a digital town square, fostering a vibrant online faith community through personalized content and deep user engagement.

The platform consists of two applications:
1. **Web Application** (root directory) - Full-featured web platform
2. **Mobile Application** (`/mobile` directory) - Native iOS and Android app built with Expo

## User Preferences
- Modern, faith-based design with warm and inviting user experience
- Mobile-first responsive design
- Community-focused features with discussion capabilities
- Clean, minimal design with spiritual elements

## System Architecture
The platform is built on React with TypeScript, Wouter for routing, TanStack Query for state management, and Tailwind CSS with shadcn/ui components for the frontend. The backend is an Express.js server fully integrated with Supabase.

Key architectural decisions and features include:
- **Full Supabase Integration**: 100% migration to Supabase for all backend services, including database, authentication, real-time features, and storage. All Drizzle ORM and legacy systems have been removed.
- **Data Management**: Supabase Data Service Layer provides CRUD operations for all entities. Custom React hooks (`useSupabase.ts`) integrate with React Query for efficient data fetching and state management.
- **Real-time Capabilities**: Supabase Realtime is used for notifications, user presence tracking, and live updates for community discussions and comments.
- **Secure Storage**: Supabase Storage handles all media files (avatars, episodes, videos, thumbnails) with Row Level Security (RLS) ensuring user-specific upload folders and access control.
- **Authentication**: Pure Supabase Auth manages all user authentication processes.
- **Security**: Strict emphasis on Row Level Security (RLS) policies for all tables and user isolation to ensure users can only modify their own content. Admin operations are planned for secure Edge Functions.
- **UI/UX**: Focus on a modern, faith-based aesthetic with a clean and minimal design, optimized for mobile-first responsiveness.

## Mobile App (October 2025)
The mobile app is a complete native implementation in the `/mobile` directory using:
- **Framework**: Expo with React Native
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Shared Supabase backend with web app
- **Streaming**: Shared AzuraCast radio integration

### Mobile App Structure
- **Authentication**: Login/Signup screens with Supabase Auth
- **Tab Navigation**: 
  - Home (stats, featured content)
  - Live (AzuraCast radio with schedule)
  - Community (prayers & testimonies)
  - Podcasts
  - Videos
- **Error Handling**: All screens include visible error states with retry functionality
- **Configuration**: Environment-driven (EXPO_PUBLIC_* variables in .env)

### Mobile App Status (October 24, 2025)
✅ **Completed:**
- Complete Expo project initialization with TypeScript
- All navigation and tab screens implemented
- Supabase integration (reuses web app database)
- AzuraCast integration with environment configuration
- Authentication flows (Login/Signup)
- Error handling across all screens
- Pull-to-refresh functionality
- **Persistent audio player with background playback**
  - Mini player visible across all tabs
  - Real-time now playing updates
  - Synchronized play/pause controls
  - Proper memory management and cleanup
  - Background audio session support

🔲 **Pending:**
- EAS Build configuration for App Store/Play Store
- App icons, splash screens, and store assets

## External Dependencies
- **Audio Streaming**: AzuraCast (Base URL: http://74.208.102.89:8080, Station ID configurable via env)
- **Video Streaming**: Owncast (VPS-based video broadcasting server)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Web Framework**: React with TypeScript
- **Mobile Framework**: Expo (React Native)
- **Styling**: Tailwind CSS (web), NativeWind (mobile)
- **UI Components**: shadcn/ui (web)