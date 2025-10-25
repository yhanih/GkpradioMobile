#!/bin/bash

# GKP Radio - Create Deployment Package Script
# This creates a clean deployment package for IONOS VPS

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

PACKAGE_NAME="gkp-radio-deployment-$(date +%Y%m%d-%H%M%S)"
PACKAGE_DIR="./deployment-packages/$PACKAGE_NAME"

log "Creating deployment package: $PACKAGE_NAME"

# Create package directory
mkdir -p "$PACKAGE_DIR"

# Build the application first
log "Building application..."
npm run build

# Copy essential files and directories
log "Copying application files..."

# Core application files
cp -r dist "$PACKAGE_DIR/"
cp -r client "$PACKAGE_DIR/"
cp -r server "$PACKAGE_DIR/"
cp -r shared "$PACKAGE_DIR/" 2>/dev/null || true
cp -r hls "$PACKAGE_DIR/" 2>/dev/null || true

# Configuration files
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp drizzle.config.ts "$PACKAGE_DIR/"
cp tailwind.config.ts "$PACKAGE_DIR/"
cp vite.config.ts "$PACKAGE_DIR/"
cp tsconfig.json "$PACKAGE_DIR/"
cp components.json "$PACKAGE_DIR/"

# Copy deployment scripts and guides
cp ionos-deployment-script.sh "$PACKAGE_DIR/"
cp DEPLOYMENT-CHECKLIST.md "$PACKAGE_DIR/"
cp ecosystem.config.js "$PACKAGE_DIR/" 2>/dev/null || true

# Create production environment template
cat > "$PACKAGE_DIR/.env.production.template" << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://gkp_radio:YOUR_DB_PASSWORD@localhost:5432/gkp_radio
SESSION_SECRET=YOUR_SECURE_SESSION_SECRET_HERE
JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
AZURACAST_BASE_URL=http://74.208.102.89
EOF

# Create deployment README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# GKP Radio - Deployment Package

## Quick Start

1. **Upload this entire folder** to your VPS at `/var/www/gkp-radio/`

2. **Configure environment**:
   ```bash
   cp .env.production.template .env.production
   # Edit .env.production with your actual values
   ```

3. **Install dependencies**:
   ```bash
   npm install --production
   ```

4. **Set up database**:
   ```bash
   npm run db:push
   ```

5. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx** (see ionos-deployment-script.sh)

7. **Set up SSL**:
   ```bash
   certbot --nginx -d yourdomain.com
   ```

## Files Included
- `dist/` - Built application
- `server/` - Backend source code
- `client/` - Frontend source code
- `ionos-deployment-script.sh` - Server setup script
- `ecosystem.config.js` - PM2 configuration
- `.env.production.template` - Environment variables template

## Support
Refer to DEPLOYMENT-CHECKLIST.md for detailed setup instructions.
EOF

# Create PM2 ecosystem file for the package
cat > "$PACKAGE_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'gkp-radio',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/gkp-radio.error.log',
    out_file: '/var/log/pm2/gkp-radio.out.log',
    log_file: '/var/log/pm2/gkp-radio.log',
    time: true,
    autorestart: true,
    restart_delay: 1000
  }]
};
EOF

# Create archive
log "Creating deployment archive..."
cd deployment-packages
tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
cd ..

success "Deployment package created successfully!"
echo ""
echo "Package location: ./deployment-packages/$PACKAGE_NAME.tar.gz"
echo "Package size: $(du -h ./deployment-packages/$PACKAGE_NAME.tar.gz | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Fill out DEPLOYMENT-CHECKLIST.md with your VPS details"
echo "2. Upload $PACKAGE_NAME.tar.gz to your VPS"
echo "3. Extract and follow the README.md instructions"