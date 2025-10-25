# Owncast VPS Setup Guide for GKP Radio

## VPS Server Setup

### 1. Install Owncast on Your VPS

```bash
# Download Owncast
curl -s https://owncast.online/install.sh | bash

# Or manually:
wget https://github.com/owncast/owncast/releases/download/v0.1.2/owncast-0.1.2-linux-64bit.zip
unzip owncast-0.1.2-linux-64bit.zip
chmod +x owncast
```

### 2. Configure Owncast

```bash
# Start Owncast (first time)
./owncast

# Access admin panel at: http://YOUR-VPS-IP:8080/admin
# Default admin password: abc123 (change this immediately!)
```

### 3. Basic Owncast Configuration

In the admin panel (http://YOUR-VPS-IP:8080/admin):

**Server Settings:**
- Server Name: GKP Radio Live
- Server Summary: Faith-based digital community platform
- Server Welcome Message: Welcome to GKP Radio Live! Join our faith community.

**Stream Settings:**
- Stream Title: GKP Radio Live Stream
- Stream Key: gkp_radio_live (or generate a secure one)
- RTMP Port: 1935 (default)
- Web Port: 8080 (default)

**Video Quality:**
- Video Bitrate: 2000-4000 kbps
- Audio Bitrate: 128 kbps
- Resolution: 1280x720 (720p)

### 4. Firewall Configuration

```bash
# Allow Owncast ports
sudo ufw allow 8080  # Web interface
sudo ufw allow 1935  # RTMP ingest
sudo ufw reload
```

## OBS Studio Configuration

### RTMP Settings for OBS:
- **Service:** Custom
- **Server:** `rtmp://YOUR-VPS-IP:1935/live`
- **Stream Key:** `gkp_radio_live` (or your custom key)

### Video Settings:
- **Output Resolution:** 1280x720
- **FPS:** 30
- **Bitrate:** 2500 kbps

### Audio Settings:
- **Sample Rate:** 44.1 kHz
- **Bitrate:** 128 kbps

## Frontend Integration

### Environment Variables (Add to Replit)

Create a `.env` file or set environment variables:

```bash
VITE_OWNCAST_SERVER_URL=http://YOUR-VPS-IP:8080
VITE_OWNCAST_ADMIN_URL=http://YOUR-VPS-IP:8080/admin
VITE_OWNCAST_RTMP_URL=rtmp://YOUR-VPS-IP:1935/live
```

### Replace YOUR-VPS-IP

In your Replit environment variables, set:
- `VITE_OWNCAST_SERVER_URL=http://123.456.789.123:8080`
- Replace `123.456.789.123` with your actual VPS IP address

## Testing the Setup

### 1. Start Owncast Server
```bash
./owncast
```

### 2. Configure OBS
- Set RTMP server to your VPS IP
- Start streaming from OBS

### 3. View Stream
- Go to `http://YOUR-VPS-IP:8080` to see the live stream
- Your Replit frontend will embed this stream automatically

## Troubleshooting

### Stream Not Connecting:
1. Check VPS firewall allows ports 1935 and 8080
2. Verify OBS RTMP settings match Owncast config
3. Check Owncast logs for connection errors

### Embed Not Loading:
1. Ensure CORS is configured in Owncast
2. Check environment variables in Replit
3. Verify VPS IP address is correct

### Performance Issues:
1. Lower OBS bitrate if stream stutters
2. Check VPS bandwidth and CPU usage
3. Consider upgrading VPS specs for better performance

## Security Notes

- Change default admin password immediately
- Use HTTPS with SSL certificate for production
- Consider using a reverse proxy (nginx) for better security
- Regularly update Owncast to latest version

## Next Steps

1. Replace `YOUR-VPS-IP` with your actual VPS IP address
2. Set up the environment variables in Replit
3. Configure OBS with your VPS RTMP settings
4. Test the complete streaming pipeline