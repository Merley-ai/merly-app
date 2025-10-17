# Deployment Guide

This guide will help you deploy your Merley landing page to production.

## Pre-Deployment Checklist

### 1. Add Your Images

**CRITICAL**: Before deploying, you must add all images to the `public/images/` directory:

```
public/images/
├── editorial-1.png
├── editorial-2.png
├── model-1.png
├── model-2.png
├── model-3.png
├── model-4.png
├── product-1.png
├── product-2.png
├── product-3.png
├── product-4.png
├── creative-1.png
└── creative-2.png
```

Export these images from your Figma design or source files.

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and verify everything looks correct.

### 4. Build for Production

```bash
npm run build
```

This will create an optimized production build. Fix any errors before proceeding.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the creator of Next.js and offers the best deployment experience.

1. **Sign up for Vercel**: https://vercel.com/signup
2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

3. **Deploy via Web Interface**:
   - Push your code to GitHub, GitLab, or Bitbucket
   - Go to https://vercel.com/new
   - Import your repository
   - Vercel auto-detects Next.js and configures everything
   - Click "Deploy"

4. **Deploy via CLI**:
   ```bash
   vercel
   ```
   Follow the prompts.

**Custom Domain**:
- Go to your project settings in Vercel
- Navigate to "Domains"
- Add your custom domain (e.g., www.merley.co)
- Follow the DNS configuration instructions

**Environment Variables**:
- In Vercel project settings → Environment Variables
- Add any variables from `.env.example`

### Option 2: Netlify

1. **Sign up**: https://www.netlify.com/
2. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Or use the web interface**:
   - Connect your Git repository
   - Build command: `npm run build`
   - Publish directory: `.next`

**Note**: Netlify requires the Next.js Runtime plugin for full functionality.

### Option 3: Self-Hosted (VPS/Dedicated Server)

For hosting on your own server:

1. **Requirements**:
   - Node.js 18.x or higher
   - PM2 or similar process manager
   - Nginx or Apache (for reverse proxy)

2. **Build**:
   ```bash
   npm run build
   ```

3. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "merley" -- start
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name merley.co www.merley.co;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL Certificate** (recommended):
   ```bash
   sudo certbot --nginx -d merley.co -d www.merley.co
   ```

### Option 4: Docker

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Update next.config.js**:
   ```javascript
   const nextConfig = {
     output: 'standalone',
     // ... rest of config
   }
   ```

3. **Build and run**:
   ```bash
   docker build -t merley .
   docker run -p 3000:3000 merley
   ```

### Option 5: AWS Amplify

1. **Sign in to AWS Amplify Console**
2. **Connect repository**
3. **Build settings** (auto-detected):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

## Post-Deployment

### 1. Verify Deployment
- Check all pages load correctly
- Test on mobile devices
- Verify animations work
- Check all images load
- Test form submission (file upload)

### 2. Performance Optimization
- Enable compression (Gzip/Brotli)
- Set up CDN for static assets
- Configure caching headers
- Use Next.js Image Optimization

### 3. Monitoring
- Set up error tracking (e.g., Sentry)
- Configure analytics (e.g., Google Analytics, Vercel Analytics)
- Monitor uptime

### 4. SEO
- Submit sitemap to Google Search Console
- Verify meta tags and OpenGraph images
- Check mobile-friendliness

### 5. Security
- Enable HTTPS
- Configure security headers
- Set up CORS if needed
- Regular dependency updates: `npm audit`

## Continuous Deployment

### Git-based Deployment (Recommended)

With Vercel or Netlify:
1. Connect your Git repository
2. Every push to main branch automatically deploys
3. Pull requests get preview deployments

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy (Vercel)
vercel --prod

# Deploy (Netlify)
netlify deploy --prod
```

## Troubleshooting

### Images Not Loading
- Verify all images are in `public/images/`
- Check file names match exactly
- Ensure proper file permissions

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Performance Issues
- Optimize images (WebP format, proper sizing)
- Enable caching
- Use CDN
- Check bundle size: `npm run build` shows size info

### Font Loading Issues
- Verify Google Fonts URL in layout.tsx
- Check network requests in browser DevTools
- Add font-display: swap for better performance

## Need Help?

- Next.js Documentation: https://nextjs.org/docs
- Vercel Support: https://vercel.com/support
- Stack Overflow: Tag questions with `next.js`

## Environment-Specific Configuration

For different environments (dev, staging, production):

1. Create environment files:
   - `.env.development`
   - `.env.staging`
   - `.env.production`

2. Add to `.gitignore`:
   ```
   .env*.local
   ```

3. Configure in your deployment platform

---

**Remember**: Always test thoroughly before deploying to production!
