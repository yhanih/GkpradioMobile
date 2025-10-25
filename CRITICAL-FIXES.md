# Critical Fixes for Your Server

## 1. Database Permission Fix

Run this in your server terminal:

```bash
cd /srv/gkpradio
sudo -u postgres psql
```

Then in PostgreSQL:
```sql
ALTER USER gkpuser WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE gkpradio TO gkpuser;
ALTER DATABASE gkpradio OWNER TO gkpuser;
\q
```

## 2. Update streaming-routes.ts File

Replace line 13 in `server/streaming-routes.ts`:

**CHANGE FROM:**
```javascript
const AZURACAST_BASE_URL = 'http://74.208.102.89';
```

**CHANGE TO:**
```javascript
const AZURACAST_BASE_URL = 'http://74.208.102.89:8080';
```

Also update line 21 in the same file:

**CHANGE FROM:**
```javascript
const streamUrl = 'http://74.208.102.89/listen/gkp_radio/radio.mp3';
```

**CHANGE TO:**
```javascript
const streamUrl = 'http://74.208.102.89:8080/listen/gkp_radio/radio.mp3';
```

## 3. Test the Fix

After making these changes:

```bash
cd /srv/gkpradio
npm run build
npx drizzle-kit push --config=drizzle.config.ts
npm restart  # or pm2 restart all

# Test the connection
curl http://localhost:5000/api/stream/status
```

You should see real song data instead of fallback messages.

## 4. What This Fixes

- Connects to your AzuraCast server on the correct port (8080)
- Displays real-time song information on your website
- Eliminates the "Service Temporarily Unavailable" messages
- Makes your radio player fully functional

The radio player will now show current songs like "kutless - king of my heart" instead of error messages.