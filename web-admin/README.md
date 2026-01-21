# GKP Radio Web Admin Dashboard

A professional administrative panel for managing the GKP Radio ecosystem.

## Features
- **Dashboard**: Real-time stats from Supabase.
- **Live Events**: Instantly update radio stream URLs and go live.
- **Media Library**: Manage podcasts (Episodes) and videos.
- **Moderation**: Review flagged content and manage community standards.
- **Auth**: Secure login with admin role-based access control.

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Local environment variables

### 2. Setup
```bash
cd web-admin
npm install
```

### 3. Environment Variables
Create a `.env` file in the `web-admin` root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Deployment
Build the production bundle and host it on Vercel, Netlify, or any static hosting provider:
```bash
npm run build
```

## Security Note
This dashboard uses **Supabase Auth** and enforces an `admin` role check on the `users` table. Only users with `role = 'admin'` can see the dashboard content.
