# GKP Radio Server Deployment Guide

## Database Permissions Fix

The PostgreSQL permissions error you're encountering can be resolved with these steps:

### 1. Fix PostgreSQL User Permissions

Connect to PostgreSQL as superuser and run these commands:

```bash
sudo -u postgres psql
```

```sql
-- Drop and recreate the user with proper permissions
DROP USER IF EXISTS gkpuser;
CREATE USER gkpuser WITH PASSWORD 'your_secure_password';

-- Grant superuser privileges (needed for schema operations)
ALTER USER gkpuser CREATEDB;
ALTER USER gkpuser WITH SUPERUSER;

-- Or alternatively, grant specific permissions:
GRANT ALL PRIVILEGES ON DATABASE gkpradio TO gkpuser;
ALTER DATABASE gkpradio OWNER TO gkpuser;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gkpuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gkpuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gkpuser;

\q
```

### 2. Alternative: Use postgres user for initial setup

If the above doesn't work, use the postgres superuser for the initial migration:

```bash
# Update your .env file temporarily
DATABASE_URL="postgresql://postgres:password@localhost:5432/gkpradio"

# Run the migration
cd /srv/gkpradio && npx drizzle-kit push --config=drizzle.config.ts

# Then switch back to gkpuser for the application
DATABASE_URL="postgresql://gkpuser:password@localhost:5432/gkpradio"
```

## Server Code Update Steps

### 1. Upload the Updated Code

Upload these key files to your server with the AzuraCast port 8080 fix:

1. **server/streaming-routes.ts** - Contains the port 8080 fix
2. **client/src/contexts/AudioContext.tsx** - Improved error handling
3. **package.json** and **package-lock.json** - Dependencies

### 2. Update Server Files

```bash
cd /srv/gkpradio

# Backup current code
cp -r . ../gkpradio-backup-$(date +%Y%m%d)

# Update the streaming routes with port 8080
# Replace the AZURACAST_BASE_URL line in server/streaming-routes.ts:
# const AZURACAST_BASE_URL = 'http://74.208.102.89:8080';
```

### 3. Install Dependencies and Run

```bash
# Install any new dependencies
npm install

# Build the project
npm run build

# Run database migrations (after fixing permissions above)
npx drizzle-kit push --config=drizzle.config.ts

# Start the application
npm start
# OR use PM2 for production
pm2 start ecosystem.config.js
pm2 save
```

### 4. Verify the Fix

Test that the radio player is working:

```bash
# Test AzuraCast API connection
curl http://localhost:5000/api/stream/status

# Should return real song data instead of fallback
```

## Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL=postgresql://gkpuser:password@localhost:5432/gkpradio
NODE_ENV=production
PORT=5000

# AzuraCast will auto-connect to http://74.208.102.89:8080
```

## Troubleshooting

- If you still get permissions errors, try running the migration as postgres user first
- Check that PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `sudo -u postgres psql -l | grep gkpradio`
- Test connection: `psql $DATABASE_URL -c "SELECT version();"`