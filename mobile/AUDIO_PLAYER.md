# Audio Player Documentation

## Overview
The mobile app includes a persistent audio player that allows users to listen to live radio while navigating between different tabs. The player uses the AzuraCast streaming service configured via environment variables.

## Architecture

### AudioPlayerContext
Located in `/mobile/contexts/AudioPlayerContext.tsx`, this context manages the global audio player state including:
- Playing/paused state
- Loading state
- Now playing metadata (fetched from AzuraCast)
- Play, pause, and toggle functions

The context uses `expo-av` for audio playback and is configured to:
- Play in silent mode on iOS
- Stay active in background
- Duck audio on Android (lower volume for other apps)

### MiniPlayer Component
Located in `/mobile/components/MiniPlayer.tsx`, this component displays:
- Live indicator (red dot + "LIVE" label)
- Current song/show information
- Play/pause button with loading state
- Gradient background matching app theme

The mini player is positioned at the bottom of the screen, above the tab bar, and persists across all tabs.

## Integration

### Root Layout
The `AudioPlayerProvider` wraps the entire app in `/mobile/app/_layout.tsx`, making the audio player state available to all screens.

### Tab Layout
The `MiniPlayer` component is rendered in `/mobile/app/(tabs)/_layout.tsx`, positioned above the tab bar to remain visible on all tabs.

### Live Screen
The Live screen (`/mobile/app/(tabs)/live.tsx`) connects to the audio player context, allowing the "Listen Live" button to control playback synchronized with the mini player.

## Usage

### For Users
1. Tap the play button on the Live screen OR on the mini player
2. Audio will begin streaming from the configured AzuraCast station
3. Navigate between tabs - the audio continues playing
4. Tap pause on the mini player to stop playback
5. Now playing information updates every 15 seconds

### For Developers

#### Using the Audio Player Hook
```tsx
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

function MyComponent() {
  const { 
    isPlaying,      // boolean - current playback state
    isLoading,      // boolean - buffering/loading state
    nowPlaying,     // NowPlayingData - current track info
    play,           // () => Promise<void>
    pause,          // () => Promise<void>
    togglePlayPause // () => Promise<void>
  } = useAudioPlayer();
  
  return (
    <button onClick={togglePlayPause}>
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
```

#### Now Playing Data Structure
```typescript
interface NowPlayingData {
  station: {
    name: string;
    description?: string;
  };
  now_playing: {
    song: {
      title: string;
      artist: string;
    } | null;
    playlist?: string;
  };
  listeners: {
    current: number;
  };
}
```

## Configuration

The audio player uses the same AzuraCast configuration as the web app:

```env
EXPO_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
EXPO_PUBLIC_AZURACAST_STATION_ID=1
```

Stream URL is automatically generated using the `getStreamUrl()` function from `/mobile/lib/azuracast.ts`.

## Features

- ✅ Background audio playback
- ✅ Persistent player across all tabs
- ✅ Real-time now playing updates (15s interval)
- ✅ Loading states and error handling
- ✅ Automatic audio session configuration
- ✅ Synchronized state across all components
- ✅ Beautiful gradient UI with live indicator

## Future Enhancements

Potential improvements:
- Add volume control
- Implement playback controls (skip, rewind)
- Add favorite songs/shows
- Download episodes for offline listening
- Share what's playing on social media
- Sleep timer functionality
