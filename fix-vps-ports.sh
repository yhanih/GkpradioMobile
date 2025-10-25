#!/bin/bash

# Fix VPS Port Configuration Script
# Run this on your VPS to fix the port conflicts

echo "🔧 Fixing GKP Radio port configuration on VPS..."

# Stop the service first
sudo systemctl stop gkpradio

# Check what's using port 8000
echo "📊 Checking what's using port 8000:"
sudo netstat -tlnp | grep :8000 || echo "Port 8000 is free"

# Check what's using port 8080
echo "📊 Checking what's using port 8080:"
sudo netstat -tlnp | grep :8080 || echo "Port 8080 is free"

# Update environment configuration
cd /srv/gkpradio

# Create proper production environment file
echo "📝 Creating production environment configuration..."
cat > .env.production << 'EOF'
# Core Application Settings
NODE_ENV=production
PORT=3001

# RTMP and Streaming Configuration  
RTMP_HTTP_PORT=8001

# Database Configuration
DATABASE_URL=postgresql://gkp_user:secure_password_2024@localhost:5432/gkp_radio

# Security Keys (Auto-generated)
SESSION_SECRET=gkp_radio_session_secret_2024_very_secure_random_string
JWT_SECRET=gkp_radio_jwt_secret_2024_another_very_secure_random_string

# AzuraCast Integration
AZURACAST_BASE_URL=http://74.208.102.89:8080
AZURACAST_API_KEY=

# Disable anti-spam for production (as requested)
ANTI_SPAM_ENABLED=false
VITE_ANTI_SPAM_ENABLED=false
EOF

# Set proper permissions
chmod 600 .env.production

# Rebuild the application with new environment
echo "🔨 Rebuilding application with new port configuration..."
npm run build

# Check if ports are available
echo "🔍 Checking required ports availability:"
echo "Port 3001 (main app):" 
sudo netstat -tlnp | grep :3001 || echo "  ✅ Available"
echo "Port 8001 (RTMP HTTP):"
sudo netstat -tlnp | grep :8001 || echo "  ✅ Available" 
echo "Port 1935 (RTMP):"
sudo netstat -tlnp | grep :1935 || echo "  ✅ Available"

# Update systemd service to use new environment
echo "🔄 Updating systemd service configuration..."
sudo tee /etc/systemd/system/gkpradio.service > /dev/null << 'EOF'
[Unit]
Description=GKP Radio App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/srv/gkpradio
Environment=NODE_ENV=production
EnvironmentFile=/srv/gkpradio/.env.production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gkpradio

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
echo "♻️ Reloading systemd and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable gkpradio
sudo systemctl start gkpradio

# Check service status
echo "📋 Service status:"
sudo systemctl status gkpradio --no-pager -l

echo ""
echo "✅ Port configuration fix completed!"
echo ""
echo "🔗 Your application should now be accessible at:"
echo "   http://your-vps-ip:3001"
echo ""
echo "📊 To monitor the service:"
echo "   sudo journalctl -u gkpradio -f"
echo ""
echo "🔧 To check port usage:"
echo "   sudo netstat -tlnp | grep -E ':(3001|8001|1935)'"