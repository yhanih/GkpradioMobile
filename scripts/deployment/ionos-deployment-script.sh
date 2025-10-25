#!/bin/bash

# GKP Radio - IONOS VPS Deployment Script
# This script will be customized based on your specific requirements

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables (to be filled in based on your requirements)
VPS_IP="YOUR_VPS_IP"
SSH_USER="YOUR_SSH_USER"
DOMAIN_NAME="YOUR_DOMAIN"
APP_PORT="3000"
APP_NAME="gkp-radio"
APP_DIR="/var/www/$APP_NAME"

log "Starting GKP Radio deployment to IONOS VPS..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log "Installing required packages..."
apt install -y curl wget git build-essential nginx ufw certbot python3-certbot-nginx

# Install Node.js 20 LTS
log "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
log "Installing PM2 process manager..."
npm install -g pm2

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
log "Configuring PostgreSQL..."
sudo -u postgres createuser --superuser $APP_NAME || true
sudo -u postgres createdb $APP_NAME || true
sudo -u postgres psql -c "ALTER USER $APP_NAME PASSWORD 'secure_password_here';" || true

# Create application directory
log "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Configure firewall
log "Configuring UFW firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow $APP_PORT
ufw allow 5432  # PostgreSQL (internal only)

# Create environment file
log "Creating environment configuration..."
cat > $APP_DIR/.env.production << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://$APP_NAME:secure_password_here@localhost:5432/$APP_NAME
SESSION_SECRET=REPLACE_WITH_SECURE_SECRET
JWT_SECRET=REPLACE_WITH_SECURE_JWT_SECRET
AZURACAST_BASE_URL=http://74.208.102.89
EOF

# Configure Nginx
log "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Handle WebSocket connections
    location /ws/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Handle HLS streaming
    location /hls/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers for HLS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Create PM2 ecosystem file
log "Creating PM2 configuration..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/$APP_NAME.error.log',
    out_file: '/var/log/pm2/$APP_NAME.out.log',
    log_file: '/var/log/pm2/$APP_NAME.log',
    time: true
  }]
};
EOF

# Create log directory for PM2
mkdir -p /var/log/pm2

log "Deployment script prepared. Next steps:"
echo "1. Upload your application files to $APP_DIR"
echo "2. Run 'npm install --production' in $APP_DIR"
echo "3. Run 'npm run build' in $APP_DIR"
echo "4. Run 'pm2 start ecosystem.config.js' in $APP_DIR"
echo "5. Run 'pm2 save && pm2 startup' to enable auto-start"
echo "6. Configure SSL with 'certbot --nginx -d $DOMAIN_NAME'"
echo "7. Restart Nginx with 'systemctl restart nginx'"

success "Initial server setup completed!"