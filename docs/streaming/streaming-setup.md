# GKP Radio Live Broadcasting Setup Guide
## Stream from Your Laptop to Website with OBS Studio

### 🎯 Goal: Stream your voice and audio live from your Windows laptop to your GKP Radio website

## Method 1: Simple RTMP Setup (Recommended for Beginners)

### Step 1: Choose Your Streaming Service
**Option A: YouTube Live (Free)**
1. Go to YouTube Studio → Create → Go Live
2. Select "Webcam" or "Streaming software"
3. Copy your **Stream URL** and **Stream Key**

**Option B: Twitch (Free)**
1. Go to Twitch Creator Dashboard → Settings → Stream
2. Copy your **Primary Stream URL** and **Stream Key**

### Step 2: Configure OBS Studio
1. **Download OBS**: [obsproject.com](https://obsproject.com)
2. **Install and open OBS Studio**
3. **Add Audio Source**:
   - Click **Sources** → **Add** → **Audio Input Capture**
   - Name: "Microphone"
   - Device: Select your microphone
   - Adjust levels in **Audio Mixer** (speak normally, aim for green/yellow bars)

### Step 3: Setup Streaming
1. **Settings** → **Stream**
2. **Service**: YouTube or Twitch
3. **Server**: Use the Stream URL from Step 1
4. **Stream Key**: Paste your Stream Key from Step 1
5. **Click Apply and OK**

### Step 4: Start Broadcasting
1. **Start Streaming** button in OBS
2. **Go to your YouTube/Twitch page** to verify it's live
3. **Test audio** by speaking into your microphone

### Step 5: Embed on Your Website
We'll embed your live stream on the /live page of your GKP Radio website.

---

## Method 2: Direct Website Streaming (Advanced)

### Step 1: Setup Local RTMP Server
1. **Download Simple RTMP Server**: [github.com/illuspas/Node-Media-Server](https://github.com/illuspas/Node-Media-Server)
2. **Install Node.js** if you don't have it
3. **Run the server** on your computer

### Step 2: Configure OBS for Local Streaming
1. **Settings** → **Stream**
2. **Service**: Custom
3. **Server**: `rtmp://localhost:1935/live`
4. **Stream Key**: `gkp_radio_live`

### Step 3: Forward Stream to Website
I'll configure your website to receive the stream from your local server.

---

## Method 3: Professional Broadcasting with AzuraCast

### Step 1: Setup AzuraCast Server
1. **Get a VPS server** (DigitalOcean, Vultr, etc.)
2. **Install AzuraCast** using their installer
3. **Create your radio station**

### Step 2: Configure OBS for AzuraCast
1. **Settings** → **Output** → **Advanced**
2. **Recording Tab**:
   - **Type**: Custom Output (FFmpeg)
   - **FFmpeg Output Type**: Output to URL
   - **File path or URL**: `icecast://username:password@your-server:8000/live`
   - **Container Format**: mp3
   - **Video Encoder**: Disable encoder (audio only)

### Step 3: Connect Website to AzuraCast
I'll update your website configuration to play from your AzuraCast server.

---

## 🚀 Quick Start (YouTube Method)

### 5-Minute Setup:
1. **YouTube Studio** → Go Live → Copy Stream URL & Key
2. **OBS Settings** → Stream → Paste URL & Key
3. **Add your microphone** in Sources
4. **Start Streaming** in OBS
5. **I'll embed your YouTube stream** on your website

### What You'll Have:
- ✅ Live voice broadcasting from your laptop
- ✅ Professional audio controls
- ✅ Stream visible on your GKP Radio website
- ✅ Chat and interaction features
- ✅ Recording for later playback

---

## Next Steps:
1. **Choose your method** (YouTube is easiest to start)
2. **Get your Stream URL and Key**
3. **I'll configure your website** to display your live stream
4. **Test the complete setup**

Which method would you like to start with? YouTube Live is the fastest way to get broadcasting today!