# OBS Studio Video Streaming Setup for GKP Radio

## Complete Setup Guide for Live Video Broadcasting

### Method 1: HLS Streaming (Recommended for Web)

#### OBS Studio Setup:
1. **Output Settings:**
   - File → Settings → Output
   - Output Mode: **Advanced**
   - Recording Tab:
     - Type: **Custom Output (FFmpeg)**
     - Container Format: **hls**
     - File Path: `/path/to/your/project/hls/stream.m3u8`
     - Video Encoder: **libx264**
     - Audio Encoder: **aac**

2. **Video Settings:**
   - Base Resolution: **1920x1080**
   - Output Resolution: **1280x720** (for better streaming)
   - FPS: **30**

3. **Advanced Settings:**
   - Video Bitrate: **2500 Kbps**
   - Audio Bitrate: **128 Kbps**
   - Keyframe Interval: **2 seconds**

#### Stream URL:
- Your stream will be available at: `http://localhost:5000/hls/stream.m3u8`
- Website will automatically detect and display your live video

### Method 2: RTMP Streaming (Alternative)

#### OBS Studio Setup:
1. **Stream Settings:**
   - Service: **Custom**
   - Server: **rtmp://localhost:1935/live**
   - Stream Key: **gkp_radio_live**

2. **Output Settings:**
   - Output Mode: **Simple**
   - Video Bitrate: **2500 Kbps**
   - Audio Bitrate: **128 Kbps**

### How to Start Broadcasting:

1. **Setup Your Scene in OBS:**
   - Add sources (Camera, Screen Capture, etc.)
   - Add audio sources (Microphone, Desktop Audio)
   - Arrange your layout

2. **Start Broadcasting:**
   - For HLS: Click "Start Recording" (not streaming)
   - For RTMP: Click "Start Streaming"

3. **Verify on Website:**
   - Go to `/live` page
   - Your video should appear automatically
   - Users can see live video with chat

### Technical Requirements:

- **Internet Upload Speed:** Minimum 5 Mbps (10 Mbps recommended)
- **CPU:** Modern multi-core processor
- **RAM:** 8GB minimum (16GB recommended)
- **OBS Version:** Latest version (28.0+)

### Troubleshooting:

1. **No Video Appears:**
   - Check file path in OBS settings
   - Ensure OBS is recording/streaming
   - Verify network connection

2. **Poor Quality:**
   - Reduce video bitrate
   - Lower resolution
   - Check CPU usage

3. **Audio Issues:**
   - Verify audio sources in OBS
   - Check audio bitrate settings
   - Test microphone levels

### Live Features Available:

- ✅ Live video streaming from laptop
- ✅ Real-time chat with viewers
- ✅ Viewer count tracking
- ✅ Stream title and description
- ✅ Mobile-responsive video player
- ✅ Automatic stream detection

Your live video stream will be fully integrated with the GKP Radio platform, allowing viewers to watch, chat, and interact in real-time!