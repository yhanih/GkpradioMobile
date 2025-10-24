# GKP Radio Web App - Design Handoff Guide

## 📱 → 🖥️ Mobile to Web Adaptation Instructions

This guide will help you recreate the GKP Radio mobile app experience for the web. The mobile app is built with React Native and Expo - you'll be adapting this to a modern web stack.

---

## 🎯 App Overview

**GKP Radio** is a Christian radio app for God Kingdom Principles Radio that provides:
- **Live 24/7 radio streaming** with real-time "now playing" data
- **Community engagement** through prayer requests and testimonies
- **On-demand content** including podcasts and video sermons
- **User authentication** for personalized experiences

**Target Audience**: Christian believers seeking spiritual content and community connection

**Core Experience**: Clean, modern, faith-focused design with emphasis on accessibility and ease of use

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors - Green (Kingdom/Growth theme) */
--primary-600: #047857;      /* Main brand color */
--primary-700: #059669;      /* Hover/active states */
--primary-50: rgba(4, 120, 87, 0.1);  /* Light backgrounds */

/* Accent Colors */
--red-500: #ef4444;          /* Live indicator, urgent CTAs */
--red-600: #dc2626;          /* Live indicator gradient end */

/* Neutrals */
--gray-900: #09090b;         /* Primary text */
--gray-600: #71717a;         /* Secondary text */
--gray-300: #d4d4d8;         /* Borders */
--gray-200: #e4e4e7;         /* Light borders */
--gray-50: #fafafa;          /* Background tints */

/* Semantic Colors */
--background: #ffffff;        /* Main background */
--surface: #ffffff;           /* Card backgrounds */
--error: #ef4444;
--success: #10b981;
```

### Typography

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 13px;
--text-base: 14px;
--text-md: 15px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System

```css
/* Consistent 4px base spacing */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

### Shadows

```css
/* Elevation system */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## 📐 Layout Principles

### Responsive Breakpoints

```css
/* Mobile-first approach */
--mobile: 320px - 768px;
--tablet: 768px - 1024px;
--desktop: 1024px+;
--max-width: 1440px;  /* Content container max width */
```

### Grid System
- Mobile: Single column layout
- Tablet: 2-column grid for cards
- Desktop: 3-4 column grid for cards, with sidebar navigation

### Navigation
- **Mobile**: Bottom tab navigation (current)
- **Web Adaptation**: 
  - Desktop: Left sidebar navigation
  - Mobile/Tablet: Top navigation bar with hamburger menu

---

## 🖼️ Screen Breakdown

### 1. Home Screen (`screens/HomeScreen.tsx`)

**Purpose**: Dashboard showing statistics and featured content

**Layout Structure**:
```
┌────────────────────────────┐
│ Welcome Header             │
│ "God Kingdom Principles"   │
├────────────────────────────┤
│ Stats Cards (3-column)     │
│ - Prayers                  │
│ - Testimonies              │
│ - Members                  │
├────────────────────────────┤
│ Featured Section           │
│ - Featured Prayer Request  │
│ - Featured Testimony       │
├────────────────────────────┤
│ Quick Actions (2-column)   │
│ - Submit Prayer            │
│ - Share Testimony          │
└────────────────────────────┘
```

**Key Components**:
- **Stat Cards**: White cards with gradient icon backgrounds
  - Icon: Green gradient circle (primary-600 → primary-700)
  - Value: Large bold number (text-3xl, font-bold)
  - Label: Gray text (text-sm, gray-600)
  - Spacing: 16px padding, 12px gap between cards

- **Featured Content Cards**: 
  - White background, subtle shadow
  - 16px padding
  - User info with avatar placeholder
  - Truncated text (3 lines max)
  - "View All" link in primary color

**Web Adaptation Notes**:
- Make stats cards into a 4-column grid on desktop
- Featured content should be side-by-side on tablet+
- Add hover states to all interactive elements
- Quick action buttons should expand on hover

---

### 2. Live Screen (`screens/LiveScreen.tsx`)

**Purpose**: Live radio streaming with schedule and platform links

**Layout Structure**:
```
┌────────────────────────────┐
│ LIVE NOW Banner (Red)      │
│ - Pulsing live indicator   │
│ - Current song/show        │
│ - "Listen Live" button     │
├────────────────────────────┤
│ Stats Row                  │
│ - Listeners count          │
│ - Broadcasting status      │
├────────────────────────────┤
│ Daily Schedule Cards       │
│ - Monday-Friday shows      │
│ - Weekend programming      │
├────────────────────────────┤
│ Listen Everywhere          │
│ - Platform icons grid      │
└────────────────────────────┘
```

**Key Components**:
- **Live Banner**: 
  - Red gradient background (red-500 → red-600)
  - White text
  - Pulsing white dot indicator (10px circle)
  - Centered content
  - Prominent "Listen Live" button (white bg, red text)

- **Schedule Cards**:
  - White background with subtle border
  - Day badge (gray-100 background, gray-900 text)
  - Show title (font-semibold, text-lg)
  - Time and host info (gray-600)
  - Optional "LIVE" tag (red gradient) when show is airing

**Web Adaptation Notes**:
- Live banner should be full-width hero section
- Schedule cards in 2-3 column grid
- Add hover states showing more show details
- Platform icons should link to actual streaming services
- Consider adding a persistent mini player at bottom

---

### 3. Community Screen (`screens/CommunityScreen.tsx`)

**Purpose**: Browse prayer requests and testimonies

**Layout Structure**:
```
┌────────────────────────────┐
│ Community Stats Header     │
├────────────────────────────┤
│ Tab Navigation             │
│ [Prayers] [Testimonies]    │
├────────────────────────────┤
│ Content Cards List         │
│ - Prayer Request Card      │
│ - Prayer Request Card      │
│ - Prayer Request Card      │
│   ...                      │
└────────────────────────────┘
```

**Key Components**:
- **Tab Navigation**:
  - Two tabs: "Prayer Requests" and "Testimonies"
  - Active tab: Green underline (primary-600), bold text
  - Inactive tab: Gray text, no underline
  - Smooth transition animation

- **Content Cards**:
  - White background, subtle shadow
  - 16px padding
  - User info row (avatar + name + time ago)
  - Title (font-semibold, text-md)
  - Description (text-sm, gray-600, truncated to 3 lines)
  - Action row: Like icon, comment icon with counts
  - Anonymous indicator when applicable

- **Stats Header**:
  - 3 stat boxes in a row
  - Green icons
  - Numbers + labels

**Web Adaptation Notes**:
- Cards should be max-width 800px on desktop (centered)
- Add infinite scroll or pagination
- Implement search/filter functionality
- Cards should expand on click to show full content
- Add modal or side panel for detailed view

---

### 4. Podcasts Screen (`screens/PodcastsScreen.tsx`)

**Purpose**: Browse and access podcast episodes

**Layout Structure**:
```
┌────────────────────────────┐
│ "Podcasts" Header          │
│ "Stream sermons..."        │
├────────────────────────────┤
│ Podcast Cards Grid         │
│ ┌──────┐ ┌──────┐         │
│ │Image │ │Image │         │
│ │Title │ │Title │         │
│ │Info  │ │Info  │         │
│ └──────┘ └──────┘         │
└────────────────────────────┘
```

**Key Components**:
- **Podcast Card**:
  - Thumbnail image (16:9 ratio, rounded corners)
  - Category badge (top-left overlay)
  - Title (font-semibold, 2 lines max)
  - Author name (text-sm, gray-600)
  - Duration + date (text-xs, gray-500)
  - Play button overlay on hover

**Web Adaptation Notes**:
- Grid: 1 column mobile, 2 tablet, 3-4 desktop
- Add audio player integration (consider Plyr or Howler.js)
- Implement playlist functionality
- Add download option for offline listening
- Show waveform visualization on hover

---

### 5. Video Screen (`screens/VideoScreen.tsx`)

**Purpose**: Browse and watch video content

**Layout Structure**:
```
┌────────────────────────────┐
│ "Videos" Header            │
│ Featured Video (large)     │
├────────────────────────────┤
│ Recent Videos Grid         │
│ ┌──────┐ ┌──────┐         │
│ │Thumb │ │Thumb │         │
│ │Title │ │Title │         │
│ └──────┘ └──────┘         │
└────────────────────────────┘
```

**Key Components**:
- **Video Card**:
  - Thumbnail (16:9 ratio)
  - Play icon overlay
  - Duration badge (bottom-right)
  - Title (2 lines max)
  - View count + upload date
  - Category tag

**Web Adaptation Notes**:
- Use HTML5 video player or YouTube/Vimeo embeds
- Grid: 1 column mobile, 2 tablet, 3 desktop
- Add theater mode and fullscreen
- Related videos sidebar on desktop
- Auto-play next video option

---

### 6. Authentication Screens (`screens/auth/`)

**LoginScreen.tsx** and **SignupScreen.tsx**

**Layout Structure**:
```
┌────────────────────────────┐
│        App Logo            │
│                            │
│    "Welcome Back" /        │
│    "Create Account"        │
│                            │
│  [Email Input]             │
│  [Password Input]          │
│  [Full Name] (signup only) │
│                            │
│  [Primary Button]          │
│                            │
│  Switch to Login/Signup    │
└────────────────────────────┘
```

**Key Components**:
- **Input Fields**:
  - Gray border (gray-300)
  - 12px border radius
  - 14px padding
  - Focus: Green border (primary-600)
  - Icon prefix (email, lock, user)

- **Primary Button**:
  - Green gradient (primary-600 → primary-700)
  - White text
  - Full width
  - 48px height
  - Subtle shadow
  - Disabled state: gray-400 background

**Web Adaptation Notes**:
- Center auth forms with max-width 400px
- Add social login options (Google, Facebook)
- Implement password strength indicator
- Add "Remember me" checkbox
- Email verification flow
- Password reset functionality

---

## 🔧 Reusable Components

### AudioPlayer (`components/AudioPlayer.tsx`)

**Mobile Version**: Fixed bottom bar with playback controls

**Web Adaptation**:
```
Desktop: Persistent player at bottom (Spotify-style)
Mobile: Collapsible mini player

Features to implement:
- Play/pause toggle
- Volume control
- Mute button
- Current track info with album art
- Live stream indicator
- Favorite/like button
- Stream quality selector
```

**Technical Implementation**:
- Use Web Audio API or Howler.js
- Handle HLS/DASH streams for radio
- Background playback support
- Media session API for system controls
- Buffer status indicator

---

## 💾 Data Structure

### Database Schema

The app uses **Supabase (PostgreSQL)** with the following tables:

#### `profiles`
```typescript
{
  id: UUID (auth.users reference)
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: timestamp
  updated_at: timestamp
}
```

#### `prayer_requests`
```typescript
{
  id: UUID
  user_id: UUID
  title: string
  description: string
  is_anonymous: boolean
  status: 'active' | 'answered' | 'archived'
  created_at: timestamp
  updated_at: timestamp
}
```

#### `testimonies`
```typescript
{
  id: UUID
  user_id: UUID
  title: string
  content: string
  is_anonymous: boolean
  is_featured: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### `podcasts`
```typescript
{
  id: UUID
  title: string
  description: string | null
  audio_url: string
  duration: number (seconds)
  thumbnail_url: string | null
  author: string | null
  category: string | null
  is_featured: boolean
  published_at: timestamp
  created_at: timestamp
}
```

#### `videos`
```typescript
{
  id: UUID
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration: number (seconds)
  category: string | null
  is_featured: boolean
  published_at: timestamp
  created_at: timestamp
}
```

#### `likes` (polymorphic)
```typescript
{
  id: UUID
  user_id: UUID
  likeable_type: 'prayer_request' | 'testimony' | 'podcast' | 'video'
  likeable_id: UUID
  created_at: timestamp
}
```

#### `comments`
```typescript
{
  id: UUID
  user_id: UUID
  commentable_type: 'prayer_request' | 'testimony'
  commentable_id: UUID
  content: string
  created_at: timestamp
  updated_at: timestamp
}
```

**See `supabase_schema.sql` for complete schema with RLS policies**

---

## 🔌 External Integrations

### AzuraCast Radio API

**Endpoint**: `http://74.208.102.89:8080/api/nowplaying/1`

**Returns**:
```typescript
{
  station: {
    id: number
    name: string
    description: string
    listen_url: string  // HLS stream URL
  }
  listeners: {
    current: number
    unique: number
    total: number
  }
  now_playing: {
    song: {
      title: string
      artist: string
      album: string
      art: string  // Album art URL
    }
    duration: number
    elapsed: number
    playlist: string
  }
  song_history: Array<{
    song: { /* same structure */ }
    played_at: number
  }>
}
```

**Polling**: Update every 10-15 seconds

---

## 🛠️ Recommended Web Stack

### Frontend Framework
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**

### Styling
- **Tailwind CSS** (matches mobile's NativeWind setup)
- **shadcn/ui** for component primitives
- **Framer Motion** for animations

### State Management
- **React Context** for auth (same as mobile)
- **TanStack Query (React Query)** for server state
- **Zustand** for client state (optional)

### Audio/Video
- **Howler.js** or **Plyr** for audio
- **Video.js** or **Plyr** for video
- **HLS.js** for live streaming

### Backend/Database
- **Supabase** (already configured)
  - Authentication
  - PostgreSQL database
  - Real-time subscriptions
  - Storage for media files

### Deployment
- **Vercel** or **Netlify** (for Next.js)
- **Cloudflare Pages** (alternative)

---

## 🎭 Animation & Interaction Patterns

### Transitions
```css
/* Smooth transitions for interactive elements */
transition: all 0.2s ease-in-out;

/* Page transitions */
transition: opacity 0.3s, transform 0.3s;
```

### Hover States
- **Cards**: Lift effect (translateY(-4px) + larger shadow)
- **Buttons**: Slight scale (scale: 1.02) + brightness increase
- **Links**: Color change to primary-700
- **Images**: Slight zoom (scale: 1.05)

### Loading States
- **Skeleton screens** for content loading
- **Spinner** for async actions
- **Progress bars** for media loading

### Micro-interactions
- **Like button**: Heart animation (scale + color change)
- **Play button**: Ripple effect
- **Form inputs**: Bounce on validation error
- **Live indicator**: Pulsing animation

---

## 📱 → 🖥️ Mobile-to-Web Adaptation Checklist

### Navigation
- [ ] Convert bottom tabs to sidebar (desktop)
- [ ] Add responsive hamburger menu (mobile/tablet)
- [ ] Implement breadcrumbs for deep pages
- [ ] Add keyboard navigation support

### Layout
- [ ] Implement responsive grid system
- [ ] Add max-width containers for readability
- [ ] Convert swipe gestures to click/hover
- [ ] Add pagination/infinite scroll

### Forms
- [ ] Replace native pickers with web-friendly dropdowns
- [ ] Add form validation with inline errors
- [ ] Implement accessible labels and ARIA
- [ ] Add keyboard shortcuts

### Media
- [ ] Replace React Native Image with Next.js Image
- [ ] Implement lazy loading for images/videos
- [ ] Add responsive image srcsets
- [ ] Convert audio player to web controls

### Performance
- [ ] Code splitting by route
- [ ] Lazy load below-the-fold content
- [ ] Optimize images (WebP, AVIF)
- [ ] Implement service worker for offline

### Accessibility
- [ ] Semantic HTML structure
- [ ] ARIA labels for screen readers
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast (WCAG AA minimum)

### SEO
- [ ] Meta tags for each page
- [ ] Open Graph tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generation
- [ ] robots.txt

---

## 🚀 Implementation Roadmap

### Phase 1: Core Setup (Week 1)
1. Set up Next.js project with TypeScript
2. Configure Tailwind CSS with design tokens
3. Set up Supabase client and authentication
4. Create base layout with navigation

### Phase 2: Authentication (Week 1)
1. Login/Signup pages
2. Protected routes
3. Session management
4. Password reset flow

### Phase 3: Core Features (Week 2-3)
1. Home dashboard with stats
2. Live streaming page with player
3. Community features (prayers + testimonies)
4. Podcasts library
5. Videos library

### Phase 4: Interactivity (Week 3-4)
1. Like/comment functionality
2. Submit prayer requests
3. Share testimonies
4. User profiles

### Phase 5: Polish (Week 4)
1. Animations and transitions
2. Error handling
3. Loading states
4. Responsive optimization
5. Accessibility audit
6. Performance optimization

---

## 📞 Support & Questions

**Database Schema**: See `supabase_schema.sql` in this folder
**Type Definitions**: See `types/database.types.ts`
**Component Examples**: Check `screens/` and `components/` folders

**Key Differences to Remember**:
- Mobile uses React Native components → Web uses HTML elements
- Mobile uses StyleSheet.create() → Web uses Tailwind classes
- Mobile uses react-navigation → Web uses Next.js routing
- Mobile uses expo-av → Web uses Howler.js or HTML5 audio

**Design Philosophy**:
- Clean, minimal, faith-focused
- Accessibility first
- Mobile-friendly interactions adapted to web
- Green = Kingdom/Growth, Red = Live/Urgent

---

## 🎨 Quick Reference: Component Styling Patterns

### Card Pattern
```tsx
// Mobile (React Native)
<View style={styles.card}>
  <Text style={styles.title}>Title</Text>
</View>

// Web (Tailwind)
<div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900">Title</h3>
</div>
```

### Button Pattern
```tsx
// Mobile
<Pressable style={styles.button}>
  <LinearGradient colors={['#047857', '#059669']}>
    <Text style={styles.buttonText}>Click Me</Text>
  </LinearGradient>
</Pressable>

// Web
<button className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all">
  Click Me
</button>
```

### Input Pattern
```tsx
// Mobile
<TextInput
  style={styles.input}
  placeholder="Email"
/>

// Web
<input
  type="email"
  placeholder="Email"
  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary-600 focus:ring-2 focus:ring-primary-50 transition-colors"
/>
```

---

**Good luck building the web version! This design system should help you maintain consistency between the mobile and web experiences while adapting to each platform's strengths.** 🚀
