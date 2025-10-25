#!/bin/bash

# Script to load environment variables and start PM2
# This ensures .env file is properly loaded before PM2 starts

# Navigate to the application directory
cd "$(dirname "$0")/.." || exit 1

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
echo "Loading environment variables from .env..."
set -a
source .env
set +a

# Verify critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set in .env file!"
    echo "Please configure your database connection:"
    echo "  DATABASE_URL=postgresql://gkp_user:password@localhost:5432/gkp_radio"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "CHANGE_THIS_TO_A_SUPER_SECURE_32_CHARACTER_MINIMUM_SECRET_KEY" ]; then
    echo "ERROR: JWT_SECRET is not configured properly in .env file!"
    echo "Please set a secure JWT secret (minimum 32 characters)"
    exit 1
fi

if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "CHANGE_THIS_TO_ANOTHER_SECURE_32_CHARACTER_MINIMUM_SECRET_KEY" ]; then
    echo "ERROR: SESSION_SECRET is not configured properly in .env file!"
    echo "Please set a secure session secret (minimum 32 characters)"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start or reload PM2
echo "Starting PM2 with environment variables..."
if pm2 list | grep -q "gkp-radio"; then
    pm2 reload ecosystem.config.js --update-env
    echo "Application reloaded successfully!"
else
    pm2 start ecosystem.config.js
    echo "Application started successfully!"
fi

# Save PM2 configuration
pm2 save

# Show status
pm2 status gkp-radio

echo ""
echo "✅ Application is running!"
echo "View logs: pm2 logs gkp-radio"
echo "Monitor: pm2 monit"