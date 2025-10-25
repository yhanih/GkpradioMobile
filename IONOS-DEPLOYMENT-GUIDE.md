# GKP Radio - IONOS Deployment Guide

## Prerequisites
- IONOS hosting account with Node.js support
- SSH access to your IONOS server
- Domain configured with IONOS

## Step 1: Prepare Your Application for Production

### 1.1 Environment Configuration
Create a production environment file:

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/gkp_radio

# Replace with your actual database credentials from IONOS
# Get these from your IONOS control panel under "Database" section

# AzuraCast Configuration (if using)
AZURACAST_BASE_URL=https://your-azuracast-domain.com
AZURACAST_API_KEY=your_api_key_here
AZURACAST_STATION_ID=1

# Security
SESSION_SECRET=your_very_secure_random_string_here
JWT_SECRET=another_secure_random_string
```

### 1.2 Update Package.json for Production
Your package.json already has the correct scripts:
- `npm run build` - Builds the application
- `npm start` - Starts production server

### 1.3 Build the Application
```bash
npm run build
```

## Step 2: Deploy to IONOS

### 2.1 Upload Files via FTP/SFTP
Upload these files and folders to your IONOS web directory:

**Required Files:**
```
├── dist/                 # Built application files
├── client/              # Frontend source
├── server/              # Backend source  
├── shared/              # Shared utilities
├── hls/                 # Video streaming files
├── package.json
├── package-lock.json
├── .env.production
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── node_modules/        # Dependencies (or install on server)
```

### 2.2 SSH Setup Commands
Connect to your IONOS server via SSH:

```bash
# Navigate to your web directory
cd /path/to/your/domain/html

# Install dependencies
npm install --production

# Build the application
npm run build

# Set up database (if using PostgreSQL)
npm run db:push
```

### 2.3 Database Setup on IONOS

#### Option A: Use IONOS Managed Database
1. Go to IONOS Control Panel → Databases
2. Create a new PostgreSQL database
3. Note the connection details
4. Update your `.env.production` file

#### Option B: Use External Database (Neon, Supabase, etc.)
1. Keep your existing DATABASE_URL
2. Ensure the external database allows connections from IONOS servers

### 2.4 Configure Process Manager (PM2)
Install PM2 for process management:

```bash
npm install -g pm2

# Create PM2 ecosystem file
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'gkp-radio',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 3: Configure Web Server (Apache/Nginx)

### For Apache (.htaccess)
Create `.htaccess` in your web root:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Enable CORS for API
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### For Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve static files directly
    location /assets {
        alias /path/to/your/domain/html/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Step 4: SSL Certificate Setup

### Using IONOS SSL
1. Go to IONOS Control Panel → SSL Certificates
2. Purchase/activate SSL certificate
3. Follow IONOS instructions to install

### Using Let's Encrypt (if supported)
```bash
certbot --nginx -d your-domain.com
```

## Step 5: Final Configuration

### 5.1 Update Application URLs
In your production environment, update any hardcoded URLs:

```javascript
// Replace localhost references with your domain
const API_BASE_URL = 'https://your-domain.com/api'
```

### 5.2 Test Deployment
1. Visit your domain
2. Test all features:
   - Video streaming
   - Audio player
   - Community features
   - Database connectivity

## Step 6: Monitoring & Maintenance

### 6.1 Log Management
```bash
# View application logs
pm2 logs gkp-radio

# Monitor system resources
pm2 monit
```

### 6.2 Backup Strategy
Set up automated backups for:
- Database
- Uploaded media files
- Configuration files

## Troubleshooting Common Issues

### Port Issues
- Ensure port 3000 is available and not blocked
- Check IONOS firewall settings

### Database Connection
- Verify DATABASE_URL is correct
- Check if IONOS allows external database connections
- Test connection with `npm run db:push`

### Static File Serving
- Ensure `dist/assets` folder is accessible
- Check file permissions (755 for directories, 644 for files)

### Memory Issues
- IONOS shared hosting has memory limits
- Consider upgrading to VPS if needed
- Use PM2 memory restart: `max_memory_restart: '500M'`

## Production Checklist

- [ ] Environment variables configured
- [ ] Database set up and connected
- [ ] Application built (`npm run build`)
- [ ] Files uploaded to IONOS
- [ ] Dependencies installed
- [ ] PM2 process manager configured
- [ ] Web server reverse proxy configured
- [ ] SSL certificate installed
- [ ] Domain DNS pointing to IONOS
- [ ] All features tested in production
- [ ] Backup strategy implemented

## Support Resources

- **IONOS Documentation**: https://www.ionos.com/help/
- **Node.js on IONOS**: Check IONOS knowledge base
- **PM2 Documentation**: https://pm2.keymetrics.io/

Your GKP Radio application is now ready for IONOS deployment!