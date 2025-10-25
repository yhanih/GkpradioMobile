# 🎙️ GKP Radio OBS Live Streaming Setup
## Complete Guide: Stream from Your Laptop to Website

### 🎯 **Goal**: Stream your voice and video live from your Windows laptop directly to your GKP Radio website

---

## 🚀 **Quick Start - YouTube Live (5 Minutes)**

### **Step 1: Setup YouTube Live Stream**
1. **Go to YouTube Studio** → [studio.youtube.com](https://studio.youtube.com)
2. **Click "Create"** → **"Go Live"**
3. **Choose "Webcam" or "Streaming software"**
4. **Copy these important details:**
   - **Stream URL**: `rtmp://a.rtmp.youtube.com/live2/`
   - **Stream Key**: (copy the key shown)

### **Step 2: Download & Setup OBS Studio**
1. **Download OBS**: [obsproject.com](https://obsproject.com)
2. **Install and open OBS Studio**
3. **First Time Setup Wizard**: 
   - Choose "Optimize for streaming"
   - Select your microphone and webcam

### **Step 3: Configure OBS for YouTube**
1. **Settings** → **Stream**
2. **Service**: YouTube - RTMPS
3. **Server**: Primary YouTube ingest server
4. **Stream Key**: Paste your YouTube stream key
5. **Click "Apply" and "OK"**

### **Step 4: Setup Your Audio**
1. **Sources Panel** → **Add (+)** → **Audio Input Capture**
2. **Name**: "Microphone"
3. **Device**: Select your microphone
4. **Test your audio levels** in the Audio Mixer (speak normally, aim for green bars)

### **Step 5: Start Broadcasting**
1. **Click "Start Streaming" in OBS**
2. **Check YouTube Studio** to verify your stream is live
3. **Your stream URL will be**: `https://youtube.com/watch?v=YOUR_VIDEO_ID`

---

## 🔧 **Method 2: Direct Website Streaming**

### **Option A: Using a Streaming Service**

#### **Twitch Setup:**
1. **Twitch Creator Dashboard** → **Settings** → **Stream**
2. **Copy Stream URL and Key**
3. **OBS Settings** → **Stream** → **Service: Twitch**
4. **Paste your credentials**

#### **Facebook Live:**
1. **Facebook Creator Studio** → **Go Live**
2. **Copy Stream URL and Key**
3. **OBS Settings** → **Stream** → **Service: Facebook Live**

### **Option B: Local RTMP Server (Advanced)**
1. **Install Node Media Server** on your computer
2. **OBS Settings**:
   - **Service**: Custom
   - **Server**: `rtmp://localhost:1935/live`
   - **Stream Key**: `gkp_radio_live`

---

## 🎥 **OBS Scene Setup for Radio Broadcasting**

### **Audio-Only Setup (Voice Broadcasting)**
1. **Add Audio Source**: Microphone
2. **Add Text Source**: "GKP Radio Live"
3. **Add Image Source**: Your logo/background
4. **Audio Settings**:
   - **Sample Rate**: 44.1 kHz
   - **Channels**: Stereo

### **Video + Audio Setup (Face + Voice)**
1. **Add Video Capture**: Your webcam
2. **Add Audio Source**: Your microphone
3. **Add Scene transitions** for professional look
4. **Position your video** (corner overlay or full screen)

---

## 🌐 **Embedding on Your Website**

### **Step 1: Get Your Stream Embed Code**

#### **For YouTube:**
```html
<iframe 
  src="https://youtube.com/embed/YOUR_LIVE_STREAM_ID" 
  frameborder="0" 
  allowfullscreen>
</iframe>
```

#### **For Twitch:**
```html
<iframe 
  src="https://player.twitch.tv/?channel=YOUR_CHANNEL&parent=yourwebsite.com" 
  frameborder="0" 
  allowfullscreen>
</iframe>
```

### **Step 2: I'll Configure Your Website**
I'll update your GKP Radio live page to display your stream using the embed code.

---

## ⚙️ **OBS Settings for Best Quality**

### **Video Settings:**
- **Base Resolution**: 1920x1080
- **Output Resolution**: 1280x720 (for stable streaming)
- **FPS**: 30

### **Audio Settings:**
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo
- **Bitrate**: 128 kbps

### **Streaming Settings:**
- **Video Bitrate**: 2500-4000 kbps
- **Audio Bitrate**: 128 kbps
- **Encoder**: x264 or Hardware (NVENC/AMD)

---

## 🔴 **Going Live Checklist**

### **Before You Stream:**
- [ ] Test your microphone levels
- [ ] Check your internet connection (upload speed > 5 Mbps)
- [ ] Have your stream key ready
- [ ] Test OBS preview before going live

### **During Your Stream:**
- [ ] Monitor audio levels (keep in green/yellow)
- [ ] Watch for dropped frames in OBS
- [ ] Have backup internet connection ready
- [ ] Keep water nearby for your voice

### **After Your Stream:**
- [ ] Stop streaming in OBS
- [ ] Save recording if enabled
- [ ] Check stream analytics
- [ ] Download recording for later use

---

## 🎯 **Your Next Steps:**

1. **Choose your method**: YouTube Live (easiest) or Custom setup
2. **Get your stream credentials** (URL and Key)
3. **Configure OBS** with your settings
4. **Give me your stream URL** so I can embed it on your website
5. **Test everything** before your first live show

---

## 🆘 **Troubleshooting**

### **Common Issues:**
- **No audio**: Check microphone device in OBS
- **Dropped frames**: Lower video bitrate or check internet
- **Stream lag**: Reduce video resolution or bitrate
- **Can't connect**: Verify stream key and URL

### **Audio Issues:**
- **Echo**: Use headphones or reduce microphone gain
- **Background noise**: Add noise suppression filter
- **Low volume**: Increase microphone gain in OBS

---

## 📞 **Ready to Go Live?**

Once you have your **Stream URL and Key**:
1. Send them to me
2. I'll configure your website to show your live stream
3. Test the complete setup
4. Start broadcasting to your global audience!

**Which streaming method would you like to use?** YouTube Live is the fastest way to start today!