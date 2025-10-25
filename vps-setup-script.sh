#!/bin/bash

# GKP Radio - Owncast VPS Setup Script
# Run this script on your VPS server

echo "🎥 GKP Radio - Owncast VPS Setup"
echo "=================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please don't run this script as root"
    exit 1
fi

# Create directory for Owncast
echo "📁 Creating Owncast directory..."
mkdir -p ~/owncast
cd ~/owncast

# Download latest Owncast
echo "⬇️  Downloading Owncast..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/owncast/owncast/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
echo "📦 Latest version: $LATEST_VERSION"

# Download for Linux 64-bit
wget -q "https://github.com/owncast/owncast/releases/download/$LATEST_VERSION/owncast-${LATEST_VERSION#v}-linux-64bit.zip"

# Extract and clean up
echo "📦 Extracting Owncast..."
unzip -q "owncast-${LATEST_VERSION#v}-linux-64bit.zip"
rm "owncast-${LATEST_VERSION#v}-linux-64bit.zip"
chmod +x owncast

# Create systemd service file
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/owncast.service > /dev/null <<EOF
[Unit]
Description=Owncast Streaming Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/owncast
ExecStart=$HOME/owncast/owncast
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 8080/tcp comment "Owncast Web"
sudo ufw allow 1935/tcp comment "Owncast RTMP"

# Enable and start service
echo "🚀 Starting Owncast service..."
sudo systemctl daemon-reload
sudo systemctl enable owncast
sudo systemctl start owncast

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet owncast; then
    echo "✅ Owncast service is running!"
else
    echo "❌ Owncast service failed to start"
    sudo systemctl status owncast
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🌐 Owncast is now running at:"
echo "   Public URL: http://$SERVER_IP:8080"
echo "   Admin Panel: http://$SERVER_IP:8080/admin"
echo ""
echo "🔑 Default admin credentials:"
echo "   Username: admin"
echo "   Password: abc123"
echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "🎥 OBS Studio Settings:"
echo "   Service: Custom"
echo "   Server: rtmp://$SERVER_IP:1935/live"
echo "   Stream Key: (set in admin panel)"
echo ""
echo "🔧 Replit Environment Variables:"
echo "   VITE_OWNCAST_SERVER_URL=http://$SERVER_IP:8080"
echo "   VITE_OWNCAST_RTMP_URL=rtmp://$SERVER_IP:1935/live"
echo ""
echo "📋 Next Steps:"
echo "1. Open admin panel and change password"
echo "2. Configure stream settings"
echo "3. Set environment variables in Replit"
echo "4. Configure OBS Studio"
echo "5. Start streaming!"
echo ""
echo "🔍 Useful Commands:"
echo "   Check status: sudo systemctl status owncast"
echo "   View logs: sudo journalctl -u owncast -f"
echo "   Restart: sudo systemctl restart owncast"