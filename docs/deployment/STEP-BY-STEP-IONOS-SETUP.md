# 🚀 STEP-BY-STEP: GitHub to IONOS Auto-Deploy Setup

## ✅ STEP 1: COMPLETED ✅
Your Replit project is already connected to GitHub at:
**https://github.com/yhanih/GKP-radio**

---

## 🎯 STEP 2: ENABLE IONOS GIT DEPLOY

### A. Log into IONOS Control Panel
1. Go to [ionos.com](https://ionos.com) and log into your account
2. Navigate to your hosting package dashboard

### B. Find Git Deploy Feature
Look for one of these in your IONOS control panel:
- **"Git Deploy"** 
- **"Continuous Deployment"**
- **"GitHub Integration"**
- **"Repository Deploy"**
- Under **"Developer Tools"** section

### C. Connect Your GitHub Repository
1. Click on the Git Deploy feature
2. Choose **"Connect GitHub Repository"**
3. Authorize IONOS to access your GitHub account
4. Select your repository: **`yhanih/GKP-radio`**
5. Choose branch: **`main`** (or `master`)

### D. Configure Build Settings
Set these commands in IONOS:

**Install Command:**
```bash
npm install --production
```

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
pm2 restart gkp-radio || pm2 start ecosystem.config.js
```

**Deploy Directory:** 
```
/
```
(root of your repository)

---

## 🎯 STEP 3: TEST AUTOMATIC DEPLOYMENT

### A. Make a Test Change in Replit
1. Open any file in Replit (like `README.md`)
2. Add a test line: `<!-- Test deployment -->`
3. In Replit's Git panel:
   - Add commit message: "Test auto deploy"
   - Click **Commit**
   - Click **Push**

### B. Monitor IONOS Deployment
1. Go back to IONOS control panel
2. Check the deployment status/logs
3. Should see "Deployment successful" within 2-5 minutes

### C. Verify on Your Website
Visit your IONOS domain - the change should appear automatically!

---

## 🎯 ALTERNATIVE: GITHUB ACTIONS SETUP

If IONOS doesn't have Git Deploy, use GitHub Actions instead:

### A. Add Secrets to GitHub
1. Go to your GitHub repo: **https://github.com/yhanih/GKP-radio**
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `IONOS_HOST` | your-server.ionos.com | Your IONOS server hostname |
| `IONOS_USERNAME` | your_ssh_user | Your SSH username |
| `IONOS_SSH_KEY` | [private key] | Your SSH private key |
| `IONOS_PATH` | /path/to/domain | Path to your domain folder |

### B. GitHub Actions is Already Set Up!
The workflow file is already in your repo at `.github/workflows/deploy.yml`

### C. Test GitHub Actions
1. Make the same test change in Replit
2. Commit and push
3. Go to GitHub → **Actions** tab
4. Watch the deployment run automatically

---

## 🎯 STEP 4: PRODUCTION ENVIRONMENT SETUP

### A. Create Environment File on IONOS
SSH into your IONOS server and create `.env.production`:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/gkp_radio
SESSION_SECRET=your_secure_session_secret_here
JWT_SECRET=your_secure_jwt_secret_here
```

### B. Set Up Database (if using IONOS database)
1. IONOS Control Panel → **Databases**
2. Create new PostgreSQL database
3. Copy connection details to your `.env.production`

---

## 🎯 WORKFLOW SUMMARY

Once set up, your workflow will be:

```
1. Edit code in Replit
2. Commit changes in Replit Git panel
3. Push to GitHub
4. IONOS automatically pulls and deploys
5. Your website updates live!
```

---

## 🛠️ TROUBLESHOOTING

### If IONOS doesn't have Git Deploy:
- Use GitHub Actions method above
- Or use the manual deploy script: `./deploy-to-ionos.sh`

### If builds fail:
- Check Node.js version on IONOS (should be 18+)
- Verify all environment variables are set
- Check IONOS deployment logs

### If app doesn't start:
- Ensure PM2 is installed: `npm install -g pm2`
- Check if port 3000 is available
- Verify `.env.production` file exists

---

## 🎉 NEXT STEPS

1. **Try IONOS Git Deploy first** (easiest option)
2. **Fall back to GitHub Actions** if Git Deploy isn't available
3. **Test with a small change** to verify auto-deployment works
4. **Set up database and environment variables**

Your GKP Radio platform will then be fully automated from Replit to IONOS!