# VPS Deployment Environment Variables Guide

This guide lists all environment variables needed for successful VPS deployment of your GKP Radio application.

## 🚨 Critical Variables (Required for Basic Operation)

### Database
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/gkp_radio
```
- **Purpose**: PostgreSQL connection string
- **VPS Example**: `postgresql://gkp_user:secure_password@localhost:5432/gkp_radio`

### Security
```bash
JWT_SECRET=your-super-secure-jwt-secret-key-here
```
- **Purpose**: JWT token signing (authentication)
- **VPS Requirement**: Generate a strong random string (32+ characters)

### AzuraCast Integration
```bash
AZURACAST_BASE_URL=http://74.208.102.89:8080
AZURACAST_STATION_ID=1
```
- **Purpose**: Connect to your existing AzuraCast server
- **VPS Note**: Keep current values if using existing AzuraCast instance

## 🎵 Streaming Configuration (New for VPS)

### Server-Side Streaming URLs
```bash
# RTMP Server Configuration
RTMP_BASE_URL=rtmp://your-vps-domain.com:1935
RTMP_EDGE_URL=rtmp://your-vps-domain.com:1935

# HLS Video Streaming
HLS_BASE_URL=http://your-vps-domain.com:8000

# MediaMTX WebRTC Configuration
MEDIAMTX_BASE_URL=http://your-vps-domain.com:8889
MEDIAMTX_API_URL=http://your-vps-domain.com:9997
```

### Frontend Configuration (VITE_ prefixed)
```bash
# VPS Host Configuration
VITE_VPS_HOST=your-vps-domain.com

# HLS Streaming for Frontend
VITE_HLS_BASE_URL=http://your-vps-domain.com:8000

# AzuraCast Frontend Integration
VITE_AZURACAST_BASE_URL=http://74.208.102.89:8080
VITE_AZURACAST_STATION_ID=1

# Owncast Configuration
VITE_OWNCAST_SERVER_URL=https://your-vps-domain.com:8080
VITE_OWNCAST_RTMP_URL=rtmp://your-vps-domain.com:1935/live
VITE_OWNCAST_STREAM_KEY=gkpAdmin2025@
```

## 💳 Payment Integration (Optional)
```bash
STRIPE_SECRET_KEY=sk_live_or_test_key_here
PAYMENTS_WEBHOOK_SECRET=whsec_webhook_secret_here
```
- **Purpose**: Stripe payment processing
- **VPS Note**: Use live keys for production

## 🛡️ Spam Protection (Optional)
```bash
ANTI_SPAM_ENABLED=true
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
```
- **Purpose**: Cloudflare Turnstile bot protection
- **VPS Note**: Set to `false` to disable spam protection

## 🔧 System Configuration
```bash
NODE_ENV=production
```
- **Purpose**: Enable production optimizations
- **VPS Requirement**: Always set to `production` on VPS

## 📋 Complete VPS .env File Template

Create `/your-app-directory/.env` with these values:

```bash
# === CRITICAL CONFIGURATION ===
DATABASE_URL=postgresql://gkp_user:YOUR_SECURE_PASSWORD@localhost:5432/gkp_radio
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_32_CHARACTERS_MINIMUM
NODE_ENV=production

# === VPS STREAMING CONFIGURATION ===
# Replace 'your-vps-domain.com' with your actual domain or IP
RTMP_BASE_URL=rtmp://your-vps-domain.com:1935
RTMP_EDGE_URL=rtmp://your-vps-domain.com:1935
HLS_BASE_URL=http://your-vps-domain.com:8000
MEDIAMTX_BASE_URL=http://your-vps-domain.com:8889
MEDIAMTX_API_URL=http://your-vps-domain.com:9997

# === FRONTEND VPS CONFIGURATION ===
VITE_VPS_HOST=your-vps-domain.com
VITE_HLS_BASE_URL=http://your-vps-domain.com:8000

# === AZURACAST INTEGRATION ===
AZURACAST_BASE_URL=http://74.208.102.89:8080
AZURACAST_STATION_ID=1
VITE_AZURACAST_BASE_URL=http://74.208.102.89:8080
VITE_AZURACAST_STATION_ID=1

# === OWNCAST INTEGRATION ===
VITE_OWNCAST_SERVER_URL=https://your-vps-domain.com:8080
VITE_OWNCAST_RTMP_URL=rtmp://your-vps-domain.com:1935/live
VITE_OWNCAST_STREAM_KEY=gkpAdmin2025@

# === OPTIONAL FEATURES ===
# Stripe Payments (uncomment if using)
# STRIPE_SECRET_KEY=sk_live_your_stripe_key
# PAYMENTS_WEBHOOK_SECRET=whsec_your_webhook_secret

# Spam Protection (uncomment if using Cloudflare Turnstile)
# ANTI_SPAM_ENABLED=true
# TURNSTILE_SECRET_KEY=your_cloudflare_secret
# VITE_TURNSTILE_SITE_KEY=your_cloudflare_site_key
```

## 🚀 VPS Deployment Steps

1. **Copy environment file to your VPS:**
   ```bash
   scp .env user@your-vps:/path/to/your/app/
   ```

2. **Set proper permissions:**
   ```bash
   chmod 600 .env
   ```

3. **Update domain references:**
   - Replace all instances of `your-vps-domain.com` with your actual domain
   - If using IP address, replace with your VPS IP (e.g., `123.456.789.0`)

4. **Restart your application:**
   ```bash
   pm2 restart gkp-radio
   # or
   npm run start
   ```

## ✅ Verification Commands

Test your environment variables after deployment:

```bash
# Check if all variables are loaded
node -e "console.log(process.env.RTMP_BASE_URL)"

# Test database connection
npm run db:push

# Check streaming endpoints
curl http://your-vps-domain.com:8000/live
```

## 🔍 Troubleshooting

**Common Issues:**
- ❌ **RTMP not working**: Check `RTMP_BASE_URL` points to your VPS
- ❌ **Frontend shows localhost**: Verify `VITE_VPS_HOST` is set correctly  
- ❌ **Database connection failed**: Confirm `DATABASE_URL` credentials
- ❌ **Stream URLs wrong in UI**: Check both server and frontend environment variables

**Debug Commands:**
```bash
# View current environment (be careful with secrets!)
env | grep -E "(RTMP|HLS|VPS|AZURA)"

# Test streaming endpoints
netstat -tlnp | grep -E "(1935|8000|8889)"
```

---

**⚠️ Security Warning**: Never commit `.env` files to version control. Keep secrets secure and use different values for development and production.