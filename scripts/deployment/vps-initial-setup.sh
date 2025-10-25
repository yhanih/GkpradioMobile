#!/bin/bash
set -e

# GKP Radio VPS Initial Setup Script
# This script sets up a fresh VPS for GKP Radio deployment

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
   error "Please run this script with sudo or as root"
fi

log "Starting GKP Radio VPS Setup..."

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    ffmpeg \
    htop \
    fail2ban \
    unzip

# Install Node.js 20.x
log "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node -v)
npm_version=$(npm -v)
log "Node.js $node_version and npm $npm_version installed successfully"

# Install PM2 globally
log "Installing PM2 process manager..."
npm install -g pm2

# Install TypeScript and tsx globally for production
log "Installing TypeScript and tsx..."
npm install -g typescript tsx

# Create application user
log "Creating application user..."
if ! id -u gkpradio >/dev/null 2>&1; then
    useradd -m -s /bin/bash gkpradio
    usermod -aG sudo gkpradio
    log "User 'gkpradio' created"
else
    log "User 'gkpradio' already exists"
fi

# Create application directory
log "Creating application directory..."
mkdir -p /srv/gkpradio
chown -R gkpradio:gkpradio /srv/gkpradio

# Create log directory within application directory
mkdir -p /srv/gkpradio/logs
chown -R gkpradio:gkpradio /srv/gkpradio/logs

# Create backup directory within application directory
mkdir -p /srv/gkpradio/backups
chown -R gkpradio:gkpradio /srv/gkpradio/backups

# Setup PostgreSQL
log "Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE USER gkp_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE gkp_radio OWNER gkp_user;
GRANT ALL PRIVILEGES ON DATABASE gkp_radio TO gkp_user;
ALTER USER gkp_user CREATEDB;
EOF

log "PostgreSQL database setup complete"

# Configure PostgreSQL for remote connections (if needed)
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Configure Redis
log "Configuring Redis..."
sed -i "s/supervised no/supervised systemd/" /etc/redis/redis.conf
sed -i "s/# maxmemory <bytes>/maxmemory 256mb/" /etc/redis/redis.conf
sed -i "s/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/" /etc/redis/redis.conf

# Enable and start Redis
systemctl enable redis-server
systemctl restart redis-server

# Configure firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # HTTP
ufw allow 443/tcp       # HTTPS
ufw allow 5000/tcp      # Node.js app
ufw allow 1935/tcp      # RTMP
ufw allow 8000/tcp      # HLS streaming
ufw allow 8889/tcp      # MediaMTX WebRTC
ufw allow 8889/udp      # MediaMTX WebRTC
ufw allow 9997/tcp      # MediaMTX API
ufw --force enable

log "Firewall configured successfully"

# Setup fail2ban for security
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/error.log
maxretry = 2
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Setup swap if not exists
log "Checking swap configuration..."
if [ ! -f /swapfile ]; then
    log "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    
    # Configure swappiness
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p
fi

# Install MediaMTX for WebRTC streaming
log "Installing MediaMTX..."
MEDIAMTX_VERSION="v1.4.3"
wget https://github.com/bluenviron/mediamtx/releases/download/${MEDIAMTX_VERSION}/mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz
tar -xzf mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz -C /usr/local/bin/
rm mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz

# Create MediaMTX systemd service
cat > /etc/systemd/system/mediamtx.service << 'EOF'
[Unit]
Description=MediaMTX
After=network.target

[Service]
Type=simple
User=gkpradio
ExecStart=/usr/local/bin/mediamtx /srv/gkpradio/mediamtx.yml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mediamtx

# Create deployment script for gkpradio user
cat > /home/gkpradio/deploy.sh << 'EOF'
#!/bin/bash
cd /srv/gkpradio
git pull origin main
npm ci --production=false
npm run build
pm2 reload ecosystem.config.js --update-env
pm2 save
EOF

chmod +x /home/gkpradio/deploy.sh
chown gkpradio:gkpradio /home/gkpradio/deploy.sh

# Create backup script
cat > /usr/local/bin/backup-gkpradio.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/srv/gkpradio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"
APP_BACKUP="$BACKUP_DIR/app_backup_$DATE.tar.gz"

# Backup database
sudo -u postgres pg_dump gkp_radio > "$DB_BACKUP"
gzip "$DB_BACKUP"

# Backup application files
tar -czf "$APP_BACKUP" -C /srv/gkpradio . --exclude=node_modules --exclude=.git

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-gkpradio.sh

# Setup daily backup cron job
echo "0 2 * * * gkpradio /usr/local/bin/backup-gkpradio.sh >> /srv/gkpradio/logs/backup.log 2>&1" > /etc/cron.d/gkpradio-backup

# System tuning for performance
log "Applying system performance tuning..."
cat >> /etc/sysctl.conf << 'EOF'

# Network tuning for streaming
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_notsent_lowat = 16384
net.ipv4.tcp_tw_reuse = 1

# File descriptor limits
fs.file-max = 2097152
fs.nr_open = 1048576
EOF

sysctl -p

# Increase file descriptor limits for gkpradio user
cat >> /etc/security/limits.conf << 'EOF'
gkpradio soft nofile 65536
gkpradio hard nofile 65536
gkpradio soft nproc 32768
gkpradio hard nproc 32768
EOF

# Create systemd service for the application
cat > /etc/systemd/system/gkpradio.service << 'EOF'
[Unit]
Description=GKP Radio Application
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=gkpradio
WorkingDirectory=/srv/gkpradio
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=on-failure
RestartSec=10

Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gkpradio

# Setup log rotation
cat > /etc/logrotate.d/gkpradio << 'EOF'
/srv/gkpradio/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 gkpradio gkpradio
    sharedscripts
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

# Create initial nginx configuration
cat > /etc/nginx/sites-available/gkpradio << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        client_max_body_size 100M;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /hls {
        alias /srv/gkpradio/hls;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gkpradio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Final instructions
echo ""
log "====================================================================================="
log "VPS Initial Setup Complete!"
log "====================================================================================="
echo ""
info "Next steps:"
echo "1. Clone your repository to /srv/gkpradio:"
echo "   sudo -u gkpradio git clone https://github.com/yourusername/gkp-radio.git /srv/gkpradio"
echo ""
echo "2. Copy and configure .env file:"
echo "   cd /srv/gkpradio"
echo "   sudo -u gkpradio cp .env.example .env"
echo "   sudo -u gkpradio nano .env"
echo ""
echo "3. Install dependencies and build:"
echo "   sudo -u gkpradio npm ci --production=false"
echo "   sudo -u gkpradio npm run build"
echo ""
echo "4. Run database migrations:"
echo "   sudo -u gkpradio npm run db:push"
echo ""
echo "5. Start the application:"
echo "   sudo -u gkpradio pm2 start ecosystem.config.js"
echo "   sudo -u gkpradio pm2 save"
echo "   sudo -u gkpradio pm2 startup systemd -u gkpradio --hp /home/gkpradio"
echo ""
echo "6. Setup SSL certificate (replace your-domain.com):"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo "7. Configure DNS:"
echo "   Point your domain's A record to this server's IP address"
echo ""
warning "IMPORTANT: Change the PostgreSQL password in production!"
echo "   sudo -u postgres psql -c \"ALTER USER gkp_user PASSWORD 'your-secure-password';\""
echo ""
log "Server is ready for deployment!"
log "====================================================================================="