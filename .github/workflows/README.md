# GitHub Actions Deployment Setup

## Required GitHub Secrets

Before the deployment workflow can run, you need to configure the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each of these:

### Core Deployment Secrets

- **`VPS_HOST`**: Your VPS IP address or domain name
  - Example: `123.456.78.90` or `yourdomain.com`

- **`VPS_USER`**: The deployment user on your VPS
  - Example: `deploy`
  - This user must have:
    - SSH access to the VPS
    - Write permissions to `/srv/gkpradio/`
    - Sudo permissions to restart the systemd service

- **`SSH_PRIVATE_KEY`**: The private SSH key for authentication
  - This is the private key that corresponds to the public key in `~/.ssh/authorized_keys` on your VPS
  - Include the entire key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

### Required Frontend Environment Secrets

These secrets are needed for the Vite build process to bundle frontend environment variables:

#### Essential (Required)
- **`VITE_SUPABASE_URL`**: Your Supabase project URL
  - Example: `https://your-project.supabase.co`
  
- **`VITE_SUPABASE_ANON_KEY`**: Your Supabase anonymous/public key
  - This key is safe to expose as it's meant for client-side use

- **`VITE_AZURACAST_BASE_URL`**: AzuraCast server URL for radio streaming
  - Example: `http://74.208.102.89:8080`

- **`VITE_AZURACAST_STATION_ID`**: AzuraCast station identifier
  - Example: `1`

#### Optional (Based on Features Used)
- **`VITE_VPS_HOST`**: Your domain for various services
  - Example: `godkingdomprinciplesradio.com`

- **`VITE_HLS_BASE_URL`**: HLS streaming base URL
  - Example: `http://yourdomain.com:8000`

- **`VITE_OWNCAST_SERVER_URL`**: Owncast server URL (if using video streaming)
  - Example: `https://yourdomain.com:8080`

- **`VITE_OWNCAST_RTMP_URL`**: RTMP URL for Owncast
  - Example: `rtmp://yourdomain.com:1935/live`

- **`VITE_OWNCAST_STREAM_KEY`**: Owncast streaming key

- **`VITE_STRIPE_PUBLIC_KEY`**: Stripe publishable key (if using payments)
  - Example: `pk_test_...` or `pk_live_...`

- **`VITE_ANTI_SPAM_ENABLED`**: Enable anti-spam features
  - Example: `true` or `false`

- **`VITE_TURNSTILE_SITE_KEY`**: Cloudflare Turnstile site key (if using anti-spam)

## VPS Prerequisites

Before the workflow can deploy successfully, ensure your VPS has:

1. **Directory structure created**:
   ```bash
   sudo mkdir -p /srv/gkpradio
   sudo chown -R deploy:deploy /srv/gkpradio
   ```

2. **Systemd service configured** (`/etc/systemd/system/gkpradio.service`):
   ```ini
   [Unit]
   Description=GKP Radio Application
   After=network.target

   [Service]
   Type=simple
   User=deploy
   WorkingDirectory=/srv/gkpradio
   ExecStart=/usr/bin/node /srv/gkpradio/dist/index.js
   Restart=on-failure
   EnvironmentFile=/srv/gkpradio/.env

   [Install]
   WantedBy=multi-user.target
   ```

3. **Sudoers configuration** for the deploy user:
   ```bash
   # Add to /etc/sudoers.d/deploy
   deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart gkpradio
   deploy ALL=(ALL) NOPASSWD: /bin/systemctl status gkpradio
   ```

4. **Environment file** (`/srv/gkpradio/.env`):
   - Copy `.env.example` to `.env` on your VPS
   - Fill in all production values

## Deployment Process

When you push to the `main` branch:

1. GitHub Actions will checkout your code
2. Install dependencies with `npm install`
3. Build the application with `npm run build`
4. Use rsync to copy the `dist/` folder to `/srv/gkpradio/dist/`
5. Restart the systemd service with `sudo systemctl restart gkpradio`
6. Check the service status to verify deployment

## Manual Deployment Trigger

You can also manually trigger the deployment from the GitHub Actions tab in your repository.

## Troubleshooting

If deployment fails:

1. Check the GitHub Actions logs for specific error messages
2. Ensure all secrets are correctly configured
3. Verify SSH access: `ssh deploy@your-vps-ip`
4. Check VPS permissions: `ls -la /srv/gkpradio/`
5. Verify systemd service: `sudo systemctl status gkpradio`