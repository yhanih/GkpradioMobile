# IONOS Upload Checklist - GKP Radio

## What to Upload to Your IONOS Server

### 1. Essential Application Files
```
📁 Your IONOS Web Directory/
├── 📁 dist/                    # Built application (REQUIRED)
│   ├── index.js               # Main server file
│   └── 📁 public/             # Frontend assets
├── 📁 client/                 # Frontend source code
├── 📁 server/                 # Backend source code
├── 📁 shared/                 # Shared utilities
├── 📁 hls/                    # Video streaming files
├── 📄 package.json            # Dependencies list
├── 📄 package-lock.json       # Locked dependency versions
├── 📄 .env.production         # Your environment config
├── 📄 ecosystem.config.js     # PM2 configuration
├── 📄 drizzle.config.ts       # Database configuration
├── 📄 tailwind.config.ts      # Styling configuration
├── 📄 vite.config.ts          # Build configuration
└── 📄 tsconfig.json           # TypeScript config
```

### 2. Configure Your Environment
Copy `.env.production.example` to `.env.production` and update these values:

**REQUIRED SETTINGS:**
- `DATABASE_URL` - Get from IONOS database section
- `SESSION_SECRET` - Generate a secure random string
- `JWT_SECRET` - Generate another secure random string

**OPTIONAL SETTINGS:**
- `AZURACAST_BASE_URL` - If using live radio streaming
- `AZURACAST_API_KEY` - Your streaming server API key

### 3. IONOS Server Commands (via SSH)
```bash
# Navigate to your web directory
cd /path/to/your/domain

# Install dependencies
npm install --production

# Install PM2 globally
npm install -g pm2

# Start your application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Database Setup Options

**Option A: IONOS Managed Database**
1. IONOS Control Panel → Databases
2. Create PostgreSQL database
3. Copy connection string to `.env.production`

**Option B: Keep External Database**
Your current setup will work with IONOS - no changes needed.

### 5. Web Server Configuration

**For Apache (.htaccess in web root):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**For Nginx:**
IONOS will typically handle this automatically.

## Quick Start Commands

1. **Upload files** via IONOS File Manager or FTP
2. **SSH into your server** (if supported by your IONOS plan)
3. **Run these commands:**
   ```bash
   npm install --production
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```
4. **Visit your domain** - Your app should be running!

## Troubleshooting

- **Port Issues**: Your app runs on port 3000, IONOS handles the routing
- **Node.js Version**: Ensure IONOS supports Node.js 18+ 
- **Memory Limits**: Shared hosting has limits, consider VPS if needed
- **Database**: Test connection with `npm run db:push`

## Important Notes

✅ Your application is already built and ready for production
✅ All dependencies are properly configured
✅ The app will automatically use SessionStorage if database isn't available
✅ All your features (videos, streaming, community) will work on IONOS

Your GKP Radio platform is production-ready for IONOS deployment!