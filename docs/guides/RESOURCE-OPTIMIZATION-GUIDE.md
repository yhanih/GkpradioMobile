# Resource Optimization Guide for GKP Radio Streaming

## Problem Analysis
Your video stream is experiencing severe interruptions because both AzuraCast (audio) and Owncast (video) are competing for server resources on the same VPS.

## Implemented Solutions

### 1. **Video Player Optimization**
- **Increased Buffer Size**: 60-180 seconds instead of 1.5-3 seconds
- **Disabled Low Latency Mode**: Prioritizes stability over real-time
- **Adaptive Quality**: Automatically reduces quality when buffering
- **Error Recovery**: Automatic reconnection on network errors

### 2. **Server-Side Caching**
- Video segments cached for 10 seconds
- Reduces repeated requests to VPS
- Automatic cache cleanup

### 3. **Resource Monitoring**
- Real-time server load detection
- Stream health indicator in player
- Automatic quality adjustment based on server load

## Quick Fixes You Can Apply

### Option 1: Time-Based Separation
```bash
# Schedule AzuraCast to reduce quality during video streaming hours
# Add to your VPS crontab:
# During video streaming (reduce audio bitrate)
0 19 * * * curl -X POST http://localhost/api/station/1/restart
# After video streaming (restore normal quality)
0 22 * * * curl -X POST http://localhost/api/station/1/restart
```

### Option 2: Quality Reduction
1. **Reduce Owncast Video Quality**:
   - Log into Owncast admin
   - Go to Video Configuration
   - Set video bitrate to 1000-1500 kbps (instead of 2500+)
   - Set framerate to 24fps (instead of 30fps)

2. **Reduce AzuraCast Audio Quality**:
   - Set audio bitrate to 96kbps during video streams
   - Use MP3 instead of AAC for lower CPU usage

### Option 3: Process Priority (Advanced)
```bash
# SSH into your VPS and run:
# Give Owncast higher priority
sudo renice -n -5 -p $(pgrep owncast)
# Lower AzuraCast priority during video
sudo renice -n 5 -p $(pgrep liquidsoap)
```

## Long-Term Solutions

### 1. **Upgrade VPS Resources**
- Minimum recommended: 4 CPU cores, 8GB RAM
- Current load suggests you need 2x current resources

### 2. **Separate Services**
- Move AzuraCast to a separate $5/month VPS
- Keep Owncast on main server for video
- Total cost: ~$10-15/month for smooth streaming

### 3. **Use CDN for Video**
- Services like Cloudflare Stream or BunnyCDN
- Offloads bandwidth from your VPS
- Costs ~$1 per 1000 minutes viewed

## Emergency Mode
If streams are critically failing:
1. **Disable AzuraCast temporarily**: `sudo systemctl stop azuracast`
2. **Stream video only**: This frees all resources for Owncast
3. **Re-enable after stream**: `sudo systemctl start azuracast`

## Monitoring Commands
```bash
# Check CPU usage
top -b -n 1 | head -20

# Check memory
free -h

# Check Owncast process
ps aux | grep owncast

# Check AzuraCast processes
docker stats
```

The optimizations I've implemented should significantly reduce interruptions, but the fundamental issue is resource competition. Consider the long-term solutions for a professional streaming experience.