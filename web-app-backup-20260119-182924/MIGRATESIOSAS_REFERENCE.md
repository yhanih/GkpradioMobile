# Migratesiosas Reference Guide
## Feature Comparison & Redesign Reference

This document outlines all features, components, and pages from the `Migratesiosas` folder that can be used as reference for redesigning the current `web-app`.

---

## 📋 **PAGES COMPARISON**

### ✅ **Pages in Migratesiosas** (Reference)
| Page | Purpose | Status in Current Web-App |
|------|---------|---------------------------|
| `Index.tsx` | Home page with Hero, Featured Episodes, Community Preview | ✅ Exists as `Home.tsx` (needs redesign) |
| `Community.tsx` | Full community/discussion page | ✅ Exists (may need updates) |
| `Podcasts.tsx` | Podcast/episode listings | ✅ Exists |
| `Videos.tsx` | Video content page | ✅ Exists |
| `Live.tsx` | Live streaming page | ✅ Exists |
| `Profile.tsx` | User profile page | ✅ Exists |
| `About.tsx` | About page | ❌ **MISSING** |
| `Broadcast.tsx` | Broadcasting dashboard/studio | ❌ **MISSING** |
| `Connect.tsx` | Contact/connect page | ❌ **MISSING** |
| `DiscussionNew.tsx` | Create new discussion | ❌ **MISSING** |
| `DonationPage.tsx` | Donation/payment page | ❌ **MISSING** |
| `DonateSuccess.tsx` | Donation success confirmation | ❌ **MISSING** |
| `Merch.tsx` | Merchandise store page | ❌ **MISSING** |
| `Notifications.tsx` | Notifications center | ❌ **MISSING** |
| `NotificationSettings.tsx` | Notification preferences | ❌ **MISSING** |
| `Privacy.tsx` | Privacy policy | ❌ **MISSING** |
| `Promotions.tsx` | Promotions/advertising page | ❌ **MISSING** |
| `SponsorAdvertise.tsx` | Sponsor advertising page | ❌ **MISSING** |
| `SponsorProfile.tsx` | Sponsor profile page | ❌ **MISSING** |
| `Team.tsx` | Team members page | ❌ **MISSING** |
| `Terms.tsx` | Terms of service | ❌ **MISSING** |
| `NotFound.tsx` | 404 error page | ❌ **MISSING** |

---

## 🧩 **COMPONENTS COMPARISON**

### **Core Layout Components**

#### ✅ **In Migratesiosas** (Reference)
- `Header.tsx` - Full-featured header with:
  - Logo
  - Navigation menu
  - Search component
  - User dropdown menu
  - Notification bell
  - Donate button
  - Merch button
  - Auth modal integration

- `Footer.tsx` - Footer with links, social media, etc.

#### ⚠️ **In Current Web-App**
- `Navbar.tsx` - Basic navbar
- `FloatingNavbar.tsx` - Floating navigation
- `Footer.tsx` - Basic footer
- `Layout.tsx` - Layout wrapper

**🔧 Redesign Needed:** Header needs upgrade to match Migratesiosas features

---

### **Home Page Components**

#### ✅ **In Migratesiosas** (Reference)
- `HeroSection.tsx` - **KEY COMPONENT**
  - Live show detection (time-based)
  - Current show display
  - Play button integration
  - Schedule integration
  - Beautiful hero layout

- `FeaturedEpisodes.tsx` - Shows schedule carousel
- `ScheduleCarousel.tsx` - Carousel of scheduled shows
- `ScheduleSlideshow.tsx` - Slideshow of schedule
- `CommunityPreview.tsx` - Preview of community content
- `PlatformLinks.tsx` - Links to other platforms
- `SponsorCarousel.tsx` - Sponsor advertisements carousel

#### ⚠️ **In Current Web-App**
- `Home.tsx` - Has hero section but simpler
- Missing schedule carousel
- Missing community preview component
- Missing sponsor carousel

**🔧 Redesign Needed:** Home page needs these components

---

### **Audio/Streaming Components**

#### ✅ **In Migratesiosas** (Reference)
- `AudioPlayer.tsx` - Global audio player
- `AzuraCastPlayer.tsx` - AzuraCast integration
- `AzuraCastBroadcastDashboard.tsx` - Broadcast dashboard
- `BroadcastDashboard.tsx` - General broadcast dashboard
- `BroadcastingDashboard.tsx` - Broadcasting controls
- `LiveStreamPlayer.tsx` - Live stream player
- `LiveStreamViewer.tsx` - Live stream viewer
- `OwncastPlayer.tsx` - Owncast integration
- `WebRTCPlayer.tsx` - WebRTC player
- `WebRTCStreamer.tsx` - WebRTC streaming
- `DirectWebRTCPlayer.tsx` - Direct WebRTC
- `CustomIframePlayer.tsx` - Custom iframe player
- `SimpleCustomPlayer.tsx` - Simple player
- `StyledVideoPlayer.tsx` - Styled video player

#### ⚠️ **In Current Web-App**
- `GlobalAudioPlayer.tsx` - Basic audio player
- Missing many streaming integrations

**🔧 Redesign Needed:** Audio/streaming components need expansion

---

### **Community Components**

#### ✅ **In Migratesiosas** (Reference)
- `CommunityPreview.tsx` - Community preview on home
- `CreateDiscussionButton.tsx` - Button to create discussion
- `CreateDiscussionModal.tsx` - Modal for creating discussions
- `TaggingInput.tsx` - Tag input component
- `UserSearchAutocomplete.tsx` - User search autocomplete

#### ⚠️ **In Current Web-App**
- `CommunityComposer.tsx` - Basic composer
- Missing discussion creation modal
- Missing user search autocomplete

**🔧 Redesign Needed:** Community features need enhancement

---

### **UI Components**

#### ✅ **In Migratesiosas** (Reference)
- **Full shadcn/ui component library** (50+ components)
  - accordion, alert, avatar, badge, button, card, carousel
  - dialog, dropdown-menu, form, input, select, tabs
  - toast, tooltip, skeleton, and many more

#### ⚠️ **In Current Web-App**
- Basic UI components (Button, Card, Badge, Loading)
- Missing most shadcn/ui components

**🔧 Redesign Needed:** Need to add shadcn/ui component library

---

### **Special Feature Components**

#### ✅ **In Migratesiosas** (Reference)
- `DonationModal.tsx` - Donation modal
- `StripeCheckout.tsx` - Stripe payment integration
- `NotificationBell.tsx` - Notification bell component
- `InAppNotification.tsx` - In-app notifications
- `SearchComponent.tsx` - Global search
- `Button3D.tsx` - 3D button effect
- `ErrorBoundary.tsx` - Error boundary
- `FallbackUI.tsx` - Fallback UI
- `VPSStatusCheck.tsx` - VPS status checker
- `StreamingSetup.tsx` - Streaming setup guide
- `StreamingStatusWidget.tsx` - Streaming status widget
- `StreamTest.tsx` - Stream testing component

#### ⚠️ **In Current Web-App**
- Missing donation system
- Missing notification system
- Missing search component
- Missing error boundaries
- Missing streaming setup components

**🔧 Redesign Needed:** Many features missing

---

### **Skeleton/Loading Components**

#### ✅ **In Migratesiosas** (Reference)
- `skeletons/HeroSkeleton.tsx`
- `skeletons/PodcastSkeleton.tsx`
- `skeletons/ScheduleSkeleton.tsx`
- `skeletons/EventsSkeleton.tsx`
- `skeletons/ChatSkeleton.tsx`

#### ⚠️ **In Current Web-App**
- `Loading.tsx` - Basic loading component
- Missing skeleton loaders

**🔧 Redesign Needed:** Add skeleton loaders for better UX

---

## 🎨 **KEY FEATURES TO REDESIGN**

### 1. **Home Page (Index.tsx)**
**Current Structure:**
```tsx
- Header
- HeroSection (with live show detection)
- CommunityPreview
- PlatformLinks
- SponsorCarousel
- Footer
- AudioPlayer (global)
```

**Key Features:**
- ✅ Live show detection based on timezone
- ✅ Schedule integration
- ✅ Community preview
- ✅ Sponsor carousel
- ✅ Platform links

---

### 2. **Header Component**
**Features:**
- ✅ Fixed header with backdrop blur
- ✅ Logo
- ✅ Navigation menu
- ✅ Search component
- ✅ User dropdown menu
- ✅ Notification bell
- ✅ Donate button
- ✅ Merch button
- ✅ Mobile responsive menu

---

### 3. **Audio Player**
**Features:**
- ✅ Global audio player
- ✅ Play/pause controls
- ✅ Now playing display
- ✅ Volume control
- ✅ Progress bar
- ✅ Persistent across pages

---

### 4. **Schedule System**
**Components:**
- `ScheduleCarousel.tsx` - Carousel view
- `ScheduleSlideshow.tsx` - Slideshow view
- Schedule data with time-based detection
- Current show highlighting

**Schedule Data Structure:**
```typescript
{
  title: string,
  time: string,
  host: string,
  startHour: number,
  endHour: number
}
```

---

### 5. **Donation System**
**Components:**
- `DonationModal.tsx` - Quick donation modal
- `DonationPage.tsx` - Full donation page
- `DonateSuccess.tsx` - Success page
- `StripeCheckout.tsx` - Stripe integration

**Features:**
- Predefined amounts
- Custom amount input
- Donor information form
- Stripe payment processing

---

### 6. **Notification System**
**Components:**
- `NotificationBell.tsx` - Notification bell icon
- `Notifications.tsx` - Notifications page
- `NotificationSettings.tsx` - Settings page
- `InAppNotification.tsx` - In-app notifications

---

### 7. **Broadcasting System**
**Components:**
- `Broadcast.tsx` - Broadcast dashboard page
- `BroadcastDashboard.tsx` - Dashboard component
- `AzuraCastBroadcastDashboard.tsx` - AzuraCast integration
- `StreamingSetup.tsx` - Setup guide
- `StreamingStatusWidget.tsx` - Status widget

**Features:**
- OBS settings display
- RTMP configuration
- Stream status monitoring
- VPS status check

---

### 8. **Search System**
**Component:**
- `SearchComponent.tsx` - Global search

**Features:**
- Search across content
- Autocomplete
- Quick results

---

## 📦 **TECHNICAL STACK DIFFERENCES**

### **Migratesiosas Stack:**
- React 18.3.1
- Wouter (lightweight router)
- TanStack Query (React Query)
- Radix UI components
- Tailwind CSS
- shadcn/ui component library
- Express backend (full-stack)
- Drizzle ORM
- Stripe integration
- Supabase integration

### **Current Web-App Stack:**
- React 19.2.0
- React Router DOM
- Supabase client
- Framer Motion
- Basic CSS
- No backend (frontend-only)

---

## 🎯 **REDESIGN PRIORITIES**

### **High Priority (Core Features)**
1. ✅ Redesign Home page with HeroSection
2. ✅ Add ScheduleCarousel component
3. ✅ Upgrade Header component
4. ✅ Add CommunityPreview component
5. ✅ Add SponsorCarousel component
6. ✅ Improve AudioPlayer component

### **Medium Priority (Important Features)**
7. ✅ Add Donation system
8. ✅ Add Notification system
9. ✅ Add Search component
10. ✅ Add shadcn/ui component library
11. ✅ Add skeleton loaders

### **Low Priority (Nice to Have)**
12. ✅ Add Broadcasting dashboard
13. ✅ Add Merch page
14. ✅ Add About/Team/Privacy/Terms pages
15. ✅ Add Error boundaries
16. ✅ Add Streaming integrations

---

## 📝 **IMPLEMENTATION NOTES**

### **Component Migration Strategy:**
1. **Copy components** from `Migratesiosas/client/src/components/`
2. **Adapt routing** from Wouter to React Router
3. **Update imports** to match current project structure
4. **Install dependencies** (shadcn/ui, Radix UI, etc.)
5. **Update Supabase queries** if needed
6. **Test and refine** UI/UX

### **Dependencies to Add:**
```json
{
  "@radix-ui/react-*": "latest",
  "@tanstack/react-query": "^5.60.5",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.453.0",
  "@stripe/stripe-js": "^7.8.0",
  "@stripe/react-stripe-js": "^3.9.0"
}
```

### **File Structure to Create:**
```
web-app/src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Header, Footer
│   ├── audio/       # Audio players
│   ├── community/   # Community components
│   ├── schedule/    # Schedule components
│   └── skeletons/   # Loading skeletons
├── pages/
│   ├── Home.tsx     # Redesigned
│   ├── Donation.tsx # New
│   ├── Notifications.tsx # New
│   └── ...
└── hooks/
    └── use-toast.ts # Toast notifications
```

---

## 🔍 **KEY COMPONENTS TO STUDY**

### **1. HeroSection.tsx**
- Live show detection logic
- Timezone handling
- Schedule integration
- Audio player integration

### **2. Header.tsx**
- Navigation structure
- User menu
- Search integration
- Modal management

### **3. ScheduleCarousel.tsx**
- Schedule display
- Carousel implementation
- Time-based highlighting

### **4. AudioPlayer.tsx**
- Global audio state
- Playback controls
- Now playing display

---

## ✅ **NEXT STEPS**

1. **Review this document** and prioritize features
2. **Start with Home page redesign** (HeroSection + ScheduleCarousel)
3. **Upgrade Header component** with all features
4. **Add missing pages** one by one
5. **Install shadcn/ui** component library
6. **Test and iterate**

---

**Last Updated:** $(date)
**Reference Source:** `web-app/Migratesiosas/`
