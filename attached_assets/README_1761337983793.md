# GKP Radio - Design Handoff Package

This folder contains everything you need to recreate the GKP Radio mobile app experience for the web.

## 📁 Folder Structure

```
design-handoff/
├── README.md                    # You are here
├── DESIGN_GUIDE.md             # Complete design system & implementation guide
├── COLOR_REFERENCE.md          # Color palette with hex codes
├── supabase_schema.sql         # Database schema
├── App.tsx                     # Main app structure reference
├── screens/                    # All screen components
│   ├── HomeScreen.tsx
│   ├── LiveScreen.tsx
│   ├── CommunityScreen.tsx
│   ├── PodcastsScreen.tsx
│   ├── VideoScreen.tsx
│   └── auth/
│       ├── LoginScreen.tsx
│       └── SignupScreen.tsx
├── components/                 # Reusable components
│   └── AudioPlayer.tsx
└── types/                      # TypeScript definitions
    └── database.types.ts
```

## 🚀 Quick Start

1. **Read the Design Guide First** (`DESIGN_GUIDE.md`)
   - Complete design system documentation
   - Screen-by-screen breakdown
   - Mobile-to-web adaptation notes
   - Recommended tech stack

2. **Review the Color Reference** (`COLOR_REFERENCE.md`)
   - All color codes for easy copy-paste
   - Usage guidelines for each color

3. **Examine the Screens** (`screens/`)
   - Study the component structure
   - Note the styling patterns
   - Understand the data flow

4. **Check the Database Schema** (`supabase_schema.sql`)
   - Understand the data models
   - Review the table relationships
   - Note the RLS policies

5. **Reference Type Definitions** (`types/database.types.ts`)
   - TypeScript types for all data models
   - Use these for type safety

## 🎯 Your Mission

Create a web version of the GKP Radio app that:

✅ **Maintains the same look and feel** as the mobile app
✅ **Adapts mobile patterns to web** (bottom tabs → sidebar, swipes → clicks, etc.)
✅ **Uses the same color scheme** and design tokens
✅ **Connects to the same Supabase backend** (already configured)
✅ **Implements responsive design** for mobile, tablet, and desktop
✅ **Adds web-specific enhancements** (keyboard shortcuts, hover states, etc.)

## 📋 Key Files to Start With

1. **DESIGN_GUIDE.md** - Your main reference (READ THIS FIRST!)
2. **screens/HomeScreen.tsx** - See how the dashboard is structured
3. **screens/LiveScreen.tsx** - Understand the live radio interface
4. **components/AudioPlayer.tsx** - Critical for audio streaming
5. **types/database.types.ts** - Data structure reference

## 🎨 Design Principles

- **Clean & Minimal**: Focus on content, not decoration
- **Faith-Focused**: Green represents kingdom/growth
- **Accessible**: WCAG AA minimum for color contrast
- **Mobile-First**: Start mobile, scale up to desktop
- **Consistent**: Use the design tokens consistently

## 🔧 Recommended Stack

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS (matches mobile's NativeWind)
- **UI Components**: shadcn/ui
- **Database**: Supabase (already set up)
- **Audio**: Howler.js or Plyr
- **State**: React Query + Context

## 💡 Pro Tips

1. **Don't reinvent the wheel** - The mobile app's structure works well, adapt it
2. **Mobile components ≠ Web components** - But the patterns translate
3. **Use the same database** - Share backend with mobile app
4. **Think responsive** - Mobile screens should work on web too
5. **Add web polish** - Hover states, keyboard shortcuts, better forms

## 🎨 Color Quick Reference

Primary Green: `#047857`
Accent Red: `#ef4444`
Dark Text: `#09090b`
Light Text: `#71717a`

See `COLOR_REFERENCE.md` for complete palette.

## 📞 Questions?

Refer back to the `DESIGN_GUIDE.md` for detailed explanations. All component examples are in the `screens/` and `components/` folders.

---

**Happy coding! Build something amazing! 🚀**
