#!/bin/bash

# GKP Radio - Deploy to VPS (74.208.102.89)
# Configured for your existing VPS setup

set -e

echo "🚀 GKP Radio - Deploying to VPS"
echo "================================"
echo "Target: 74.208.102.89 (/srv/gkpradio)"
echo ""

# VPS Configuration (based on your setup)
VPS_HOST="74.208.102.89"
VPS_USER="deploy"
VPS_PATH="/srv/gkpradio"

# Check if SSH key is configured
if [ -n "$SSH_PRIVATE_KEY" ]; then
    echo "📝 Setting up SSH key..."
    mkdir -p ~/.ssh
    echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    SSH_OPTIONS="-i ~/.ssh/deploy_key -o StrictHostKeyChecking=no"
else
    echo "⚠️  No SSH key found. You'll need to enter password."
    SSH_OPTIONS="-o StrictHostKeyChecking=no"
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed! Check for errors above."
    exit 1
fi

echo "✅ Build successful!"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    server/ \
    client/ \
    shared/ \
    hls/ \
    .env.production.example \
    2>/dev/null

PACKAGE_SIZE=$(du -h deploy.tar.gz | cut -f1)
echo "   Package size: $PACKAGE_SIZE"

# Upload to VPS
echo "📤 Uploading to VPS..."
scp $SSH_OPTIONS deploy.tar.gz $VPS_USER@$VPS_HOST:/tmp/

# Deploy on VPS
echo "🚀 Deploying on VPS..."
ssh $SSH_OPTIONS $VPS_USER@$VPS_HOST << 'EOF'
    set -e
    
    echo "📁 Extracting files..."
    cd /srv/gkpradio
    
    # Backup current deployment
    if [ -d "dist" ]; then
        echo "   Creating backup..."
        sudo cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Extract new files
    tar -xzf /tmp/deploy.tar.gz
    rm /tmp/deploy.tar.gz
    
    echo "📦 Installing dependencies..."
    npm install --production --legacy-peer-deps --no-audit
    
    echo "🔄 Restarting service..."
    sudo systemctl restart gkpradio
    
    # Wait for service to start
    sleep 3
    
    # Check if service is running
    if sudo systemctl is-active --quiet gkpradio; then
        echo "✅ Service restarted successfully!"
    else
        echo "⚠️  Service may not have started correctly. Checking logs..."
        sudo journalctl -u gkpradio -n 20 --no-pager
    fi
    
    echo ""
    echo "📊 Deployment Status:"
    echo "===================="
    sudo systemctl status gkpradio --no-pager | head -10
EOF

# Cleanup local files
rm deploy.tar.gz

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Your app is now live at:"
echo "  🌐 https://godkingdomprinciplesradio.com"
echo ""
echo "Services running:"
echo "  ✅ Node.js app (systemd service)"
echo "  ✅ Nginx reverse proxy" 
echo "  ✅ AzuraCast streaming (port 8080/8000)"
echo ""
echo "To check logs on VPS:"
echo "  ssh $VPS_USER@$VPS_HOST 'sudo journalctl -u gkpradio -n 50'"
echo ""