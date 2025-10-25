# Quick Fix: Windows Streaming Setup

## Problem
OBS is saving to C:\Users\Loghiny\Videos\stream.m3u8 but our server runs in a different environment.

## Solution Options:

### Option 1: Use RTMP Instead (Easier)
1. In OBS, go back to Settings > Output
2. Click the "Streaming" tab (instead of Recording)
3. Set up:
   - Service: Custom
   - Server: rtmp://localhost:1935/live  
   - Stream Key: gkp_radio_live
4. Click "Start Streaming" instead of "Start Recording"

### Option 2: Create Shared Folder (Advanced)
1. Create a folder that both OBS and the server can access
2. Update the OBS path to point to the server's hls folder

## Next Steps
Let's try Option 1 (RTMP) first since it's simpler!