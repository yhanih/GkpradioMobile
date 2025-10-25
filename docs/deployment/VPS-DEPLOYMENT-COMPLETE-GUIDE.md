# GKP Radio - Complete VPS Deployment Guide

## 📋 Overview

This guide provides comprehensive instructions for deploying GKP Radio to your VPS. After following these steps, your application will be production-ready and automatically deploy when you push to your repository.

## 🚀 Quick Start

Your application is now configured for automated deployment. Simply:

1. Set up your VPS (one-time setup)
2. Configure GitHub secrets
3. Push to main branch = automatic deployment!

## 📦 Prerequisites

### VPS Requirements
- Ubuntu 20.04 LTS or 22.04 LTS
- Minimum 2GB RAM (4GB recommended)
- 20GB+ storage
- Root or sudo access
- Open ports: 22, 80, 443, 5000, 1935, 8000, 8889

### Local Requirements
- Git installed
- SSH key pair generated
- GitHub repository access

## 🔧 Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS
```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Run Initial Setup Script
```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/gkp-radio/main/vps-initial-setup.sh
chmod +x vps-initial-setup.sh
sudo ./vps-initial-setup.sh
```

This script will:
- Install Node.js 20, PostgreSQL, Redis, Nginx, PM2
- Create application user and directories
- Set up database
- Configure firewall
- Install security tools

### 1.3 Configure PostgreSQL Password
```bash
# Change the default password
sudo -u postgres psql -c "ALTER USER gkp_user PASSWORD 'YOUR_SECURE_PASSWORD';"
```

## 🔑 Step 2: Setup SSH Access

### 2.1 Add Your SSH Key to VPS
```bash
# On your VPS, switch to gkpradio user
sudo su - gkpradio

# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
echo "YOUR_PUBLIC_SSH_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2.2 Test SSH Access
```bash
# From your local machine
ssh gkpradio@YOUR_VPS_IP
```

## 📁 Step 3: Deploy Application

### 3.1 Clone Repository
```bash
# As gkpradio user on VPS
cd /srv/gkpradio
git clone https://github.com/yourusername/gkp-radio.git .
```

### 3.2 Configure Environment Variables
```bash
# Copy and edit .env file
cp .env.example .env
nano .env
```

Update these critical variables:
- `DATABASE_URL` - Use the password you set in step 1.3
- `JWT_SECRET` - Generate secure 32+ character string
- `SESSION_SECRET` - Generate another secure string
- `DOMAIN` - Your domain or VPS IP
- API keys for services you're using

### 3.3 Initial Deployment
```bash
# Install dependencies
npm ci --production=false

# Build application
npm run build

# Run database migrations
npm run db:push

# Start with PM2 (using helper script to ensure environment variables are loaded)
bash scripts/load-env-and-start.sh

# Setup PM2 to start on system boot
pm2 startup systemd -u gkpradio --hp /home/gkpradio

# Follow the command output by PM2
```

## 🔒 Step 4: Setup SSL Certificate

### 4.1 Point Domain to VPS
Add an A record in your DNS settings:
- Type: A
- Name: @ (or subdomain)
- Value: YOUR_VPS_IP
- TTL: 3600

### 4.2 Configure Nginx
```bash
# Copy nginx configuration
sudo cp nginx-site.conf /etc/nginx/sites-available/gkpradio

# Replace YOUR_DOMAIN with actual domain
sudo sed -i 's/YOUR_DOMAIN/yourdomain.com/g' /etc/nginx/sites-available/gkpradio

# Enable site
sudo ln -sf /etc/nginx/sites-available/gkpradio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
sudo systemctl reload nginx
```

### 4.3 Install SSL Certificate
```bash
# Install Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Choose to redirect HTTP to HTTPS when asked
```

## 🤖 Step 5: Setup GitHub Actions

### 5.1 Generate SSH Key for GitHub
```bash
# On your local machine
ssh-keygen -t ed25519 -f ~/.ssh/gkpradio_deploy -C "github-actions"

# Add private key to GitHub secrets (copy entire content)
cat ~/.ssh/gkpradio_deploy

# Add public key to VPS
ssh gkpradio@YOUR_VPS_IP
echo "PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
```

### 5.2 Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets → Actions

Add these secrets:
- `SSH_PRIVATE_KEY` - Private key from step 5.1
- `VPS_HOST` - Your VPS IP or domain
- `VPS_USER` - gkpradio
- `VPS_PORT` - 22 (or custom SSH port)

### 5.3 Test Automated Deployment
```bash
# Make a small change and push
echo "# Deployment test" >> README.md
git add README.md
git commit -m "Test automated deployment"
git push origin main

# Check GitHub Actions tab for deployment status
```

## 📊 Step 6: Monitoring & Maintenance

### 6.1 View Application Status
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs gkp-radio

# Monitor resources
pm2 monit
```

### 6.2 Manual Deployment
```bash
# If needed, run manual deployment
cd /srv/gkpradio
./deploy-production.sh
```

### 6.3 Database Backup
```bash
# Backups run automatically at 2 AM
# Manual backup
/usr/local/bin/backup-gkpradio.sh

# Backups stored in /srv/gkpradio/backups/
ls -la /srv/gkpradio/backups/
```

### 6.4 Update SSL Certificate
```bash
# Certificates auto-renew, but you can test
sudo certbot renew --dry-run
```

## 🛠️ Troubleshooting

### Application Not Starting
```bash
# Check logs
pm2 logs gkp-radio --lines 100

# Check environment variables
pm2 env gkp-radio

# Restart application
pm2 restart gkp-radio
```

### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -d gkp_radio

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Port Access Issues
```bash
# Check firewall status
sudo ufw status

# Check if ports are listening
sudo netstat -tulpn | grep -E "5000|80|443|1935"
```

## 🔄 Updates and Rollbacks

### Automatic Updates
Push to main branch triggers automatic deployment via GitHub Actions

### Manual Update
```bash
cd /srv/gkpradio
git pull origin main
npm ci --production=false
npm run build
pm2 reload ecosystem.config.js
```

### Rollback to Previous Version
```bash
cd /srv/gkpradio
# View commit history
git log --oneline -10

# Rollback to specific commit
git reset --hard COMMIT_HASH
npm ci --production=false
npm run build
pm2 reload ecosystem.config.js
```

## 📝 Environment Variables Reference

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://gkp_user:password@localhost:5432/gkp_radio

# Security (generate secure random strings)
JWT_SECRET=minimum-32-character-secure-random-string
SESSION_SECRET=another-32-character-secure-random-string

# Domain
DOMAIN=your-domain.com
```

### Optional Services
```bash
# Email (SendGrid)
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
```

## 🚨 Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Configured firewall (ufw)
- [ ] Set up fail2ban
- [ ] Installed SSL certificate
- [ ] Set secure environment variables
- [ ] Disabled root SSH access
- [ ] Set up regular backups
- [ ] Configured log rotation
- [ ] Set up monitoring alerts

## 📞 Support Resources

### Logs Location
- Application: `/srv/gkpradio/logs/`
- PM2: `pm2 logs` or `/srv/gkpradio/logs/`
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`

### Common Commands
```bash
# Application control
pm2 status|start|stop|restart|reload gkp-radio

# View logs
pm2 logs gkp-radio
journalctl -u gkpradio -f

# Database access
sudo -u postgres psql -d gkp_radio

# System monitoring
htop
df -h
free -h
```

## 🎉 Deployment Complete!

Your GKP Radio application is now:
- ✅ Running in production
- ✅ Automatically deploying on git push
- ✅ Secured with SSL
- ✅ Monitored and auto-restarting
- ✅ Backed up daily

Access your application at: `https://your-domain.com`

## 📚 Additional Documentation

- [Docker Deployment](./DOCKER-DEPLOYMENT-GUIDE.md) - Alternative Docker setup
- [Streaming Setup](./streaming-setup.md) - Configure live streaming
- [API Documentation](./docs/api.md) - API endpoints reference
- [Troubleshooting Guide](./docs/troubleshooting.md) - Common issues

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained By**: GKP Radio Team