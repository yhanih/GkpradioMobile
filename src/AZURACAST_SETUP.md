# Azuracast Stream Setup Guide

## Current Status

🎵 **Demo Stream Active**: The app is currently using a demo stream (SomaFM Groove Salad) for testing purposes.

## Quick Setup

To connect your GKP Radio app to your Azuracast stream, follow these steps:

### 1. Get Your Azuracast Stream URL

Your Azuracast stream URL typically follows this format:
```
https://your-domain.com/radio/8000/radio.mp3
```

Or it might be:
```
https://your-domain.com/listen/your-station-name/radio.mp3
```

To find your exact stream URL:
1. Log in to your Azuracast admin panel
2. Go to your station settings
3. Look for "Mount Points" or "Public Pages"
4. Copy the stream URL (usually ends with `.mp3` or `.ogg`)
5. **Important**: Make sure to copy the FULL URL including `https://`

### 2. Update the App Configuration

Open `/utils/AudioContext.tsx` and find these lines (around line 30-35):

```typescript
// For testing, using a demo stream (SomaFM):
const AZURACAST_STREAM_URL = 'https://ice1.somafm.com/groovesalad-128-mp3';

// When you have your Azuracast URL, replace above with:
// const AZURACAST_STREAM_URL = 'https://your-azuracast-domain.com/radio/8000/radio.mp3';
```

Replace it with your actual Azuracast stream URL:

```typescript
const AZURACAST_STREAM_URL = 'https://your-actual-domain.com/radio/8000/radio.mp3';
```

### 3. Test the Connection

1. Go to the Live Radio tab in your app
2. Click the center volume button to start streaming
3. The audio player should appear at the bottom showing "LIVE"
4. You should hear your Azuracast stream

### Optional: Fetch Now Playing Info

To display the currently playing song from Azuracast, you can use the Azuracast API:

```typescript
// Add this to your AudioContext.tsx
const AZURACAST_API_URL = 'https://your-domain.com/api/nowplaying/your-station-id';

// Fetch now playing info every 15 seconds
useEffect(() => {
  const fetchNowPlaying = async () => {
    try {
      const response = await fetch(AZURACAST_API_URL);
      const data = await response.json();
      
      setCurrentTrack({
        title: data.now_playing.song.title,
        artist: data.now_playing.song.artist,
        isLive: true
      });
    } catch (error) {
      console.error('Error fetching now playing:', error);
    }
  };

  const interval = setInterval(fetchNowPlaying, 15000);
  fetchNowPlaying(); // Initial fetch
  
  return () => clearInterval(interval);
}, []);
```

## Features Implemented

✅ **Live Streaming**: Click the volume button on the Live Radio screen to start/stop the stream
✅ **Audio Player**: Persistent audio player at the bottom when stream is active
✅ **Live Indicator**: Red "LIVE" badge shows when streaming
✅ **Play/Pause Controls**: Full control over the stream
✅ **Sticky Navigation**: Bottom nav stays visible while scrolling (like Instagram)

## Troubleshooting

**Stream won't play:**
- Check if your Azuracast stream URL is correct
- Ensure CORS is enabled on your Azuracast server
- Check browser console for errors

**CORS Issues:**
In your Azuracast settings, make sure to allow your app's domain in the CORS settings.

**No Sound:**
- Check if the browser has permission to play audio
- Some browsers require user interaction before playing audio
- Check the volume level in the app

## Additional Resources

- [Azuracast Documentation](https://www.azuracast.com/docs/)
- [Azuracast API Reference](https://www.azuracast.com/api/)
