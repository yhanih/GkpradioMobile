# Screens Overview - Quick Reference

Quick breakdown of each screen's purpose and key features.

## 🏠 HomeScreen.tsx

**Route**: `/` or `/home`

**Purpose**: Dashboard showing app stats and featured content

**Key Features**:
- Welcome header with app branding
- 3 stat cards showing:
  - Total active prayer requests
  - Total testimonies shared
  - Community member count
- Featured prayer request card
- Featured testimony card
- Quick action buttons to submit prayers/testimonies
- Pull-to-refresh functionality
- Loading states with skeleton screens
- Error states with retry button

**Data Requirements**:
- Fetch counts from: `prayer_requests`, `testimonies` tables
- Fetch featured items: `is_featured = true`
- Real-time updates using Supabase subscriptions

**Web Adaptations**:
- Convert 3-column mobile grid to 4-column desktop
- Side-by-side featured content on tablets+
- Add hover effects to all cards
- Implement auto-refresh instead of pull-to-refresh

---

## 📻 LiveScreen.tsx

**Route**: `/live`

**Purpose**: Live radio streaming interface with schedule

**Key Features**:
- Prominent "LIVE NOW" banner with:
  - Pulsing live indicator
  - Current song/show name
  - Current artist/host
  - "Listen Live" CTA button
- Listener statistics display
- Weekly schedule cards showing:
  - Day of week
  - Show name
  - Time slot
  - Host names
  - "LIVE" tag when show is currently airing
- Streaming platform links (Spotify, Apple, etc.)
- Integration with AudioPlayer component
- Auto-updating "now playing" data (polls every 15 seconds)

**Data Requirements**:
- AzuraCast API: `/api/nowplaying/1` endpoint
- Returns: current song, artist, album art, listener count
- Schedule data (currently hardcoded, could move to database)

**Web Adaptations**:
- Full-width hero banner for "LIVE NOW"
- Larger audio player controls on desktop
- Schedule in 2-3 column grid
- Clickable platform icons linking to actual streams
- Persistent mini-player at bottom of page

---

## 👥 CommunityScreen.tsx

**Route**: `/community`

**Purpose**: Browse and interact with prayers and testimonies

**Key Features**:
- Community stats header (prayers, testimonies, users count)
- Tab navigation between "Prayer Requests" and "Testimonies"
- List of content cards with:
  - User avatar (or anonymous indicator)
  - User name and timestamp
  - Title and description (truncated)
  - Like and comment counts
  - Action buttons (like, comment, share)
- Pull-to-refresh
- Empty states when no content
- Error states with retry
- Loading skeletons

**Data Requirements**:
- Fetch from: `prayer_requests` (status = 'active')
- Fetch from: `testimonies`
- Join with: `profiles` for user data
- Aggregate: `likes` and `comments` counts
- Real-time subscriptions for new content

**Web Adaptations**:
- Max-width content container (800px) centered
- Infinite scroll or pagination
- Search and filter functionality
- Click card to expand in modal or side panel
- Add "Submit Prayer" and "Share Testimony" buttons in header
- Comment section inline or in modal

---

## 🎙️ PodcastsScreen.tsx

**Route**: `/podcasts`

**Purpose**: Browse and play podcast episodes

**Key Features**:
- Page header with title and subtitle
- Grid of podcast cards showing:
  - Thumbnail image (16:9)
  - Category badge
  - Episode title
  - Author name
  - Duration and publish date
- Click to play inline or navigate to detail page
- Pull-to-refresh
- Empty state when no podcasts
- Error handling with retry

**Data Requirements**:
- Fetch from: `podcasts` table
- Order by: `published_at DESC`
- Filter by: `category` (optional)
- Featured podcasts: `is_featured = true`

**Web Adaptations**:
- Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)
- Hover to show play button overlay
- Integrate audio player (Howler.js recommended)
- Add playlist functionality
- Download option for episodes
- Waveform visualization on hover
- Categories filter sidebar/dropdown

---

## 📺 VideoScreen.tsx

**Route**: `/videos`

**Purpose**: Browse and watch video content

**Key Features**:
- Page header
- Featured video section (large card at top)
- Grid of video cards showing:
  - Thumbnail (16:9)
  - Duration badge (bottom-right overlay)
  - Play icon overlay
  - Video title
  - View count (if tracked)
  - Category tag
  - Upload date
- Pull-to-refresh
- Empty state messaging
- Error handling

**Data Requirements**:
- Fetch from: `videos` table
- Order by: `published_at DESC`
- Featured video: `is_featured = true LIMIT 1`
- Video URLs (YouTube embeds or direct URLs)

**Web Adaptations**:
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Click to open video player (in-page or modal)
- Related videos sidebar on desktop
- Theater mode and fullscreen options
- Auto-play next video (optional)
- Comments section below video
- Categories navigation

---

## 🔐 LoginScreen.tsx

**Route**: `/login`

**Purpose**: User authentication

**Key Features**:
- App logo/branding
- "Welcome Back" heading
- Email input field
- Password input field
- "Login" button
- "Forgot password?" link
- "Don't have an account? Sign up" link
- Loading state during authentication
- Error messages (inline or alert)
- Form validation

**Data Requirements**:
- Supabase auth: `signInWithPassword()`
- Session management via AuthContext
- Redirect to home after successful login

**Web Adaptations**:
- Centered form (max-width 400px)
- Add social login buttons (Google, Facebook)
- Remember me checkbox
- Email verification notice
- Better error messaging (inline below fields)
- Keyboard shortcuts (Enter to submit)
- Password visibility toggle

---

## ✍️ SignupScreen.tsx

**Route**: `/signup`

**Purpose**: New user registration

**Key Features**:
- App logo/branding
- "Create Account" heading
- Full name input
- Email input
- Password input
- Confirm password input (web only)
- "Sign Up" button
- "Already have an account? Login" link
- Terms of service acceptance checkbox
- Loading state
- Form validation
- Success message with email verification notice

**Data Requirements**:
- Supabase auth: `signUp()`
- Create profile in `profiles` table
- Send verification email
- Redirect to login or verification page

**Web Adaptations**:
- Centered form (max-width 400px)
- Password strength indicator
- Real-time validation feedback
- Social signup options
- reCAPTCHA for spam prevention
- Multi-step form (optional: step 1 = email/password, step 2 = profile info)
- Email availability check on blur

---

## 🎵 AudioPlayer Component

**Location**: Bottom of screen (fixed position)

**Purpose**: Persistent audio player for live radio

**Key Features**:
- Album art or radio icon
- Current track info (title, artist)
- Play/pause button
- Skip back/forward buttons (disabled for live stream)
- Favorite/like button
- Volume control (web only)
- Mute button (web only)
- Auto-updates track info every 10 seconds
- Proper cleanup on unmount

**Data Requirements**:
- AzuraCast API for now-playing data
- Stream URL from station data
- Album art URLs

**Web Adaptations**:
- Spotify-style persistent bottom bar
- Collapsible on mobile (mini player)
- Volume slider
- Stream quality selector
- Buffer indicator
- Media session API integration (system controls)
- Keyboard shortcuts (spacebar = play/pause)
- Equalizer visualization (optional)

---

## 📊 Data Flow Summary

### Authentication Flow
```
Login/Signup → Supabase Auth → AuthContext → Protected Routes
```

### Content Fetching Flow
```
Screen Mount → Supabase Query → Loading State → Display Data
             ↓
          Error? → Error State → Retry Button
```

### Real-time Updates Flow
```
Supabase Subscription → New Data → Auto-update UI
```

### Live Radio Flow
```
AzuraCast API (poll every 15s) → Now Playing Data → AudioPlayer Update
```

---

## 🔄 Screen Navigation Map

```
Home ←→ Live ←→ Community ←→ Podcasts ←→ Videos
  ↓        ↓         ↓           ↓          ↓
Auth    Player   Prayer     Episode     Video
Pages          Details     Details    Player

Bottom Navigation (Mobile):
[Home] [Live] [Community] [Podcasts] [Videos]

Sidebar Navigation (Web Desktop):
├─ Home
├─ Live Radio
├─ Community
│  ├─ Prayer Requests
│  └─ Testimonies
├─ Podcasts
├─ Videos
└─ Profile
   ├─ My Prayers
   ├─ My Testimonies
   ├─ Settings
   └─ Logout
```

---

## 🎨 Shared UI Patterns

### Card Component Pattern
All screens use similar card styling:
- White background
- Rounded corners (12px)
- Subtle shadow
- 16px padding
- Hover effect (lift + larger shadow)

### Loading Pattern
- Skeleton screens for content loading
- Spinner for async actions
- Shimmer animation effect

### Empty State Pattern
- Icon (gray-400)
- Message text
- Optional CTA button

### Error State Pattern
- Error icon (red-500)
- Error message
- "Retry" button

### Pull-to-Refresh Pattern (Mobile)
- Drag down gesture
- Loading spinner at top
- Refresh all content

---

**This overview should help you understand each screen's purpose and features quickly!** 📱
