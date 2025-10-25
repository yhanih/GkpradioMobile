# 🐳 Docker Deployment Guide for GKP Radio

Complete Docker containerization setup for easy VPS deployment with all streaming services.

## 🏗️ Architecture Overview

Your GKP Radio application now runs in a Docker container ecosystem:

- **gkp-radio**: Main Node.js application (port 5000)
- **postgres**: PostgreSQL database (port 5432) 
- **mediamtx**: WebRTC ultra-low latency streaming (ports 8889, 9997, 1936)
- **redis**: Session storage and caching (port 6379)
- **nginx**: Reverse proxy with SSL termination (ports 80, 443) - optional

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Copy environment template
cp .env.docker .env

# Edit your environment variables
nano .env
```

### 2. Configure Environment
Edit `.env` with your settings:
```bash
# REQUIRED: Change these values
DOMAIN=your-domain.com
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_super_secure_jwt_secret_key_32_chars

# Optional: Add your integrations
STRIPE_SECRET_KEY=sk_live_your_stripe_key
AZURACAST_BASE_URL=http://your-azuracast-server:8080
```

### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f gkp-radio
```

## 📡 Streaming Configuration

### RTMP Ingest (OBS Studio)
- **Server**: `rtmp://your-domain.com:1935/live`
- **Stream Key**: `gkp_radio_live`
- **Port**: 1935 (exposed to internet)

### WebRTC Ultra-Low Latency
- **Endpoint**: Internal Docker network
- **Latency**: Sub-second (200-500ms)
- **Access**: Through main app proxy

### HLS/FLV Streaming
- **URL**: `http://your-domain.com:8000/live/stream.flv`
- **Port**: 8000 (exposed to internet)

## 🔧 Docker Services Explained

### Main Application (`gkp-radio`)
```yaml
ports:
  - "5000:5000"   # Web interface
  - "1935:1935"   # RTMP streaming
  - "8000:8000"   # HLS/FLV HTTP streaming
```

### PostgreSQL Database (`postgres`)
- Persistent volume: `postgres_data`
- Auto-initialization with GKP Radio schema
- Healthcheck enabled

### MediaMTX (`mediamtx`)
- WebRTC streaming for ultra-low latency
- RTMP input on port 1936 (internal Docker network)
- API on port 9997 for status monitoring

### Redis (`redis`)
- Session storage and caching
- Memory limit: 256MB
- Persistent data with append-only file

### Nginx Proxy (`nginx`) - Optional
```bash
# Enable Nginx reverse proxy
COMPOSE_PROFILES=proxy docker-compose up -d
```

## 📋 Production Deployment Steps

### 1. VPS Server Setup
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment
```bash
# Clone your repository
git clone https://github.com/your-username/gkp-radio.git
cd gkp-radio

# Setup environment
cp .env.docker .env
nano .env  # Configure your settings

# Deploy
docker-compose up -d

# Initialize database
docker-compose exec gkp-radio npm run db:push
```

### 3. Firewall Configuration
```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 1935  # RTMP
sudo ufw allow 8000  # HLS/FLV
sudo ufw enable
```

## 🔍 Monitoring and Maintenance

### Health Checks
```bash
# Check all services
docker-compose ps

# View application logs
docker-compose logs -f gkp-radio

# Check database connection
docker-compose exec postgres pg_isready -U gkp_user

# Test streaming endpoints
curl http://localhost:5000/api/stream/status
curl http://localhost:9997/v3/config/global/get
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U gkp_user gkp_radio > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U gkp_user gkp_radio < backup_20250101.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build gkp-radio
docker-compose up -d gkp-radio

# Run database migrations if needed
docker-compose exec gkp-radio npm run db:push
```

## 🛠️ Development Mode

For development with hot reloading:

```bash
# Create development override
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  gkp-radio:
    build:
      target: builder
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
EOF

# Start in development mode
docker-compose up -d
```

## 📊 Environment Variables Reference

### Required Variables
```bash
DOMAIN=your-domain.com                    # Your VPS domain/IP
DB_PASSWORD=secure_password               # Database password
JWT_SECRET=32_character_secret            # JWT signing key
```

### Streaming Integration
```bash
AZURACAST_BASE_URL=http://azuracast:8080  # AzuraCast server
AZURACAST_STATION_ID=1                    # Station ID
```

### Optional Features
```bash
STRIPE_SECRET_KEY=sk_live_...             # Stripe payments
ANTI_SPAM_ENABLED=true                    # Cloudflare Turnstile
TURNSTILE_SECRET_KEY=secret               # Turnstile secret
```

## 🔒 SSL/HTTPS Setup (Production)

### With Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Update nginx config to use certificates
# Uncomment HTTPS server block in docker/nginx/nginx.conf
```

### With Custom Certificates
```bash
# Place certificates
mkdir -p docker/nginx/ssl
cp your-cert.pem docker/nginx/ssl/cert.pem
cp your-key.pem docker/nginx/ssl/key.pem

# Enable proxy profile
COMPOSE_PROFILES=proxy docker-compose up -d
```

## 🚨 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
docker-compose logs gkp-radio

# Verify environment variables
docker-compose exec gkp-radio env | grep -E "(DATABASE|JWT|DOMAIN)"
```

**Database connection failed:**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U gkp_user

# Reset database container
docker-compose down postgres
docker volume rm gkp-radio_postgres_data
docker-compose up -d postgres
```

**Streaming not working:**
```bash
# Test RTMP port
telnet your-domain.com 1935

# Check MediaMTX status
curl http://localhost:9997/v3/paths/list

# Verify HLS endpoint
curl http://localhost:8000/live/stream.m3u8
```

**WebRTC connection fails:**
```bash
# Check MediaMTX API
docker-compose exec mediamtx wget -q -O- localhost:9997/v3/config/global/get

# Verify proxy endpoint
curl -X POST http://localhost:5000/api/webrtc/live/whep
```

## 📝 Support

For issues:
1. Check service logs: `docker-compose logs [service-name]`
2. Verify environment variables are set correctly
3. Ensure all ports are accessible from the internet
4. Check firewall rules on your VPS

Your GKP Radio application is now fully containerized and ready for production deployment! 🎉