#!/bin/bash

# VPS Owncast Configuration Fix Script
# Run this on your Ubuntu VPS (74.208.102.89) as root or with sudo

echo "🎥 Fixing Owncast VPS Configuration for Bob's Streaming Setup"
echo "============================================================="

# Check if Owncast is installed
if [ ! -f "/opt/owncast/owncast/owncast" ]; then
    echo "❌ Owncast not found at /opt/owncast/owncast/owncast"
    echo "Run the installer first: curl -s https://owncast.online/install.sh | bash"
    exit 1
fi

echo "✅ Owncast binary found"

# Stop Owncast service
echo "🛑 Stopping Owncast service..."
sudo systemctl stop owncast

# Create or update config.yaml
echo "📝 Creating Owncast configuration..."
sudo tee /opt/owncast/owncast/config.yaml > /dev/null <<EOF
rtmp:
  enabled: true
  port: 1935
web:
  port: 8080
  hostname: "0.0.0.0"
ffmpegPath: /usr/bin/ffmpeg
streamKey: "gkpAdmin2025@"
instanceDetails:
  name: "GKP Radio Live"
  title: "GKP Radio - Faith-Based Digital Community"
  summary: "Live streaming from GKP Radio - Join our faith community"
  welcomeMessage: "Welcome to GKP Radio Live! Join our faith-based community."
  tags:
    - "faith"
    - "christian"
    - "radio"
    - "community"
videoSettings:
  videoQualityVariants:
    - name: "720p"
      videoBitrate: 2500
      audioBitrate: 128
      scaledWidth: 1280
      scaledHeight: 720
      framerate: 30
EOF

echo "✅ Configuration file created"

# Set proper ownership
sudo chown -R owncast:owncast /opt/owncast/owncast/
echo "✅ File ownership set"

# Configure UFW firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 8080/tcp comment "Owncast Web"
sudo ufw allow 1935/tcp comment "Owncast RTMP"
sudo ufw reload
echo "✅ Firewall configured"

# Start Owncast service
echo "🚀 Starting Owncast service..."
sudo systemctl start owncast
sudo systemctl enable owncast

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet owncast; then
    echo "✅ Owncast service is running!"
else
    echo "❌ Owncast service failed to start"
    echo "📋 Service logs:"
    sudo journalctl -u owncast --no-pager -n 20
    exit 1
fi

# Check if ports are listening
echo "🔍 Checking port status..."
if sudo lsof -i -P -n | grep LISTEN | grep :1935 > /dev/null; then
    echo "✅ RTMP port 1935 is listening"
else
    echo "❌ RTMP port 1935 is not listening"
fi

if sudo lsof -i -P -n | grep LISTEN | grep :8080 > /dev/null; then
    echo "✅ Web port 8080 is listening"
else
    echo "❌ Web port 8080 is not listening"
fi

# Get server IP
SERVER_IP="74.208.102.89"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🌐 Owncast URLs:"
echo "   Public Stream: http://$SERVER_IP:8080"
echo "   Admin Panel: http://$SERVER_IP:8080/admin"
echo ""
echo "🎥 OBS Studio Settings:"
echo "   Service: Custom"
echo "   Server: rtmp://$SERVER_IP:1935/live"
echo "   Stream Key: gkpAdmin2025@"
echo ""
echo "🔧 Test from Windows PowerShell:"
echo "   Test-NetConnection $SERVER_IP -Port 1935"
echo ""
echo "🔍 Useful Commands:"
echo "   sudo systemctl status owncast"
echo "   sudo journalctl -u owncast -f"
echo "   sudo lsof -i -P -n | grep LISTEN"
echo ""
echo "📺 Your stream will be available at: http://$SERVER_IP:8080"