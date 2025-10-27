# Merley App

A production-ready Next.js application for Merley - an AI-powered fashion editorial creation platform.

## Features

- 🎨 Fully responsive design across all screen sizes
- ✨ Scroll-triggered image animations
- 📱 Mobile-first approach
- 🎭 Custom typography using Roboto Serif and Roboto fonts
- 🖼️ Optimized image loading
- ♿ Accessible components
- 🌙 Dark theme (black background)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd merly-app
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Important: Add your images**

   Place your images in the `public/images/` directory with the following names:
   - `editorial-1.png` - First main editorial image
   - `editorial-2.png` - Second main editorial image
   - `model-1.png` - Model shot 1
   - `model-2.png` - Model shot 2
   - `model-3.png` - Model shot 3
   - `model-4.png` - Model shot 4
   - `product-1.png` - Product shot 1
   - `product-2.png` - Product shot 2
   - `product-3.png` - Product shot 3
   - `product-4.png` - Product shot 4
   - `creative-1.png` - Creative shot 1
   - `creative-2.png` - Creative shot 2

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

## Project Structure

The application uses Next.js 15's App Router with a well-organized, scalable structure:

```
merly-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   ├── globals.css              # Global styles
│   │
│   ├── (website)/               # Public website route group
│   │   ├── layout.tsx          # Website-specific layout
│   │   ├── page.tsx            # Landing page (/)
│   │   └── _components/        # Website-only components
│   │       ├── Navigation.tsx
│   │       ├── Hero.tsx
│   │       ├── EditorialShowcase.tsx
│   │       ├── SectionHeading.tsx
│   │       ├── ModelGrid.tsx
│   │       ├── ProductGrid.tsx
│   │       ├── CreativeShowcase.tsx
│   │       └── Footer.tsx
│   │
│   └── (app)/                   # Application route group
│       ├── layout.tsx          # App-specific layout
│       └── dashboard/
│           ├── page.tsx        # Dashboard page (/dashboard)
│           └── _components/    # Dashboard-only components
│               ├── Sidebar.tsx
│               ├── TimelineWithInput.tsx
│               ├── ThinkingAnimation.tsx
│               ├── InputArea.tsx
│               ├── Gallery.tsx
│               ├── RenderingImageTile.tsx
│               └── ImageViewer.tsx
│
├── components/                  # Shared components
│   └── ui/
│       └── AnimatedImage.tsx   # Scroll-triggered animation
│
├── lib/                         # Utilities and constants
│   ├── utils/                  # Utility functions
│   │   ├── cn.ts              # Classname utility
│   │   ├── date.ts            # Date formatters
│   │   ├── image.ts           # Image utilities
│   │   └── index.ts           # Exports
│   │
│   └── constants/              # Constants
│       ├── website-svg-paths.ts
│       ├── dashboard-svg-paths.ts
│       └── index.ts
│
├── types/                       # TypeScript type definitions
│   ├── album.ts
│   ├── timeline.ts
│   ├── gallery.ts
│   ├── dashboard.ts
│   └── index.ts                # Centralized exports
│
└── public/                      # Static assets
    ├── images/                 # Image files
    └── robots.txt
```

## Architecture

### Route Groups

The app uses Next.js route groups for organization:

- **(website)** - Public marketing pages (landing, pricing, etc.)
- **(app)** - Authenticated application pages (dashboard, settings, etc.)

Route groups don't affect URLs:
- `app/(website)/page.tsx` → `/`
- `app/(app)/dashboard/page.tsx` → `/dashboard`

### Layout Hierarchy

```
app/layout.tsx (Root)
├── Fonts, metadata, global styles
│
├── app/(website)/layout.tsx
│   └── Marketing-specific features
│
└── app/(app)/layout.tsx
    └── App-specific features (auth, providers)
```

### Component Organization

- **Private folders (`_components/`)** - Components specific to a route
- **Shared components (`components/ui/`)** - Reusable across the app
- **Route colocation** - Components live near where they're used

### Type System

All types are centralized in `types/` with JSDoc documentation:

```typescript
import type { Album, TimelineEntry, GalleryImage } from "@/types";
```

### Utilities

Reusable utility functions in `lib/utils/`:

```typescript
import { cn, downloadImage, formatShortDate } from "@/lib/utils";
```

## Technologies

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Motion (Framer Motion)** - Animations
- **Lucide React** - Icons

## Development Guidelines

### Adding New Features

**Website Features:**
```bash
# Add to app/(website)/_components/
# Import in app/(website)/page.tsx
```

**Dashboard Features:**
```bash
# Add to app/(app)/dashboard/_components/
# Import in app/(app)/dashboard/page.tsx
```

### Creating Shared Components

```bash
# Add to components/ui/
# Import using @/components/ui/ComponentName
```

### Adding Utilities

```bash
# Add to lib/utils/
# Export from lib/utils/index.ts
# Import using @/lib/utils
```

### Defining Types

```bash
# Add to types/
# Export from types/index.ts
# Import using @/types
```

## Customization

### Fonts

Fonts are loaded in `app/layout.tsx`. To add custom fonts:

1. Add font files to `public/fonts/`
2. Update `app/globals.css` with @font-face declarations

### Colors

Update `app/globals.css` to modify the color scheme.

### Content

**Landing Page:** Edit components in `app/(website)/_components/`  
**Dashboard:** Edit components in `app/(app)/dashboard/_components/`

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to Git repository
2. Import to Vercel
3. Vercel auto-detects Next.js
4. Deploy

### Other Platforms

- **Netlify** - Use Next.js plugin
- **AWS Amplify** - Connect repository
- **Docker** - Use Node.js runtime
- **Self-hosted** - Run `npm run build && npm start`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

All rights reserved © 2025 Merley

## Support

For support, email support@merley.co
