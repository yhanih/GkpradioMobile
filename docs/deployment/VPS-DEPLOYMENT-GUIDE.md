# VPS Deployment Guide for GKP Radio

## Automated Deployment Setup

Your GKP Radio project is now configured for automated deployment to your VPS using GitHub Actions.

### GitHub Secrets Required

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VPS_HOST` | Your VPS IP address or hostname | `74.208.102.89` |
| `VPS_USERNAME` | SSH username (usually `root`) | `root` |
| `VPS_SSH_KEY` | Your private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |
| `GITHUB_TOKEN` | Your GitHub token | `github_pat_11A5WERLY0...` |

### How to Get Your SSH Key

If you don't have an SSH key for your VPS:

```bash
# On your VPS, generate an SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Display your private key (add this to GitHub secrets)
cat ~/.ssh/id_rsa

# Display your public key (add this to ~/.ssh/authorized_keys if needed)
cat ~/.ssh/id_rsa.pub
```

### Deployment Process

1. **Automatic Trigger**: Every push to `main` branch triggers deployment
2. **Manual Trigger**: Use GitHub Actions "Run workflow" button
3. **Build Process**: 
   - Installs dependencies
   - Builds the application
   - Deploys to VPS at `/srv/gkpradio`
   - Sets up PostgreSQL database
   - Starts with PM2

### VPS Requirements

- **OS**: Ubuntu 20.04+ / Debian 10+
- **Memory**: 1GB+ RAM
- **Storage**: 5GB+ available
- **Access**: SSH root access
- **Ports**: 3001 (application), 5432 (PostgreSQL), 1935 (RTMP), 8001 (HLS streaming)

### First-Time VPS Setup

Run this on your VPS before the first deployment:

```bash
# Update system
apt update && apt upgrade -y

# Install basic dependencies
apt install -y curl wget git build-essential

# The deployment script will install Node.js, PM2, PostgreSQL, and FFmpeg automatically
```

### Application URLs After Deployment

- **Main Application**: `http://your-vps-ip:3001`
- **API Endpoints**: `http://your-vps-ip:3001/api/*`
- **HLS Streams**: `http://your-vps-ip:3001/hls/*`
- **WebSocket**: `ws://your-vps-ip:3001/ws/stream`

### Post-Deployment Commands

Connect to your VPS and manage the application:

```bash
# Check application status
pm2 status

# View logs
pm2 logs gkpradio-app

# Restart application
pm2 restart gkpradio-app

# View database status
sudo -u postgres psql -l

# Connect to application database
sudo -u postgres psql -d gkp_radio
```

### Environment Configuration

The deployment automatically creates `.env.production` with:
- Random security keys (JWT_SECRET, SESSION_SECRET)
- Database connection (DATABASE_URL)
- Port configuration (PORT=3001)
- RTMP streaming port (RTMP_HTTP_PORT=8001)
- AzuraCast integration (if available)

### Nginx Setup (Optional)

To serve on port 80/443, add this Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /hls {
        proxy_pass http://localhost:3001/hls;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control no-cache;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Troubleshooting

**Deployment fails:**
- Check GitHub Actions logs
- Verify SSH key and VPS access
- Ensure VPS has enough memory/storage

**Application won't start:**
```bash
pm2 logs gkpradio-app
pm2 restart gkpradio-app
```

**Database issues:**
```bash
sudo -u postgres psql
\l  # List databases
\c gkp_radio  # Connect to database
```

### Security Notes

- SSH key is used for secure deployment
- Database password should be changed from default
- Consider setting up SSL/TLS certificates
- Firewall should allow ports 22, 80, 443, 3001

## Ready to Deploy

1. Add the required GitHub secrets
2. Push any change to trigger deployment
3. Monitor GitHub Actions for deployment progress
4. Access your app at `http://your-vps-ip:3001`

Your GKP Radio platform will be automatically deployed and running!