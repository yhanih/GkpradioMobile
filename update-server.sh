#!/bin/bash

# GKP Radio Server Update Script
# This script updates your production server with the fixed AzuraCast connection

set -e  # Exit on any error

echo "🔄 Starting GKP Radio server update..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Make sure you're in the GKP Radio project directory.${NC}"
    exit 1
fi

# Backup current deployment
echo -e "${YELLOW}📦 Creating backup...${NC}"
BACKUP_DIR="../gkpradio-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"

# Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${YELLOW}🔨 Building project...${NC}"
npm run build

# Fix database permissions if needed
echo -e "${YELLOW}🔧 Checking database connection...${NC}"
if ! npm run db:push 2>/dev/null; then
    echo -e "${RED}⚠️  Database migration failed. You may need to fix PostgreSQL permissions.${NC}"
    echo -e "${YELLOW}Run these commands to fix database permissions:${NC}"
    echo ""
    echo "sudo -u postgres psql"
    echo "ALTER USER gkpuser WITH SUPERUSER;"
    echo "GRANT ALL PRIVILEGES ON DATABASE gkpradio TO gkpuser;"
    echo "ALTER DATABASE gkpradio OWNER TO gkpuser;"
    echo "\q"
    echo ""
    echo "Then run: npm run db:push"
    echo ""
    read -p "Press Enter after fixing database permissions..."
    npm run db:push
fi

# Test the AzuraCast connection
echo -e "${YELLOW}🧪 Testing AzuraCast connection...${NC}"
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s http://74.208.102.89:8080/api/nowplaying/1 | head -c 100)
    if [[ $RESPONSE == *"station"* ]]; then
        echo -e "${GREEN}✅ AzuraCast connection working!${NC}"
    else
        echo -e "${RED}⚠️  AzuraCast may not be responding correctly${NC}"
    fi
fi

# Restart the application
echo -e "${YELLOW}🔄 Restarting application...${NC}"
if command -v pm2 &> /dev/null; then
    # Using PM2
    pm2 restart all || pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ Application restarted with PM2${NC}"
elif pgrep -f "node.*index.js" > /dev/null; then
    # Kill existing node processes
    pkill -f "node.*index.js"
    nohup npm start > server.log 2>&1 &
    echo -e "${GREEN}✅ Application restarted${NC}"
else
    # Start fresh
    nohup npm start > server.log 2>&1 &
    echo -e "${GREEN}✅ Application started${NC}"
fi

# Wait a moment for startup
sleep 3

# Test the API endpoint
echo -e "${YELLOW}🧪 Testing local API...${NC}"
if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s http://localhost:5000/api/stream/status || echo "failed")
    if [[ $API_RESPONSE == *"isConnected"* ]]; then
        echo -e "${GREEN}✅ Local API is working!${NC}"
        if [[ $API_RESPONSE == *"true"* ]]; then
            echo -e "${GREEN}✅ AzuraCast integration is connected!${NC}"
        else
            echo -e "${YELLOW}⚠️  AzuraCast showing fallback data (server may be down)${NC}"
        fi
    else
        echo -e "${RED}❌ Local API not responding correctly${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Update completed!${NC}"
echo ""
echo "Key changes applied:"
echo "• Fixed AzuraCast connection to use port 8080"
echo "• Improved error handling with graceful fallbacks"
echo "• Updated radio player to show real-time metadata"
echo ""
echo "Your website should now have working radio functionality!"
echo "Check your site at: https://godkingdomprinciplesradio.com/"