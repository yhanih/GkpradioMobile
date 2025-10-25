# Automatic Deployment from Replit to IONOS

## Overview
This guide shows you how to automatically deploy your GKP Radio website from Replit to your IONOS server every time you make changes.

## Method 1: GitHub Integration + IONOS Git Deploy (Recommended)

### Step 1: Connect Replit to GitHub
1. In Replit, go to the Version Control tab (left sidebar)
2. Click "Create a Git Repo" or "Connect to GitHub"
3. Create a new repository or connect to existing one
4. Commit and push your current code

### Step 2: Set up IONOS Git Deploy
1. Log into your IONOS account
2. Go to your hosting package
3. Look for "Git Deploy" or "Continuous Deployment" in your control panel
4. Connect your GitHub repository
5. Set the branch to deploy from (usually `main` or `master`)
6. Configure the build commands:
   ```bash
   npm install
   npm run build
   pm2 restart gkp-radio || pm2 start ecosystem.config.js
   ```

### Step 3: Workflow
- Edit code in Replit
- Commit changes via Replit's Git interface
- Push to GitHub
- IONOS automatically deploys the changes

## Method 2: GitHub Actions + SSH Deploy

### Step 1: Set up GitHub Repository (same as Method 1)

### Step 2: Create GitHub Action
Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to IONOS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to IONOS
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.IONOS_HOST }}
        username: ${{ secrets.IONOS_USERNAME }}
        key: ${{ secrets.IONOS_SSH_KEY }}
        script: |
          cd /path/to/your/domain
          git pull origin main
          npm install --production
          npm run build
          pm2 restart gkp-radio || pm2 start ecosystem.config.js
```

### Step 3: Configure GitHub Secrets
In your GitHub repository:
1. Go to Settings → Secrets and Variables → Actions
2. Add these secrets:
   - `IONOS_HOST`: Your IONOS server IP/hostname
   - `IONOS_USERNAME`: Your SSH username
   - `IONOS_SSH_KEY`: Your private SSH key

## Method 3: Webhook-Based Deployment

### Step 1: Create Deploy Script on IONOS
Create `deploy.php` on your IONOS server:

```php
<?php
// Webhook endpoint for automatic deployment
$secret = 'your-webhook-secret';
$payload = file_get_contents('php://input');
$signature = hash_hmac('sha256', $payload, $secret);

if (hash_equals('sha256=' . $signature, $_SERVER['HTTP_X_HUB_SIGNATURE_256'])) {
    // Pull latest changes and deploy
    exec('cd /path/to/your/domain && git pull origin main 2>&1', $output);
    exec('npm install --production 2>&1', $output);
    exec('npm run build 2>&1', $output);
    exec('pm2 restart gkp-radio 2>&1', $output);
    
    echo "Deployment successful\n";
    print_r($output);
} else {
    http_response_code(403);
    echo "Unauthorized";
}
?>
```

### Step 2: Configure GitHub Webhook
1. In your GitHub repository, go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/deploy.php`
3. Set content type to `application/json`
4. Set secret to match your PHP script
5. Select "Just the push event"

## Method 4: Simple FTP Sync (Basic Option)

### Create Deploy Script
Create `deploy.sh` in Replit:

```bash
#!/bin/bash
# Simple FTP deployment script

echo "Building application..."
npm run build

echo "Uploading to IONOS..."
# Using lftp for FTP upload
lftp -c "
set ssl:verify-certificate no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
mirror -R --delete --verbose dist/ /path/to/your/domain/dist/;
put package.json /path/to/your/domain/;
quit
"

echo "Deployment complete!"
```

Add to your Replit secrets:
- `FTP_HOST`: Your IONOS FTP server
- `FTP_USER`: Your FTP username  
- `FTP_PASS`: Your FTP password

## Environment Variables Setup

### For IONOS Server
Create `.env.production` on your IONOS server:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your_ionos_database_url
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret
```

### For Replit (Development)
Keep your current `.env` for development work.

## Recommended Setup Process

1. **Choose Method 1 (GitHub + IONOS Git Deploy)** - Most reliable
2. **Set up GitHub repository** and connect Replit
3. **Configure IONOS Git Deploy** in your hosting control panel
4. **Test the workflow:**
   - Make a small change in Replit
   - Commit and push via Replit's Git interface
   - Verify automatic deployment on IONOS

## Benefits of This Setup

- **Keep editing in Replit** - Full development environment
- **Automatic deployment** - No manual file uploads
- **Version control** - Track all changes via Git
- **Rollback capability** - Easy to revert if needed
- **Professional workflow** - Industry standard approach

## Troubleshooting

### Common Issues:
- **IONOS doesn't support Git Deploy**: Use Method 2 (GitHub Actions)
- **No SSH access**: Use Method 4 (FTP sync)
- **Build failures**: Check Node.js version compatibility on IONOS
- **Permission errors**: Ensure correct file permissions on IONOS

### Testing Deployment:
1. Make a small change (like updating a text string)
2. Commit in Replit
3. Check if change appears on your IONOS site
4. Monitor deployment logs for errors

This setup gives you the best of both worlds - Replit's excellent development environment with your preferred IONOS hosting!