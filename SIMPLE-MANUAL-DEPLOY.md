# Simple Manual Deployment to IONOS

## Your Files Are Ready
Your GKP Radio application is built and ready in the `dist` folder.

## Manual Upload Steps

### Option 1: Use FileZilla (Free FTP Client)
1. Download FileZilla from: https://filezilla-project.org/
2. Open FileZilla
3. Connect with these details:
   - Host: `access974924.webspace-data.io`
   - Username: `u95712626`
   - Password: [Your IONOS password]
   - Port: 21 (FTP) or 22 (SFTP)
4. Navigate to `/plugins` folder on the server
5. Upload all files from your `dist` folder

### Option 2: Use IONOS File Manager
1. Log into your IONOS control panel
2. Go to "File Manager" 
3. Navigate to `/plugins` directory
4. Upload the `dist` folder contents

### What to Upload
Upload everything from the `dist` folder:
- `index.js` (your server)
- `public/` folder (your website files)
- All other files in `dist/`

## Result
Your GKP Radio will be live at your IONOS domain once uploaded!