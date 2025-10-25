#!/bin/bash

# GKP Radio VPS Deployment Script
echo "🚀 Starting GKP Radio deployment..."

# Create logs directory
mkdir -p logs

# Build the application
npm run build

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to auto-restart on system reboot
pm2 startup

echo "✅ GKP Radio deployed successfully!"
echo "Your app is running on port 5000"
echo "Use 'pm2 status' to check the app status"
echo "Use 'pm2 logs gkp-radio' to view logs"
