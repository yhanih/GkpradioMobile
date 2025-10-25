#!/bin/bash

# Manual deployment script for IONOS hosting
# This script builds and uploads your GKP Radio app to IONOS

echo "🚀 Starting GKP Radio deployment to IONOS..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# IONOS connection details
IONOS_HOST="access974924.webspace-data.io"
IONOS_USER="u95712626"
IONOS_PATH="/plugins"

echo "📁 Ready to upload to IONOS server:"
echo "   Host: $IONOS_HOST"
echo "   User: $IONOS_USER"  
echo "   Path: $IONOS_PATH"

echo ""
echo "🔑 To complete deployment, you can use any FTP client with these details:"
echo "   - Host: $IONOS_HOST"
echo "   - Username: $IONOS_USER"
echo "   - Password: [Your IONOS password]"
echo "   - Upload the 'dist' folder contents to: $IONOS_PATH"

echo ""
echo "📋 Manual upload steps:"
echo "1. Open an FTP client (like FileZilla)"
echo "2. Connect using the details above"
echo "3. Navigate to $IONOS_PATH on the server"
echo "4. Upload all files from the 'dist' folder"

echo ""
echo "🎯 Your GKP Radio app will be live at your IONOS domain!"