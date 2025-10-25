# Final OBS Studio Setup for Bob's VPS Streaming

## 🎯 Complete Configuration

### VPS Details
- **IP Address**: 74.208.102.89
- **RTMP Port**: 1935
- **Web Port**: 8080
- **Stream Key**: gkpAdmin2025@

## 📺 OBS Studio Configuration

### 1. Open OBS Studio Settings
- Click **File** → **Settings**
- Go to **Stream** tab

### 2. Stream Settings
```
Service: Custom
Server: rtmp://74.208.102.89:1935/live
Stream Key: gkpAdmin2025@
```

### 3. Output Settings
- Go to **Output** tab
- Set **Output Mode**: Simple
- **Video Bitrate**: 2500 Kbps
- **Audio Bitrate**: 128 Kbps

### 4. Video Settings
- Go to **Video** tab
- **Base Resolution**: 1920x1080
- **Output Resolution**: 1280x720
- **FPS**: 30

### 5. Audio Settings
- Go to **Audio** tab
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo

## 🧪 Testing Connection

### From Windows PowerShell:
```powershell
Test-NetConnection 74.208.102.89 -Port 1935
```

Expected result: `TcpTestSucceeded: True`

### From Windows Command Prompt:
```cmd
telnet 74.208.102.89 1935
```

If successful, you should see a connection (press Ctrl+C to exit).

## 🎬 Streaming Process

1. **Start your scenes** in OBS Studio
2. **Click "Start Streaming"**
3. **Watch for connection** in OBS status bar
4. **View stream** at: http://74.208.102.89:8080
5. **Admin panel**: http://74.208.102.89:8080/admin

## 🚨 Troubleshooting

### If OBS says "Failed to connect to server":

1. **Check VPS firewall** (run on VPS):
   ```bash
   sudo ufw status
   sudo ufw allow 1935/tcp
   ```

2. **Check Owncast is running** (run on VPS):
   ```bash
   sudo systemctl status owncast
   sudo lsof -i -P -n | grep 1935
   ```

3. **Restart Owncast** (run on VPS):
   ```bash
   sudo systemctl restart owncast
   ```

4. **Check stream key** - Must be exactly: `gkpAdmin2025@`

### If stream connects but no video:

1. **Check camera source** in OBS
2. **Verify video settings** match above specifications
3. **Check Owncast admin panel** for incoming stream

## 📱 Mobile Compatibility

The Owncast stream at http://74.208.102.89:8080 is automatically mobile-compatible and will work on:
- iPhone Safari
- Android Chrome
- Desktop browsers
- Smart TVs with web browsers

## 🔒 Security Notes

- Change the admin password in Owncast admin panel
- Consider using HTTPS with SSL certificate for production
- Stream key `gkpAdmin2025@` should be kept private

## ✅ Success Checklist

- [ ] VPS firewall allows ports 1935 and 8080
- [ ] Owncast service is running and configured
- [ ] OBS Studio settings match exactly
- [ ] PowerShell test connection succeeds
- [ ] Stream appears at http://74.208.102.89:8080
- [ ] Replit frontend embeds the stream correctly