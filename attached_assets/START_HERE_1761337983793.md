# 🚀 Web Agent: Start Here!

## Your Mission

You're building the **web version of GKP Radio**, a Christian radio streaming app. The mobile app is already built (React Native/Expo), and you need to recreate the same experience for web browsers.

---

## ✅ Quick Checklist

1. ✅ **Read** `DESIGN_GUIDE.md` - Complete design system and implementation guide
2. ✅ **Review** `COLOR_REFERENCE.md` - All colors with hex codes  
3. ✅ **Study** `SCREENS_OVERVIEW.md` - Quick reference for each screen
4. ✅ **Examine** `screens/` folder - See actual mobile components
5. ✅ **Check** `supabase_schema.sql` - Database structure

---

## 🎯 What You're Building

A responsive web app with:

### Core Features
- ✅ **Live 24/7 radio streaming** with real-time "now playing" data
- ✅ **User authentication** (login/signup with Supabase)
- ✅ **Home dashboard** with stats and featured content
- ✅ **Community hub** for prayer requests and testimonies
- ✅ **Podcasts library** with audio playback
- ✅ **Videos library** with video player
- ✅ **Persistent audio player** for live radio

### Backend (Already Set Up!)
- **Supabase** for database, auth, and real-time features
- **AzuraCast** for live radio stream and metadata
- All tables and RLS policies already created (see `supabase_schema.sql`)

---

## 🛠️ Recommended Tech Stack

```
Framework: Next.js 14+ (App Router) + TypeScript
Styling: Tailwind CSS (matches mobile's NativeWind)
UI Library: shadcn/ui
Database: Supabase (connection already configured)
Audio: Howler.js or Plyr
Video: Video.js or Plyr  
State: React Query + React Context
Deployment: Vercel
```

---

## 🎨 Design Token Summary

```css
/* Primary Colors */
--primary-green: #047857
--primary-green-hover: #059669
--accent-red: #ef4444 (live indicators)

/* Text */
--text-primary: #09090b
--text-secondary: #71717a

/* Spacing */
4px base unit (space-4 = 16px)

/* Borders */
Radius: 12px standard, 20px for buttons/cards
```

See `COLOR_REFERENCE.md` for complete palette.

---

## 📱 → 🖥️ Key Adaptations

### Navigation
- **Mobile**: Bottom tab bar → **Web**: Left sidebar (desktop) + top nav (mobile)

### Interactions  
- **Mobile**: Swipe gestures → **Web**: Click/hover
- **Mobile**: Pull-to-refresh → **Web**: Auto-refresh or refresh button

### Layout
- **Mobile**: Single column → **Web**: Responsive grid (1/2/3/4 columns)
- **Mobile**: Full screen → **Web**: Max-width containers (800px-1440px)

### Audio Player
- **Mobile**: Fixed bottom bar → **Web**: Spotify-style persistent player with volume controls

---

## 📂 Folder Structure to Create

```
web-app/
├── app/                       # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Sidebar + AudioPlayer
│   │   ├── page.tsx           # Home
│   │   ├── live/page.tsx
│   │   ├── community/page.tsx
│   │   ├── podcasts/page.tsx
│   │   └── videos/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── AudioPlayer.tsx
│   ├── Sidebar.tsx
│   └── [other components]
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── azuracast.ts           # AzuraCast API
│   └── utils.ts
├── types/
│   └── database.types.ts      # Copy from design-handoff/types/
└── app/globals.css            # Tailwind + custom styles
```

---

## 🚀 Implementation Steps

### Phase 1: Setup (Day 1)
```bash
# Create Next.js app
npx create-next-app@latest gkp-radio-web --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install howler @types/howler
npx shadcn-ui@latest init

# Set up environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AZURACAST_BASE_URL=http://74.208.102.89:8080
```

### Phase 2: Core Setup (Day 1-2)
1. Configure Tailwind with design tokens (copy from `COLOR_REFERENCE.md`)
2. Set up Supabase client (`lib/supabase.ts`)
3. Create AuthContext for authentication
4. Set up React Query provider
5. Build base layout with sidebar navigation

### Phase 3: Authentication (Day 2)
1. Login page (`/login`)
2. Signup page (`/signup`)
3. Protected routes
4. Session management
5. Password reset flow

### Phase 4: Core Pages (Day 3-5)
1. **Home Dashboard** - Stats + featured content
2. **Live Radio** - Hero banner + player + schedule  
3. **Community** - Prayers/testimonies with tabs
4. **Podcasts** - Grid with audio player
5. **Videos** - Grid with video player

### Phase 5: Audio Player (Day 4-5)
1. Create persistent AudioPlayer component
2. Integrate with AzuraCast API
3. Add play/pause, volume, mute controls
4. Poll for "now playing" updates (every 10-15s)
5. Handle stream buffering/errors

### Phase 6: Polish (Day 6-7)
1. Add animations (Framer Motion)
2. Implement loading states
3. Error handling
4. Empty states
5. Responsive design testing
6. Accessibility audit
7. Performance optimization

---

## 🔌 Backend Integration

### Supabase Connection

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### AzuraCast API

```typescript
// lib/azuracast.ts
const AZURACAST_URL = 'http://74.208.102.89:8080'

export async function fetchNowPlaying() {
  const res = await fetch(`${AZURACAST_URL}/api/nowplaying/1`)
  return res.json()
}
```

### Authentication Example

```typescript
// app/(auth)/login/page.tsx
const { error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

### Data Fetching Example

```typescript
// Fetch prayer requests
const { data: prayers } = await supabase
  .from('prayer_requests')
  .select('*, profiles(*)')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10)
```

---

## 🎨 Component Examples

### Card Component (Tailwind)

```tsx
// Mobile equivalent → Web Tailwind
<div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900">Title</h3>
  <p className="text-sm text-gray-600 mt-2">Description</p>
</div>
```

### Button Component

```tsx
<button className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
  Click Me
</button>
```

### Input Component

```tsx
<input
  type="email"
  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary-600 focus:ring-2 focus:ring-primary-50 transition-colors"
  placeholder="Email"
/>
```

---

## 🐛 Common Pitfalls to Avoid

❌ **Don't** use inline styles - Use Tailwind classes
❌ **Don't** forget mobile responsiveness - Mobile-first approach
❌ **Don't** hardcode colors - Use design tokens
❌ **Don't** skip accessibility - ARIA labels, keyboard nav
❌ **Don't** ignore loading states - Users need feedback
❌ **Don't** forget error handling - Things fail, handle gracefully

✅ **Do** use design tokens consistently
✅ **Do** implement proper loading states
✅ **Do** add hover effects to interactive elements
✅ **Do** make forms accessible with proper labels
✅ **Do** optimize images (next/image)
✅ **Do** test on multiple screen sizes

---

## 📊 Screen Priority Order

Build in this order for fastest MVP:

1. **Authentication** (login/signup) - Users need this first
2. **Home Dashboard** - Landing page with stats
3. **Live Radio** - Core feature!
4. **Audio Player** - Critical for radio streaming
5. **Community** - High engagement feature
6. **Podcasts** - Additional content
7. **Videos** - Additional content

---

## 🎯 Success Criteria

Your web app should:

✅ Look and feel like the mobile app (same colors, fonts, spacing)
✅ Be fully responsive (mobile, tablet, desktop)
✅ Connect to the same Supabase backend
✅ Stream live radio with real-time "now playing" data
✅ Support user authentication and protected routes
✅ Display community prayers and testimonies
✅ Play podcasts and videos
✅ Be accessible (WCAG AA minimum)
✅ Perform well (Lighthouse score 90+)

---

## 📚 Documentation Files

- **DESIGN_GUIDE.md** - Complete design system (30+ pages)
- **COLOR_REFERENCE.md** - All colors with usage guidelines  
- **SCREENS_OVERVIEW.md** - Screen-by-screen breakdown
- **supabase_schema.sql** - Database schema
- **screens/** - Mobile component examples
- **components/** - Reusable component examples
- **types/** - TypeScript definitions

---

## 💡 Pro Tips

1. **Reuse patterns** - The mobile screens have good structure, adapt it
2. **Start simple** - Get basic layouts working, add polish later
3. **Use shadcn/ui** - Saves time on component primitives
4. **Test responsively** - Use Chrome DevTools device emulator
5. **Ask for help** - Reference the design guide when stuck

---

## 🎨 Design Philosophy

- **Clean & Minimal** - Let content shine
- **Faith-Focused** - Green = Kingdom/Growth, Red = Live/Urgent
- **Accessible** - Everyone should be able to use it
- **Fast** - Performance matters for user experience
- **Consistent** - Use design tokens everywhere

---

## 🚢 Ready to Ship?

Before going live:

- [ ] All screens implemented and tested
- [ ] Authentication working (login, signup, logout)
- [ ] Audio player streams correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading and error states everywhere
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Forms validated properly
- [ ] SEO meta tags added
- [ ] Performance optimized
- [ ] Deployed to Vercel

---

**You've got everything you need! Build something amazing! 🚀**

Questions? Refer back to the `DESIGN_GUIDE.md` for detailed explanations.
