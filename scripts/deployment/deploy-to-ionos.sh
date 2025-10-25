#!/bin/bash

# GKP Radio - Manual Deploy to IONOS Script
# Run this in Replit terminal to deploy to your IONOS server

set -e

echo "🚀 GKP Radio - Deploying to IONOS..."
echo "=================================="

# Check if required environment variables are set
if [ -z "$IONOS_HOST" ] || [ -z "$IONOS_USER" ] || [ -z "$IONOS_PATH" ]; then
    echo "❌ Missing required environment variables!"
    echo "Please set in Replit Secrets:"
    echo "- IONOS_HOST (your IONOS server hostname/IP)"
    echo "- IONOS_USER (your SSH username)"
    echo "- IONOS_PATH (path to your domain folder)"
    echo "- IONOS_SSH_KEY (your SSH private key - optional if using password)"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz \
    dist/ \
    client/ \
    server/ \
    shared/ \
    hls/ \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    drizzle.config.ts \
    tailwind.config.ts \
    vite.config.ts \
    tsconfig.json \
    .env.production.example

echo "📤 Uploading to IONOS server..."

# Upload and deploy via SSH
if [ -n "$IONOS_SSH_KEY" ]; then
    # Using SSH key authentication
    scp -i "$IONOS_SSH_KEY" deploy.tar.gz "$IONOS_USER@$IONOS_HOST:$IONOS_PATH/"
    ssh -i "$IONOS_SSH_KEY" "$IONOS_USER@$IONOS_HOST" << EOF
        cd "$IONOS_PATH"
        echo "📁 Extracting files..."
        tar -xzf deploy.tar.gz
        rm deploy.tar.gz
        
        echo "📦 Installing dependencies..."
        npm install --production --no-audit
        
        echo "🔄 Restarting application..."
        pm2 restart gkp-radio || pm2 start ecosystem.config.js --name gkp-radio
        pm2 save
        
        echo "✅ Deployment completed successfully!"
EOF
else
    # Using password authentication (will prompt for password)
    scp deploy.tar.gz "$IONOS_USER@$IONOS_HOST:$IONOS_PATH/"
    ssh "$IONOS_USER@$IONOS_HOST" << EOF
        cd "$IONOS_PATH"
        echo "📁 Extracting files..."
        tar -xzf deploy.tar.gz
        rm deploy.tar.gz
        
        echo "📦 Installing dependencies..."
        npm install --production --no-audit
        
        echo "🔄 Restarting application..."
        pm2 restart gkp-radio || pm2 start ecosystem.config.js --name gkp-radio
        pm2 save
        
        echo "✅ Deployment completed successfully!"
EOF
fi

# Cleanup
rm deploy.tar.gz

echo ""
echo "🎉 GKP Radio has been deployed to IONOS!"
echo "Your website should now be updated at your domain."
echo ""