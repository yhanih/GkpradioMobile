# IONOS Deployment Guide for GKP Radio

## Step 1: Identify Your IONOS Plan

Log into your IONOS account to check which plan you have:

### **Shared Hosting Plans** (Most Common)
- Essential ($4/month)
- Starter ($6/month) 
- Plus ($8/month)
- Ultimate ($12/month)

### **VPS Plans** (Less Common but More Powerful)
- VPS S ($2/month)
- VPS M ($6/month)
- VPS L ($12/month)

## Step 2: Choose Your Deployment Method

---

## Option A: Shared Hosting (Static Site Only)

**✅ Use This If:** You have Essential/Starter/Plus/Ultimate plan
**⚠️ Limitations:** No database features, community discussions, or user profiles

### Files to Upload:
Upload everything from `deployment-packages/static-only/` to your IONOS web directory:
- All files in static-only folder
- Upload via File Manager or FTP

### What Works:
- ✅ Live radio streaming 
- ✅ Podcast episodes (with static data)
- ✅ Video content
- ✅ Team pages
- ✅ Basic navigation

### What Won't Work:
- ❌ User login/registration
- ❌ Community discussions  
- ❌ Dynamic comments
- ❌ Database features

---

## Option B: Full Application (VPS Required)

**✅ Use This If:** You have VPS S/M/L or Dedicated Server
**✅ Benefits:** All features working including database

### Files to Upload:
Upload everything from `deployment-packages/full-app/` to your VPS

### Setup Steps:
1. **Install Node.js** (version 18 or higher)
2. **Install PostgreSQL** database
3. **Upload files** to your VPS
4. **Install dependencies:**
   ```bash
   npm install --production
   ```
5. **Configure environment variables:**
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=production
   ```
6. **Start the application:**
   ```bash
   node index.js
   ```

### All Features Working:
- ✅ Live radio streaming
- ✅ User accounts and profiles
- ✅ Community discussions
- ✅ Podcast library with comments
- ✅ Video content
- ✅ Real-time features

---

## Step 3: Domain Setup

1. **Point your domain** to IONOS hosting
2. **Upload files** to the web directory (usually `public_html` or similar)
3. **Test the site** at your domain

---

## External Services (Always Work)

These will continue working regardless of hosting choice:
- **Radio Stream:** AzuraCast server (http://74.208.102.89)
- **Live Audio:** Automatic metadata updates
- **Styling:** All CSS and design elements

---

## Need Help?

After checking your IONOS plan, let me know:
1. What plan type you have (Shared or VPS)
2. Any specific features you want to prioritize
3. If you need help with database setup (VPS users)

Your website is ready to go live!