# GKP Radio Mobile App

## Overview
GKP Radio is a native iOS and Android mobile application built with React Native and Expo. Its primary purpose is to provide live radio streaming, foster community engagement through features like prayer circles and testimonies, and offer on-demand content such as podcasts (episodes) and videos. The application is production-ready for deployment to the Apple App Store and Google Play Store, aiming to reach a broad audience with its faith-based content and interactive community features.

## User Preferences
I prefer simple language.
I like functional programming.
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The application features a polished, Apple Design Award-quality UI, with full dark mode support implemented via `ThemeContext`. It uses a consistent 24px grid system for spacing and dynamic safe area insets for proper layout on all devices. Key UI components include `AnimatedPressable`, `SkeletonLoader`, `EmptyState`, `ErrorState`, `MiniPlayer`, `NotificationBadge`, `SearchBar`, and `ProfileAvatar`. An onboarding flow guides first-time users, and micro-animations with haptic feedback enhance interactivity.

### Technical Implementations
The app is built with **React Native** and **Expo SDK 54** for cross-platform compatibility. Navigation is managed by **React Navigation 7** with a bottom tab navigator. **Expo AV** handles audio streaming, supporting background playback. State management primarily uses **React Context** for authentication and audio playback. **TypeScript** ensures type safety across the codebase.

### Feature Specifications
- **Authentication**: Email/password login and signup via Supabase.
- **Live Radio**: Integrates with AzuraCast for real-time audio streaming and "now playing" metadata.
- **Community**: Features prayer circles and testimonies, supporting real-time data updates.
- **Content Library**: Provides on-demand access to "episodes" (podcasts) and videos, fetched from Supabase.
- **User Interface**: Includes a persistent mini-player for audio control, comprehensive error handling, loading states, pull-to-refresh functionality, and graceful empty states.
- **Dark Mode**: Full dark theme support with user preferences persisted via `AsyncStorage`.
- **Onboarding**: A multi-slide animated walkthrough for new users.

### System Design Choices
- **Code Conventions**: Functional components with hooks, React Context for global state, try-catch for error handling, `ActivityIndicator` for loading, full TypeScript coverage, and `StyleSheet API` for styling.
- **Performance**: Database queries are optimized with indexing, count queries use efficient `exact` and `head` parameters, images utilize URI caching, and audio resources are properly cleaned up to prevent memory leaks.
- **Security**: Supabase Row Level Security (RLS) protects user data, authentication tokens are stored securely in `AsyncStorage`, and API keys are managed through environment variables.
- **Project Structure**: Organized into `src` for screens, components, contexts, and libraries, with separate folders for assets and configuration files.

## External Dependencies

- **Supabase**: Used for backend services including PostgreSQL database with Row Level Security (RLS), email/password authentication, and real-time data synchronization.
  - **Critical Table Names**: `episodes`, `videos`, `prayercircles`, `users`, `communitycomments`, `threadlikes`, `threadreactions`, `commentreactions`.
- **AzuraCast**: Integrated for live radio streaming, providing real-time "now playing" data (song, artist, album art) and listener statistics. The server is located at `http://74.208.102.89:8080`.
- **Expo SDK**: Core framework for building the React Native application, including modules like `expo-av` for audio playback.
- **React Navigation**: Handles in-app navigation and routing.
- **AsyncStorage**: Used for client-side persistent storage of user preferences and session data.
- **EAS CLI**: Utilized for building and deploying the application to App Store and Google Play.