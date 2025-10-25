# GitHub Secrets Setup for Auto-Deploy

## Quick Setup Guide

### 1. Go to Your GitHub Repository
Visit: https://github.com/yhanih/GKP-radio

### 2. Navigate to Secrets
- Click **Settings** tab
- Click **Secrets and variables** → **Actions**
- Click **New repository secret**

### 3. Add These 4 Secrets

| Secret Name | What to Put | Example |
|-------------|-------------|---------|
| `IONOS_HOST` | Your IONOS server hostname | `your-server.ionos.com` |
| `IONOS_USERNAME` | Your SSH username | `your-username` |
| `IONOS_SSH_KEY` | Your SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `IONOS_PATH` | Path to your domain folder | `/home/your-user/your-domain.com` |

### 4. How to Get These Values

**IONOS_HOST**: 
- Found in IONOS control panel under "Server Details" or "SSH Access"
- Usually looks like: `your-server.ionos.com` or an IP address

**IONOS_USERNAME**: 
- Your SSH login username from IONOS
- Usually your IONOS account username or `root`

**IONOS_SSH_KEY**: 
- Your SSH private key (the content of your `id_rsa` file)
- If you don't have one, generate it in your IONOS server:
  ```bash
  ssh-keygen -t rsa -b 4096
  cat ~/.ssh/id_rsa
  ```

**IONOS_PATH**: 
- Full path to where your website files should go
- Usually: `/var/www/your-domain.com` or `/home/user/public_html`

### 5. Test the Setup
Once secrets are added:
1. Make any small change in Replit
2. Commit and push via Replit's Git interface  
3. Go to GitHub → Actions tab
4. Watch the deployment run automatically
5. Check your IONOS website for the update

### Troubleshooting
- If deployment fails, check the GitHub Actions logs
- Verify SSH access works manually first
- Ensure Node.js 18+ is installed on your IONOS server
- Make sure PM2 is installed: `npm install -g pm2`