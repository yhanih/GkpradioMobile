# Achieving Low-Latency Streaming with Owncast

## Current Latency Issue
You're experiencing high delay because HLS (HTTP Live Streaming) has inherent latency due to:
- Segment-based delivery (typically 2-10 second chunks)
- Buffering requirements for smooth playback
- HTTP protocol overhead

## Immediate Solutions

### 1. Configure Owncast for Lower Latency
SSH into your VPS and edit the Owncast configuration:

```bash
ssh root@74.208.102.89
cd /path/to/owncast
```

Edit your `config.yaml` or use Owncast admin panel:

```yaml
videoSettings:
  segmentLengthSeconds: 2  # Reduce from default 5 seconds
  numberOfPlaylistItems: 3  # Fewer segments in playlist
  
streamingSettings:
  lowLatency: true
  keyFrameInterval: 2  # Match segment length
```

### 2. OBS Settings for Lower Latency
In OBS Studio:
- **Settings → Output → Streaming**
  - Keyframe Interval: 2 seconds (match Owncast segment length)
  - CPU Usage Preset: veryfast or superfast
  - Tune: zerolatency
  
- **Settings → Advanced**
  - Network: Enable "Dynamically change bitrate" for stability

### 3. Alternative: WebRTC Streaming (Sub-second latency)
For true real-time streaming like Twitch, consider:

**Option A: MediaMTX Server** (Recommended)
- Install MediaMTX on your VPS alongside Owncast
- Stream RTMP from OBS → MediaMTX → WebRTC to viewers
- Achieves <1 second latency

**Option B: Janus WebRTC Gateway**
- More complex setup but professional-grade
- Used by major streaming platforms

### 4. Quick Test: Direct RTMP Playback
For testing ultra-low latency, viewers can use VLC:
```
vlc rtmp://74.208.102.89:1935/live/gkpAdmin2025@
```
This bypasses HLS entirely (1-2 second delay).

## Expected Latency by Method
- **Current HLS Setup**: 10-30 seconds
- **Optimized HLS (2s segments)**: 6-10 seconds  
- **WebRTC**: 0.5-2 seconds
- **Direct RTMP (VLC)**: 1-3 seconds

## Recommendation
For a Twitch-like experience with <2 second latency, you need WebRTC. Would you like me to:
1. Help configure your Owncast for minimum HLS latency (6-10s)?
2. Set up a WebRTC solution on your VPS for true real-time streaming?