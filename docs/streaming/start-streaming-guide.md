# 🔴 START LIVE STREAMING NOW - Step by Step

## ✅ Your RTMP Server is ACTIVE!

**Your streaming server is now running and ready to receive your broadcast.**

---

## 📥 **Step 1: Download OBS Studio (5 minutes)**

1. **Go to**: [obsproject.com](https://obsproject.com)
2. **Click "Download OBS Studio"**
3. **Choose "Windows"** 
4. **Install and open OBS Studio**

---

## ⚙️ **Step 2: Configure OBS for Your Website (2 minutes)**

### **In OBS Studio:**

1. **Click "Settings"** (bottom right)
2. **Click "Stream"** (left sidebar)
3. **Configure these exact settings**:

   - **Service**: `Custom`
   - **Server**: `rtmp://localhost:1935/live`
   - **Stream Key**: `gkp_radio_live`

4. **Click "Apply"** then **"OK"**

---

## 🎤 **Step 3: Add Your Microphone (2 minutes)**

### **In the Sources panel (bottom of OBS):**

1. **Click the "+" button**
2. **Select "Audio Input Capture"**
3. **Click "OK"** to create new
4. **Name it**: "My Microphone"
5. **Click "OK"**
6. **Choose your microphone** from the Device dropdown
7. **Click "OK"**

### **Test Your Audio:**
- **Speak into your microphone**
- **Watch the green bars** in the Audio Mixer
- **Adjust the slider** if too loud/quiet

---

## 🚀 **Step 4: GO LIVE! (30 seconds)**

1. **Click "Start Streaming"** (bottom right in OBS)
2. **Your stream goes LIVE immediately**
3. **Check your website**: Go to `/live` page
4. **You should see your live stream!**

---

## 📺 **What Happens When You Go Live:**

✅ **OBS sends your audio** → **Your computer's streaming server**  
✅ **Streaming server** → **Your GKP Radio website**  
✅ **Visitors see your live broadcast** on the `/live` page  
✅ **No YouTube, Twitch, or other platforms needed**

---

## 🎙️ **Broadcasting Tips:**

### **Before Going Live:**
- **Test your microphone levels** (green bars, not red)
- **Close other streaming apps** (YouTube, Spotify, etc.)
- **Use wired internet** if possible (more stable than WiFi)

### **While Live:**
- **Speak clearly** and at consistent volume
- **Monitor the Audio Mixer** in OBS
- **Keep OBS running** the entire time you're broadcasting

### **To Stop Broadcasting:**
- **Click "Stop Streaming"** in OBS
- **Your stream ends immediately**

---

## 🛠️ **Troubleshooting:**

### **"Failed to connect to server":**
- Make sure your website is running (should be on port 5000)
- Check the server URL: `rtmp://localhost:1935/live`
- Verify stream key: `gkp_radio_live`

### **"No audio heard on website":**
- Check microphone is selected in OBS
- Adjust audio levels in Audio Mixer
- Make sure microphone isn't muted

### **"Can't see stream on website":**
- Go to your website `/live` page
- Refresh the page after starting OBS stream
- Check browser console for errors

---

## 📱 **Ready to Start Broadcasting?**

### **Your Setup:**
- ✅ **RTMP Server**: Running on your computer
- ✅ **Website**: Ready to display your stream
- ✅ **OBS Settings**: Copy the settings above

### **Next Steps:**
1. **Download OBS Studio** now
2. **Configure with the settings above**
3. **Add your microphone**
4. **Click "Start Streaming"**
5. **You're broadcasting live to your website!**

---

**Your live stream will appear at: `yourwebsite.com/live`**

**Questions? Just ask and I'll help you troubleshoot any issues!**