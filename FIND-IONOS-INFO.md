# How to Find Your IONOS Information

## Step 1: Log into IONOS
1. Go to [ionos.com](https://ionos.com)
2. Click "Login" (top right)
3. Enter your IONOS account credentials

## Step 2: Find Your Hosting Package
1. Look for "My Products" or "Hosting" in your dashboard
2. Click on your hosting package/website
3. This will take you to your hosting control panel

## Step 3: Find Server Information

### Option A: Look for "SSH Access" or "Server Details"
- Check sidebar for "SSH", "Terminal", or "Server Access"
- This will show your hostname and username

### Option B: Look for "FTP Settings" or "Connection Details" 
- Often under "Website Tools" or "File Manager"
- Shows server hostname (can be used for SSH too)

### Option C: Look for "Technical Details"
- Sometimes under "Settings" or "Overview"
- Lists server IP address and connection info

## What We're Looking For:

**Server Hostname** - Usually looks like:
- `s123456.ionos.com`
- `hosting.ionos.com` 
- Or an IP address like `185.123.45.67`

**Username** - Usually:
- Your IONOS account email (without @domain.com)
- A username IONOS gave you
- Sometimes just your account number

**Path** - Where files go, usually:
- `/var/www/html`
- `/home/yourusername/public_html`
- `/htdocs`

## Can't Find It?
If you can't find this information, we can:
1. Use IONOS support chat (usually in bottom right of control panel)
2. Try a different approach like FTP upload
3. Contact IONOS support directly

## Next Steps
Once you find any of this information, just tell me what you found and we'll use it to set up automatic deployment!