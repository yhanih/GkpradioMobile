# GKP Radio Live Broadcasting Setup Guide
## Complete Real-Time Streaming System

### 🎯 System Architecture:
```
Your Laptop (Mixxx/OBS) → AzuraCast (Icecast) → GKP Radio Website → Listeners
```

## 🚀 Phase 1: AzuraCast Configuration (5 minutes)

### Step 1: Create Streamer Account
1. Log into your AzuraCast admin panel
2. Navigate to **Streamers/DJs** (not Broadcasting section)
3. Click **Add Streamer**
4. Create account:
   - **Streamer Username**: `gkp_live`
   - **Streamer Password**: `[create strong password]`
   - **Display Name**: GKP Radio Live
   - **Comments**: Primary streaming account for Mixxx and OBS

### Step 2: Note Your Connection Details
AzuraCast will display these on the right sidebar:
- **Server**: Your AzuraCast domain/IP
- **Port**: 8000 (Icecast default)
- **Mount Point**: `/live` (or your chosen mount)
- **Username**: `gkp_live` (from Step 1)
- **Password**: `[your password from Step 1]`

### Step 3: Configure Station Mount Points
1. Go to **Stations** → Your Station → **Mount Points**
2. Edit your main mount point (usually `/radio.mp3`):
   - **Enable AutoDJ**: Yes (for fallback music)
   - **Allow Streamers**: Yes
   - **Is Public**: Yes

### Step 4: Test Mount Point Access
- Your stream URL will be: `http://your-azuracast-domain:8000/radio.mp3`
- Test in VLC: Open Network Stream with this URL

## 🎵 Phase 2: Mixxx Configuration (10 minutes)

### Step 1: Download and Install Mixxx
1. Download latest version from [mixxx.org](https://mixxx.org/download/)
2. **Important**: Install LAME MP3 encoder separately:
   - Download from [lame.sourceforge.io](https://lame.sourceforge.io/)
   - Extract `libmp3lame.dll` to Mixxx installation folder

### Step 2: Configure Live Broadcasting
1. Launch Mixxx → **Preferences** → **Live Broadcasting**
2. **Critical Settings**:
   - **Type**: Icecast 2
   - **Host**: `your-azuracast-domain.com` (NO http://, just domain)
   - **Login**: `gkp_live` (your streamer username)
   - **Mount**: `/live`
   - **Port**: `8000`
   - **Password**: `[your streamer password]`
   - **Format**: MP3 (requires LAME encoder)
   - **Bitrate**: 128 kbps
   - **Channels**: Stereo

### Step 3: Test Music Streaming
1. **Load Music**: Add your music library in Mixxx
2. **Enable Broadcasting**: 
   - Go to **Options** → **Enable Live Broadcasting** (or Ctrl+L)
   - Look for "Broadcasting" status in Mixxx interface
3. **Start Playing**: Play any track from your library
4. **Verify**: Check AzuraCast **Streamers/DJs** page for active connection

### Step 4: Troubleshooting Mixxx
- **Connection Failed**: Double-check server domain (no http://)
- **MP3 Error**: Ensure LAME encoder is properly installed
- **No Audio**: Check Mixxx audio output settings

## 🎙️ Phase 3: OBS Studio Configuration (15 minutes)

### Step 1: Install OBS Studio
1. Download latest version from [obsproject.com](https://obsproject.com)
2. Install and complete the auto-configuration wizard

### Step 2: Audio Sources Setup
1. **Sources Panel** → **Add** → **Audio Input Capture**
2. **Create New** → Name: "Microphone"
3. **Device**: Select your microphone
4. **Audio Mixer**: Adjust levels (speak normally, aim for green/yellow)

### Step 3: Configure Recording for Icecast (Key Method)
1. **Settings** → **Output** → **Output Mode: Advanced**
2. **Recording Tab** (NOT Streaming tab):
   - **Type**: Custom Output (FFmpeg)
   - **FFmpeg Output Type**: Output to URL
   - **File path or URL**: `icecast://gkp_live:[password]@your-domain:8000/live`
   - **Container Format**: mp3
   - **Video Encoder**: Disable encoder (audio only)
   - **Audio Encoder**: libmp3lame
   - **Audio Bitrate**: 128

### Step 4: Audio-Only Streaming Setup
**Muxer Settings** (click Show All):
```
content_type=audio/mpeg
genre=Religious
```

### Step 5: Start Live Radio Show
1. **Start Recording** (this streams to Icecast)
2. **NOT** "Start Streaming" - that's for platforms like Twitch
3. **Monitor**: Check AzuraCast for active connection
4. **Test**: Open your stream URL in a browser

### Step 6: Troubleshooting OBS
- **No Connection**: Verify URL format and credentials
- **Audio Issues**: Check audio sample rate (44.1kHz recommended)
- **Encoder Errors**: Install additional FFmpeg codecs if needed

## 🌐 Phase 4: Website Integration (Automated)

### Step 1: Update Audio Player for AzuraCast
Your website audio player will be automatically configured for:
- **Stream URL**: Your AzuraCast stream endpoint
- **Real-time metadata**: Song titles, artist info
- **Live status indicators**: Shows when you're broadcasting live
- **Low latency**: Optimized HTML5 audio for real-time

### Step 2: Connection Status Display
- **"Ready for Broadcast"**: When AutoDJ is playing
- **"GKP Radio Live"**: When you're streaming from Mixxx/OBS
- **"Connecting..."**: During stream transitions
- **Listener count**: Real-time from AzuraCast API

## 🔄 Phase 5: Source Switching System

### Method 1: Manual Switching (Recommended)
1. **For Music (Mixxx)**:
   - Stop OBS recording if active
   - Enable Mixxx live broadcasting
   - Stream switches automatically

2. **For Live Shows (OBS)**:
   - Disable Mixxx live broadcasting
   - Start OBS recording
   - Your voice goes live instantly

### Method 2: AzuraCast Auto-Fallback
- **AutoDJ**: Plays automatically when no live source connected
- **Playlists**: Set up music for between live sessions
- **Seamless**: Listeners never hear silence

## 🎯 Phase 6: Testing Your Complete System

### Full Workflow Test:
1. **Start with AutoDJ**: Default music playing
2. **Go Live with Music**: Enable Mixxx → Music streams live
3. **Switch to Voice**: Stop Mixxx → Start OBS → Voice streams live
4. **Return to Music**: Stop OBS → Enable Mixxx → Music resumes
5. **Back to AutoDJ**: Stop all → AutoDJ resumes

## 🚨 Common Issues & Solutions

### Mixxx Connection Problems:
- Use domain name, not IP address
- No `http://` in server field
- Verify streamer username/password

### OBS Audio Not Working:
- Use "Recording" tab, not "Streaming"
- Set container format to MP3
- Disable video encoder for audio-only

### Website Not Updating:
- Check stream URL in configuration
- Verify AzuraCast API is accessible
- Test direct stream URL in browser

## ✅ Success Checklist:
- [ ] AzuraCast streamer account created
- [ ] Mixxx connects and streams music
- [ ] OBS connects and streams voice
- [ ] Website plays your live audio
- [ ] AutoDJ works as fallback
- [ ] Can switch between sources seamlessly

**Ready to begin Phase 1? Let's configure your AzuraCast server first!**