# Community Module

A standalone community module extracted from GKP Radio.

## Features
- Discussion threads with categories
- Nested comments/replies
- Thread liking and view tracking (logic included)
- User tagging (optional spouse tagging)
- Real-time community stats
- Premium UI with faith-based theme

## Dependencies
This module assumes the following are present in your project:
- **React** & **Vite**
- **Supabase** (for backend/auth)
- **TanStack Query** (React Query)
- **Lucide React** (icons)
- **Tailwind CSS**
- **shadcn/ui** components (Button, Input, Card, Tabs, Textarea, Badge, AlertDialog, Select, Form, Dialog, Avatar)
- **wouter** (for routing)
- **Zod** & **React Hook Form** (for forms)

## Installation

1. Copy the `community-module` folder into your project.
2. Import the styles in your main entry point:
   ```typescript
   import './community-module/styles/community.css';
   ```
3. Set up the necessary database tables in Supabase (see `supabase-setup.sql`).
4. Ensure your project has an `AuthContext` or equivalent that provides `user` and `loading` states.
5. Use the components or pages.

### Database Requirements
Make sure your Supabase project has the following tables:
- `communitythreads`
- `communitycomments`
- `threadlikes`
- `users` (public profile table)

## Imports
You can import everything from the main index:
```typescript
import { CommunityPage, CommunityPreview, useCommunityThreads } from './community-module';
```

## Note on Layouts
This module imports `Header`, `Footer`, and `AudioPlayer` from `@/components`. You may need to update these paths or provide your own layout components in the destination project.
