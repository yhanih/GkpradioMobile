# Step 1: Add GitHub Secrets for Auto-Deploy

## What We're Doing
Setting up 4 pieces of information in GitHub so it can automatically deploy to your IONOS server.

## Go to Your GitHub Repository
1. Open: https://github.com/yhanih/GKP-radio
2. Click the **Settings** tab (top of the page)
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**
5. Click **New repository secret** button

## Add These 4 Secrets One by One

### Secret #1: IONOS_HOST
- **Name**: `IONOS_HOST`
- **Value**: Your IONOS server hostname or IP address
- Example: `s123456.ionos.com` or `185.123.45.67`

### Secret #2: IONOS_USERNAME  
- **Name**: `IONOS_USERNAME`
- **Value**: Your SSH username for IONOS
- Usually: your IONOS account username or `root`

### Secret #3: IONOS_PATH
- **Name**: `IONOS_PATH` 
- **Value**: Full path to your website folder on IONOS
- Example: `/var/www/html` or `/home/username/public_html`

### Secret #4: IONOS_SSH_KEY
- **Name**: `IONOS_SSH_KEY`
- **Value**: Your SSH private key (the long text starting with `-----BEGIN`)

## Ready to Start?
Do you have your IONOS login details handy? We'll need:
- Your IONOS server hostname/IP
- Your SSH username 
- Your SSH private key (or we can generate one)
- The path where your website files should go

Let me know when you're ready to add the first secret, and I'll guide you through each one!