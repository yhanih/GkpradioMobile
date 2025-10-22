# Website Feedback Request - GKP Radio

## Overview
This is a mobile-responsive web application for GKP Radio (Kingdom Principles Radio), featuring a modern UI for streaming audio, browsing podcasts, watching videos, and engaging with the community. Built with React, TypeScript, Vite, and Tailwind CSS.

## Project Information
- **Original Figma Design**: https://www.figma.com/design/mrLXItbOF9hR7vWJCUfDx1/Website-Feedback-Request
- **Tech Stack**: React 18, TypeScript, Vite 6, Tailwind CSS 3
- **UI Components**: shadcn/ui with Radix UI primitives
- **Build System**: Vite with SWC for fast compilation

## Project Structure
```
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── figma/           # Figma-specific utilities
│   │   ├── AudioPlayer.tsx  # Audio streaming player
│   │   ├── BottomNav.tsx    # Mobile bottom navigation
│   │   ├── HomeScreen.tsx   # Main home screen
│   │   ├── CommunityScreen.tsx
│   │   ├── PodcastsScreen.tsx
│   │   ├── VideoScreen.tsx
│   │   └── LiveScreen.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind imports and theme
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies

```

## Recent Changes (Oct 22, 2025)
- ✅ Set up project for Replit environment
- ✅ Configured Vite to run on port 5000 with host 0.0.0.0
- ✅ Created TypeScript configuration files
- ✅ Set up Tailwind CSS v3 with proper configuration
- ✅ Added PostCSS configuration
- ✅ Created .gitignore for Node.js projects
- ✅ Configured deployment settings for Replit autoscale
- ✅ Installed all required dependencies

## Development
- **Start dev server**: `npm run dev` (runs on http://localhost:5000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## Key Features
- 🎵 Live audio streaming with player controls
- 📱 Mobile-first responsive design
- 🏠 Home screen with community stats (2.5K members, 8.2K messages, 45K prayers)
- 👥 Community engagement section
- 🎙️ Podcasts library
- 📹 Video content
- 📡 Live radio streaming
- 🎨 Modern UI with shadcn/ui components

## Configuration Notes
- **Port**: 5000 (required for Replit)
- **Host**: 0.0.0.0 (allows Replit proxy access)
- **Deployment**: Autoscale mode with Vite preview server
- **Build Output**: `build/` directory

## Dependencies Highlights
- React 18 with React DOM
- Vite 6 with SWC plugin for fast builds
- Tailwind CSS 3 with tailwindcss-animate
- Radix UI components (@radix-ui/react-*)
- Lucide React for icons
- Additional UI libraries: recharts, react-hook-form, react-day-picker

## User Preferences
None specified yet.

## Architecture Decisions
- **Build System**: Using Vite for fast HMR and optimized builds
- **Styling**: Tailwind CSS for utility-first styling with shadcn/ui for pre-built components
- **Type Safety**: Full TypeScript support throughout the codebase
- **Component Library**: shadcn/ui provides accessible, customizable components
