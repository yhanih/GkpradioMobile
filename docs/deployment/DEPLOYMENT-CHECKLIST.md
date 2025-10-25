# GKP Radio - IONOS VPS Deployment Checklist

## Please Provide These Details for Deployment

### 1. VPS Access Information
```
VPS IP Address: _______________
SSH Username: _______________
SSH Password/Private Key: _______________
SSH Port (if not 22): _______________
```

### 2. Domain Configuration
```
Primary Domain: _______________
Additional Domains (if any): _______________
DNS Management: [ ] I'll handle DNS myself  [ ] Please configure DNS in IONOS
```

### 3. Database Setup
```
Database Choice: 
[ ] Install PostgreSQL locally on VPS (recommended)
[ ] Connect to external PostgreSQL instance

If external PostgreSQL:
Database Host: _______________
Database Name: _______________
Database Username: _______________
Database Password: _______________
Database Port: _______________
```

### 4. SSL Certificate
```
SSL Choice:
[ ] Let's Encrypt (free, automatic renewal) - RECOMMENDED
[ ] Custom certificate (provide .crt and .key files)

If custom certificate:
- Upload .crt file path: _______________
- Upload .key file path: _______________
```

### 5. VPS Current Status
```
Operating System: _______________
Already Installed Software:
[ ] Node.js (version: _______)
[ ] Nginx
[ ] PM2
[ ] Docker
[ ] PostgreSQL
[ ] UFW Firewall
[ ] Other: _______________
```

### 6. Environment Variables (Secure Information)
```
DATABASE_URL=postgresql://username:password@host:port/database_name
SESSION_SECRET=your_secure_random_session_secret_here
JWT_SECRET=your_secure_random_jwt_secret_here
AZURACAST_BASE_URL=http://74.208.102.89 (or your AzuraCast URL)

Additional variables (if any):
_______________
```

### 7. Deployment Preferences
```
Process Manager:
[ ] PM2 (recommended for Node.js)
[ ] Systemd
[ ] Docker

Reverse Proxy:
[ ] Nginx (recommended)
[ ] Apache
[ ] Caddy

Application Port: [ ] 3000 (default)  [ ] Other: _____

Backup Strategy:
[ ] Daily database backups
[ ] Weekly full backups
[ ] Custom schedule: _______________
```

## Once You Provide These Details, I Will:

1. **Connect to your VPS** via SSH
2. **Install required software** (Node.js, PostgreSQL, Nginx, PM2)
3. **Configure the database** and run migrations
4. **Deploy your application** with proper environment setup
5. **Set up SSL certificate** (Let's Encrypt or custom)
6. **Configure Nginx** as reverse proxy
7. **Set up PM2** for process management
8. **Configure firewall** for security
9. **Test the deployment** and provide access URLs
10. **Set up monitoring** and automatic restarts

## Security Notes
- All sensitive information will be handled securely
- SSH keys and passwords will not be logged
- Database credentials will be properly secured
- Firewall will be configured to allow only necessary ports

## Expected Timeline
- Initial setup: 30-60 minutes
- SSL configuration: 10-15 minutes
- Testing and optimization: 15-30 minutes
- Total deployment time: 1-2 hours

## Post-Deployment
You'll receive:
- Application URL(s)
- Admin access credentials
- Monitoring dashboard access
- Backup and maintenance instructions