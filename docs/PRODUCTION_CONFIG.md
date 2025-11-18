# Production Configuration Guide

This document outlines the production-grade configurations added to the Merley application.

## 📋 Overview

The application has been enhanced with production-ready configurations for:
- **Security**: Security headers, CSP policies, and best practices
- **Performance**: Bundle optimization, code splitting, and caching
- **Code Quality**: Enhanced ESLint rules and TypeScript strictness
- **Monitoring**: Logging and error handling improvements

## 🔒 Security Enhancements

### Security Headers (next.config.js)

The following security headers have been added to all routes:

- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections for 2 years
- **X-Frame-Options**: Prevents clickjacking attacks (SAMEORIGIN)
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filtering in older browsers
- **Referrer-Policy**: Controls referrer information sharing
- **Permissions-Policy**: Restricts access to browser features (camera, microphone, geolocation)
- **X-DNS-Prefetch-Control**: Enables DNS prefetching for performance

### Image Security

- SVG images are disabled by default (`dangerouslyAllowSVG: false`)
- Content Security Policy for images
- Content disposition set to attachment for security

## ⚡ Performance Optimizations

### Bundle Optimization

1. **Code Splitting**: Automatic vendor and common chunk splitting
2. **Deterministic Module IDs**: Better caching for production builds
3. **Runtime Chunk**: Separated runtime code for better caching
4. **Package Import Optimization**: Tree-shaking for `lucide-react` and `@supabase/supabase-js`

### Image Optimization

- **Device Sizes**: Optimized breakpoints for responsive images
- **Image Sizes**: Multiple size variants for different use cases
- **Cache TTL**: 60-second minimum cache time for images
- **Modern Formats**: AVIF and WebP support

### Build Optimizations

- **SWC Minification**: Faster and better minification
- **Standalone Output**: Optimized for Docker deployments
- **Response Compression**: Gzip/Brotli compression enabled
- **Removed X-Powered-By**: Security and performance improvement

## 🛠️ Code Quality Enhancements

### ESLint Rules Added

#### Security Rules
- `no-eval`: Prevents use of `eval()`
- `no-implied-eval`: Prevents implied `eval()` usage
- `no-new-func`: Prevents `new Function()` constructor
- `no-script-url`: Prevents `javascript:` URLs

#### Performance Rules
- `no-await-in-loop`: Warns about sequential async operations
- `no-promise-executor-return`: Prevents promise executor returns
- `prefer-promise-reject-errors`: Ensures proper error objects

#### Code Quality
- `no-console`: Warns in production, allows in development
- `no-debugger`: Error in production, warning in development
- `@typescript-eslint/no-unused-vars`: Enhanced unused variable detection
- `@typescript-eslint/no-explicit-any`: Warns about `any` types
- `@typescript-eslint/no-non-null-assertion`: Warns about non-null assertions

#### React Best Practices
- `react-hooks/exhaustive-deps`: Ensures proper dependency arrays
- `react/no-unescaped-entities`: Prevents unescaped HTML entities
- `react/self-closing-comp`: Encourages self-closing components

## 📦 Additional Dependencies (Optional)

### ESLint Import Plugin

For import organization, install:
```bash
npm install -D eslint-plugin-import
```

Then uncomment the `import/order` rule in `eslint.config.mjs`.

## 🚀 Deployment Considerations

### Environment Variables

Ensure these are set in production:
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Auth0 environment variables

### Standalone Output

The `output: 'standalone'` configuration creates an optimized build for:
- Docker deployments
- Self-hosted servers
- Better tree-shaking and optimization

### Server Actions

- Body size limit set to 2MB
- Adjust if you need larger payloads

## 🔍 Monitoring & Debugging

### Logging Configuration

- Full URL logging enabled in development
- Reduced logging in production for performance

### Build Analysis

To analyze bundle sizes, consider adding:
```bash
npm install -D @next/bundle-analyzer
```

Then add to `next.config.js`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

## ✅ Testing the Configuration

1. **Build Test**:
   ```bash
   npm run build
   ```

2. **Lint Check**:
   ```bash
   npm run lint
   ```

3. **Production Start**:
   ```bash
   npm run start
   ```

## 📝 Notes

- Security headers may need adjustment based on your specific requirements
- Image remote patterns can be expanded if needed
- Webpack optimizations are production-only to maintain dev experience
- ESLint rules can be adjusted based on team preferences

## 🔄 Migration Notes

If you're upgrading from the previous configuration:

1. **No breaking changes** - All existing functionality preserved
2. **New security headers** - May affect iframe embeds (adjust if needed)
3. **Standalone output** - May change deployment process (verify with your hosting)
4. **ESLint rules** - May show new warnings/errors (fix incrementally)

