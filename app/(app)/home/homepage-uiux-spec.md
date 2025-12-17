# Merley Homepage UI/UX Specification

**Version:** 1.0  
**Target:** Cursor implementation (Next.js App Router + React)  
**Status:** Approved, ready for implementation

---

## 1. Design Principles

### Visual Tone
- **Minimalistic** – Generous whitespace, restrained color palette (black, white, grays)
- **Editorial** – Imagery-forward, fashion-first, high contrast
- **Calm** – No aggressive animations, subtle hover states, clean transitions

### Interaction Philosophy
- Reuse existing components wherever possible
- Prioritize horizontal scroll over pagination for content discovery
- Modal-based flows for selection and creation tasks
- Touch-friendly on mobile, keyboard-accessible on desktop

### Consistency Rules
- Preserve existing design tokens (typography, colors, spacing, radius)
- Match established button, input, and card styles
- Maintain existing modal patterns from `TemplateDetailModal`
- No introduction of new UI patterns or design systems

---

## 2. Page Layout Overview

The homepage is a vertical stack of four distinct sections:

### Section Order (Top → Bottom)

1. **Hero Section (Carousel)**
   - Purpose: Primary entry point, showcases lookbooks and style templates
   - Priority: Highest visual weight, immersive full-width treatment

2. **Style Templates (Horizontal Scroll)**
   - Purpose: Browse and select individual style templates
   - Priority: Primary interaction for creation flow

3. **Lookbook Presets (Grid Layout)**
   - Purpose: Create multi-page lookbooks from preset templates
   - Priority: Secondary to style templates, conceptual inspiration

4. **User Albums (Grid Layout)**
   - Purpose: Access existing work and continue projects
   - Priority: Archival, least visual weight

### Spacing Intent
- Large vertical spacing between sections (`py-12` = 48px top/bottom)
- Horizontal padding consistent across sections (`px-8 md:px-12 lg:px-16`)
- No dividers or borders between sections – rely on whitespace

---

## 3. Hero Section – Carousel Behavior

### Layout
- Full-width banner spanning viewport width
- Height: `h-[60vh] min-h-[500px]`
- Background: Editorial fashion images (one per slide)
- Overlay: Dark gradient `from-black/70 via-black/50 to-transparent` for text contrast

### Content Structure
- Text overlay positioned left-aligned
- Maximum width container: `max-w-2xl`
- Padding: `px-8 md:px-12 lg:px-16`

### Text Hierarchy

**Headline:** Large, bold, white text
- `text-4xl md:text-5xl lg:text-6xl font-bold mb-4`
- Uses `text-balance` utility for optimal line breaks
- Example: "Create your fashion story"

**Subtitle:** Secondary descriptive text
- `text-neutral-300 text-base md:text-lg mb-8`
- One-line maximum, uses `text-pretty`
- Example: "Generate editorial imagery for your brand with AI-powered style templates"

**CTA Button:** Primary action
- White background, black text (`bg-white text-black`)
- `px-8 py-4 rounded-lg text-base font-medium`
- Hover state: `hover:bg-neutral-200`
- Example: "Start a Lookbook" or "Explore Styles"

### Carousel Behavior
- **Auto-advance:** 5 seconds per slide
- **Manual navigation:** Left/right arrow buttons
  - Positioned `left-4` and `right-4`, vertically centered
  - Styled with `bg-black/30 backdrop-blur-sm border border-white/20`
  - Opacity: Hidden by default, visible on group hover
- **Transition:** 500ms fade between slides
- **Indicators:** Dot navigation at bottom center
  - Active dot: `w-8 bg-white`
  - Inactive dot: `w-1.5 bg-white/50`
  - Clickable to jump to slide

### Click Behavior
CTA button triggers associated action based on slide type:
- If `type: "lookbook"` → Opens `LookbookCreationModal`
- If `type: "template"` → Opens `TemplateDetailModal`

### No Marketing Overload
- Headlines are creation-focused, not brand marketing
- Copy emphasizes action and outcomes, not features
- Visual dominance over text

### Data Source
Component uses `heroCarouselItems` from `lib/data.ts`:

```typescript
export interface HeroCarouselItem {
  id: string
  type: "lookbook" | "template"
  title: string
  subtitle: string
  ctaText: string
  backgroundImage: string
  linkedItem: LookbookPreset | StyleTemplate
}
```

---

## 4. Style Template Section (Primary Interaction)

### Section Header
- **Title:** "Styles" (`text-2xl font-semibold mb-1`)
- **Subtitle:** Template count display
  - `text-neutral-500 text-sm`
  - Example: "12 templates available"
- **Scroll Controls:** Left/right chevron buttons
  - Positioned right side of header
  - `border border-neutral-800 text-neutral-400`
  - Hover: `hover:text-white hover:border-neutral-700`

### Card Layout
- **Orientation:** Portrait (`aspect-[3/4]`)
- **Container:** Horizontal scroll rail
  - `flex gap-4 overflow-x-auto scrollbar-hide`
  - Smooth scroll behavior enabled
  - Hidden scrollbar (CSS custom styling)
- **Card Width:** Fixed at `w-64` (256px)
- **Card Spacing:** `gap-4` (16px)

### Card Contents

**Image Preview**
- Full card background, `object-cover`
- Gradient overlay: `from-black/80 via-transparent to-transparent`
- Hover effect: `group-hover:scale-105` with 300ms transition

**Text Overlay (bottom-aligned)**
- Style Name: `text-base font-medium text-white mb-1`
- Tag Badge (first tag only):
  - `px-2 py-1 bg-white/10 backdrop-blur-sm text-xs rounded-md`
  - Example: "Editorial", "Campaign"

### Interaction States
- **Hover:** Subtle scale-up (1.05x), no other visual change
- **Focus:** White ring `focus:ring-2 focus:ring-white/20`
- **Click:** Opens `TemplateDetailModal` with selected template

### Loading State
- Display skeleton cards (shimmer effect)
- Same portrait dimensions
- Neutral-900 background

### Empty State
If no templates match filters (future feature):
- Centered message: `text-neutral-400 text-sm`
- Example: "No templates found"

### Keyboard Navigation
- Tab through cards sequentially
- Enter key selects focused card
- Arrow keys can scroll horizontally (browser default)

### Data Source
Component uses `styleTemplates` array from `lib/data.ts`:

```typescript
export interface StyleTemplate {
  id: string
  name: string
  previewImage: string
  description: string
  tags: string[]
  exampleImages: string[]
  isUserCreated: boolean
}
```

---

## 5. Lookbook Presets Section

### Section Header
- **Title:** "Lookbooks" (`text-2xl font-semibold mb-1`)
- **Subtitle:** Explanatory text
  - `text-neutral-500 text-sm`
  - Example: "Multi-page collections and campaigns"

### Conceptual Difference from Templates
- **Templates** = Single aesthetic/style applied to individual images
- **Lookbooks** = Multi-page structured collections with narrative flow

### Card Layout
- **Orientation:** Landscape (`aspect-video` = 16:9)
- **Grid Behavior:**
  - Desktop: `md:grid-cols-2 lg:grid-cols-3`
  - Tablet: `grid-cols-2`
  - Mobile: `grid-cols-1`
- **Card Spacing:** `gap-5` (20px)

### Card Contents

**Preview Image**
- Full card background, `object-cover`
- Gradient overlay: `from-black/80 via-black/20 to-transparent`
- Hover effect: Scale to 1.05x with 300ms transition

**Tags (top-right corner)**
- Multiple tags displayed inline
- `px-2 py-1 bg-black/40 backdrop-blur-sm border border-white/10`
- `text-xs text-white rounded-md`
- Example: "Editorial", "Campaign"

**Text Content (bottom-left)**
- Name: `text-lg font-medium text-white mb-1`
- Page Count: `text-xs text-neutral-400`
- Example: "Studio Editorial" / "12 pages"

### Click Behavior
Opens `LookbookCreationModal` with selected preset

Modal flow:
1. **Step 1:** Name the lookbook (input field)
2. **Step 2:** Select styles to apply across pages (multi-select grid)
3. **Confirm:** Creates lookbook with selected styles

### Visual Hierarchy Notes
- Slightly lower priority than style templates
- Positioned after templates to reinforce creation flow logic
- Cards are wider (landscape vs. portrait) to differentiate conceptually

### Data Source
Component uses `lookbookPresets` array from `lib/data.ts`:

```typescript
export interface LookbookPreset {
  id: string
  name: string
  previewImage: string
  description: string
  tags: string[]
  pageCount: number
}
```

---

## 6. User Albums Section

### Section Header
- **Title:** "Your Albums" (`text-2xl font-semibold`)
- No subtitle or additional controls

### Layout
**Grid Behavior:**
- Desktop: `lg:grid-cols-4 xl:grid-cols-5`
- Tablet: `md:grid-cols-3`
- Mobile: `sm:grid-cols-2`, `grid-cols-1`
- **Card Spacing:** `gap-5` (20px)

### Component Reuse
- **Component:** `AlbumsGrid` (existing)
- **Props:** `searchQuery` (currently empty string, no search UI in this iteration)
- No redesign or modification
- Maintains existing card styles:
  - Portrait cover image (`aspect-[4/5]`)
  - Album name + metadata (image count, last updated)
  - Hover scale effect (1.05x)

### Empty State (from AlbumsGrid)
If no albums exist or search returns nothing:
- Centered message: "No albums found"
- Secondary text: "Try a different search term"

### Click Behavior
Navigates to album detail view (existing screen)

---

## 7. Header Component

### Structure
- Fixed to top with border: `border-b border-neutral-800/50`
- Padding: `px-8 md:px-12 lg:px-16 py-5`
- Layout: Flex row, space-between alignment

### Left Side
**Brand Name:** "Merley"
- `text-xl font-semibold text-white`

### Right Side
**New Album Button:**
- Icon: Plus icon (lucide-react)
- Text: "New Album"
- Style: `bg-white text-black rounded-lg text-sm font-medium`
- Hover: `hover:bg-neutral-200`
- Padding: `px-4 py-2`, gap: `gap-2`

### No Search in This Iteration
- Search functionality removed from header
- May return in future iteration scoped to specific sections

---

## 8. Modal Components

### TemplateDetailModal (Reused)
- Opens when user clicks a style template card
- Displays template details, example images, and tags
- CTA: "Use This Template" (navigates to image generation flow)
- Existing component, no modifications

### LookbookCreationModal (New)
Opens when user clicks a lookbook preset card

**Step 1:** Input field for lookbook name
- Pre-filled with preset name
- Validation: Name cannot be empty
- Progress indicator: Step 1/2

**Step 2:** Multi-select grid of style templates
- Portrait cards (same aspect as template section)
- Checkmark overlay on selected styles
- Shows selection count in CTA button

**Footer Actions:**
- Back button (Step 2 only)
- Continue/Create button
- Button text updates based on step and selection count

**Modal Styling:**
- Max width: `max-w-4xl`
- Background: `bg-neutral-900`
- Border: `border-neutral-800`
- Close button: Top-right, `bg-black/50` with X icon

---

## 9. Interaction & Behavior Rules

### Global Rules
- No redesign of existing components unless explicitly required
- Preserve all design tokens (colors, typography, spacing, radius)
- Reuse existing modal patterns and component structures
- Maintain existing button, input, and card styles

### Hover States
- All hover effects are subtle and use scale or color transitions
- No dramatic animations or effects
- Transition duration: 300ms for scale, 200ms for color

### Keyboard Navigation
- All interactive elements are keyboard-accessible (tab order)
- Focus rings use `focus:ring-2 focus:ring-white/20`
- Enter key activates buttons and cards
- Escape key closes modals

### Touch/Mobile Behavior
- Horizontal scroll sections remain swipeable on touch devices
- Scroll buttons optional on mobile (can be hidden with responsive utilities if needed)
- Tap targets meet minimum 44x44px guideline
- No hover states on touch (rely on native touch feedback)

### Loading Patterns
- Use skeleton loaders for cards (future enhancement)
- Smooth transitions between states (fade-in, slide-in)
- No blocking spinners or overlays

### Error Handling
- Empty states use neutral, helpful messaging
- Failed image loads fallback to placeholder SVG
- No error boundaries specified (assume standard Next.js error handling)

---

## 10. Implementation Checklist for Cursor

### Setup
- ✅ Next.js App Router structure
- ✅ Use existing components from `components/` directory
- ✅ Import design tokens from `app/globals.css`
- ✅ Use data from `lib/data.ts` (mock data allowed)

### Components to Create
- `components/hero-banner.tsx` – Carousel hero section
- `components/style-template-cards.tsx` – Horizontal scroll template rail
- `components/lookbook-preset-cards.tsx` – Grid of lookbook presets
- `components/lookbook-creation-modal.tsx` – Two-step creation flow

### Components to Reuse (Do Not Modify)
- `components/albums-grid.tsx` – User albums section
- `components/template-detail-modal.tsx` – Template selection modal
- All UI components in `components/ui/*` (buttons, inputs, modals, etc.)

### Files to Modify
**`components/home-content.tsx`** – Main page composition
- Remove tab navigation
- Remove search from header
- Integrate new hero, style cards, lookbook cards
- Keep minimal header with "New Album" button

### Data Requirements
- Use `heroCarouselItems`, `styleTemplates`, `lookbookPresets`, `albums` from `lib/data.ts`
- All data structures are defined and populated
- Mock data is acceptable for prototype

### Styling Guidelines
- Use Tailwind utility classes exclusively
- Follow existing spacing scale (`p-4`, `gap-5`, `mb-6`, etc.)
- Use semantic color tokens (`bg-neutral-900`, `text-white`, `border-neutral-800`)
- Maintain consistent border radius (`rounded-lg`, `rounded-xl`)
- Apply text utilities (`text-balance`, `text-pretty`, `truncate`)

### Animation/Transition Rules
- Keep animations subtle and purposeful
- Use Tailwind `transition-*` utilities
- Typical durations: 200-500ms
- Avoid custom CSS animations unless necessary

### Accessibility
- All images have alt text
- Interactive elements are keyboard accessible
- Focus indicators are visible
- ARIA labels on icon-only buttons

### Responsive Behavior
- Mobile-first approach
- Use responsive prefixes (`md:`, `lg:`, `xl:`)
- Stack sections vertically on small screens
- Horizontal scroll remains on mobile for template cards
- Grid columns reduce gracefully for lookbooks and albums

### Logic Simplification
- Keep state management minimal (local `useState`)
- No complex routing or data fetching in this iteration
- Modal open/close state managed by parent `HomeContent`
- Click handlers pass selected items up to parent

### Do Not Refactor
- Do not modify unrelated pages or components
- Do not change existing design tokens
- Do not introduce new UI libraries or dependencies
- Do not alter existing modal or button patterns

---

## 11. Final Notes

### Tone of Implementation
- Treat this design as locked and approved
- No creative interpretation or exploration
- Pixel-accurate adherence to specifications
- Preserve existing patterns and components

### What This Spec Doesn't Cover
- Backend integration (not required for prototype)
- Authentication or user state (simulated in mock data)
- Image upload or generation flow (separate screens)
- Search/filter functionality (future enhancement)
- Analytics or tracking

### Success Criteria
- Homepage renders with all four sections in correct order
- Hero carousel auto-advances and accepts manual navigation
- Style template cards open template detail modal on click
- Lookbook preset cards open two-step creation modal
- Albums grid displays user albums with existing component
- All interactions are smooth and keyboard accessible
- Design matches existing Merley aesthetic (black, white, editorial)
- No visual regressions or broken layouts

---

## 12. Implementation Summary

### Completed Components

| Component | File | Status |
|-----------|------|--------|
| TypeScript Types | `types/homepage.ts` | ✅ Complete |
| Data Layer | `_components/homepage-data.ts` | ✅ Complete |
| Hero Banner | `_components/HeroBanner.tsx` | ✅ Complete |
| Style Template Cards | `_components/StyleTemplateCards.tsx` | ✅ Complete |
| Lookbook Preset Cards | `_components/LookbookPresetCards.tsx` | ✅ Complete |
| Template Detail Modal | `_components/TemplateDetailModal.tsx` | ✅ Complete |
| Lookbook Creation Modal | `_components/LookbookCreationModal.tsx` | ✅ Complete |
| Albums Grid | `_components/AlbumsGrid.tsx` | ✅ Complete |
| Contextual Banner | `_components/ContextualBanner.tsx` | ✅ Complete |
| Home Page Client | `_components/HomePageClient.tsx` | ✅ Complete |

### Files Modified

- `types/index.ts` - Added homepage type exports
- `app/globals.css` - Added `scrollbar-hide` utility class

### Key Implementation Details

- **Album Selector**: Uses existing albums from `useAlbumsContext()`
- **Modal State**: Managed by parent `HomePageClient` component
- **Data Source**: Mock JSON from `hompage-data-obj.json`
- **Navigation**: Uses Next.js `useRouter` for album navigation

---

## 13. Future TODOs

### API Integration
- [x] Replace mock JSON data with API endpoint that fetches homepage data
- [x] Implement `/api/home` endpoint returning `HomepageData` type

### Apply Style Journey
- [ ] Navigate to album with style pre-applied after "Apply Style" click
- [ ] Pass selected template ID as query param or context state
- [ ] Pre-populate generation input with template prompt

### Create Lookbook Journey
- [ ] Create lookbook album after modal completion
- [ ] Navigate to new lookbook album
- [ ] Apply selected styles to lookbook pages

### Contextual Banner
- [ ] Connect to actual generation state from `useAlbumsContext()` or SSE
- [ ] Show banner when user has active generations in any album
- [ ] Navigate to correct album on "Continue" click

### Additional Enhancements
- [ ] Add keyboard navigation for carousel (arrow keys)
- [ ] Implement swipe gestures for mobile carousel
- [x] Add loading states for homepage data fetch
- [ ] Implement error boundary for failed data loads

### Code Organization
- [x] Deleted `homepage-data.ts` (replaced by API)
- [x] Created `hooks/useHomepageData.ts` hook for async data fetching
- [x] Created `HomePageSkeleton.tsx` for loading state

---

**End of Specification**

This document is ready for Cursor implementation. Copy this entire specification into Cursor and proceed with code generation following the guidelines above.