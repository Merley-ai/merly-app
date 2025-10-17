# Merley Landing Page

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

1. Clone the repository or extract the files

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

Start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Deployment

### Vercel (Recommended)

The easiest way to deploy this Next.js app is with [Vercel](https://vercel.com):

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository to Vercel
3. Vercel will detect Next.js and configure the build settings automatically
4. Click "Deploy"

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Other Platforms

You can also deploy to:
- **Netlify**: Use the Next.js plugin
- **AWS Amplify**: Connect your repository
- **Docker**: Use the included Node.js runtime
- **Self-hosted**: Run `npm run build && npm start` on your server

## Project Structure

```
next-app/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page component
│   └── globals.css         # Global styles and Tailwind configuration
├── components/
│   └── AnimatedImage.tsx   # Scroll-triggered animation component
├── lib/
│   └── svg-paths.ts        # SVG path definitions
├── public/
│   └── images/             # Static images (you need to add these)
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── postcss.config.mjs      # PostCSS configuration
```

## Technologies

- **Next.js 15** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Motion (Framer Motion)** - Animations
- **Lucide React** - Icons

## Customization

### Fonts

The project uses Google Fonts (Roboto Serif and Roboto). These are loaded in `app/layout.tsx`. If you need to add the Circular Std font:

1. Add the font files to `public/fonts/`
2. Update `app/globals.css` with @font-face declarations

### Colors

Update the color scheme in `app/globals.css` by modifying the CSS variables in the `:root` selector.

### Content

Edit `app/page.tsx` to modify:
- Navigation links
- Hero text
- Section content
- Footer information

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

All rights reserved © 2025 Merley

## Support

For support, email support@merley.co
