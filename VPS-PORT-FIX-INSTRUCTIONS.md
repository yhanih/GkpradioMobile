# VPS Port Fix Instructions

## Problem Identified
Your GKP Radio app is failing to start on VPS because port 8000 is already in use by another service (likely Owncast). The built application didn't pick up the new port configuration.

## Quick Fix Solution

### Step 1: Upload Fix Script
Upload the `fix-vps-ports.sh` script to your VPS:

```bash
# From Replit, upload to your VPS
scp fix-vps-ports.sh root@your-vps-ip:/root/
```

### Step 2: Run Fix Script on VPS
SSH into your VPS and run:

```bash
ssh root@your-vps-ip
chmod +x /root/fix-vps-ports.sh
sudo /root/fix-vps-ports.sh
```

## What the Fix Does

1. **Stops the failing service**
2. **Checks port conflicts** (finds what's using 8000)
3. **Creates proper environment** with:
   - `PORT=3001` (main app)
   - `RTMP_HTTP_PORT=8001` (streaming)
4. **Rebuilds application** with new ports
5. **Updates systemd service** configuration
6. **Restarts with correct ports**

## Port Allocation After Fix

- **Port 3001**: Main GKP Radio application
- **Port 8001**: RTMP HTTP streaming (instead of 8000)
- **Port 1935**: RTMP protocol (unchanged)
- **Port 8000**: Left free for Owncast or other services

## Expected Results

After running the fix:
- ✅ No more "EADDRINUSE" errors
- ✅ App accessible at `http://your-vps-ip:3001`
- ✅ All services running without conflicts
- ✅ Streaming functionality working

## Verification Commands

After the fix, verify everything is working:

```bash
# Check service status
sudo systemctl status gkpradio

# Check port usage
sudo netstat -tlnp | grep -E ':(3001|8001|1935|8000)'

# View live logs
sudo journalctl -u gkpradio -f

# Test application
curl http://localhost:3001/api/stream/status
```

## Manual Alternative

If you prefer to fix manually:

1. **Stop service**: `sudo systemctl stop gkpradio`
2. **Edit environment**: `nano /srv/gkpradio/.env.production`
3. **Add**: `RTMP_HTTP_PORT=8001`
4. **Rebuild**: `npm run build`
5. **Start service**: `sudo systemctl start gkpradio`

## Root Cause

The deployment used the old build which had hardcoded port 8000. This fix ensures:
- Environment variables are properly loaded
- New port configuration takes effect
- No conflicts with existing services

Your VPS will run exactly like the Replit version after this fix!