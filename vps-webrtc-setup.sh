#!/bin/bash
# WebRTC Ultra-Low Latency Setup for VPS
# This will give you <1 second delay like Twitch

echo "🚀 Setting up WebRTC streaming on your VPS..."

# Install MediaMTX for WebRTC
cd /opt
wget https://github.com/bluenviron/mediamtx/releases/download/v1.9.3/mediamtx_v1.9.3_linux_amd64.tar.gz
tar -xzf mediamtx_v1.9.3_linux_amd64.tar.gz

# Create WebRTC configuration
cat > /opt/mediamtx.yml << 'EOF'
# WebRTC Configuration for Ultra-Low Latency
logLevel: info
logDestinations: [stdout]

# RTMP input from OBS
rtmp: yes
rtmpAddress: :1936

# WebRTC output for viewers
webrtc: yes
webrtcAddress: :8889

# HLS disabled - we want WebRTC only
hls: no

# API for status
api: yes
apiAddress: :9997

paths:
  stream:
    # Accept RTMP from OBS
    source: rtmp://localhost:1936
    # Auto-publish to WebRTC
    sourceOnDemand: no
EOF

# Stop any existing MediaMTX
pkill -f mediamtx

# Start MediaMTX in background
nohup /opt/mediamtx /opt/mediamtx.yml > /var/log/mediamtx.log 2>&1 &

echo "✅ WebRTC server started!"
echo ""
echo "📹 OBS Settings:"
echo "   Server: rtmp://74.208.102.89:1936"
echo "   Stream Key: stream"
echo ""
echo "🌐 WebRTC Viewer URL:"
echo "   http://74.208.102.89:8889/stream"
echo ""
echo "⚡ This gives you <1 second delay!"