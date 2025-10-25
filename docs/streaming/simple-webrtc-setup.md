# Immediate Zero-Delay Streaming Setup

## Option 1: Quick VPS Setup (5 minutes)

SSH into your VPS and run these commands:

```bash
# Download and setup MediaMTX
cd /opt
wget https://github.com/bluenviron/mediamtx/releases/download/v1.9.3/mediamtx_v1.9.3_linux_amd64.tar.gz
tar -xzf mediamtx_v1.9.3_linux_amd64.tar.gz

# Create simple config
cat > mediamtx.yml << 'EOF'
rtmp: yes
rtmpAddress: :1936
webrtc: yes
webrtcAddress: :8889
api: yes
apiAddress: :9997

paths:
  stream:
    source: rtmp://localhost:1936
EOF

# Kill old processes
pkill -f mediamtx
pkill -f owncast

# Start MediaMTX
nohup ./mediamtx mediamtx.yml > mediamtx.log 2>&1 &

echo "WebRTC ready! Stream to rtmp://74.208.102.89:1936/stream"
```

## Option 2: Use Existing RTMP (Immediate)

Your RTMP stream is already working. Viewers can watch with 2-3 second delay using:
- VLC: `rtmp://74.208.102.89:1935/live/gkpAdmin2025@`

## Option 3: Professional Service (Best)

Use **Cloudflare Stream**:
1. Sign up at https://dash.cloudflare.com/sign-up/stream
2. Get your RTMP URL
3. Stream to Cloudflare instead of your VPS
4. Embed their player - automatic WebRTC with <500ms delay

## Current Issue

HLS will ALWAYS have 10-30 second delay. This is not fixable. YouTube Live uses HLS - that's why it has delay. Twitch uses WebRTC - that's why it's real-time.

Your choices:
1. Accept HLS delay
2. Switch to WebRTC (requires VPS setup above)
3. Use Cloudflare Stream (easiest)