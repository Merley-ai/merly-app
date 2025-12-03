# New Relic APM Setup

This document describes the New Relic observability configuration for the Merly application.

## Application Logger

Use the structured logger for consistent logging across the app:

```typescript
import { logger } from '@/lib/logger'

// Basic usage
logger.info('User logged in', { userId: '123' })
logger.error('Payment failed', { orderId: '456', error: err.message })
logger.debug('Cache hit', { key: 'user:123' })

// Child logger with preset context (useful in API routes)
const reqLogger = logger.child({ requestId: 'abc-123', userId: user.sub })
reqLogger.info('Processing request')
reqLogger.error('Request failed')

// Time an async operation
const result = await logger.time('fetchAlbums', async () => {
  return await fetch('/api/albums')
}, { userId: '123' })
```

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `fatal` | App crash, unrecoverable | `logger.fatal('Database connection lost')` |
| `error` | Errors needing attention | `logger.error('API call failed', { status: 500 })` |
| `warn` | Potential issues | `logger.warn('Deprecated endpoint used')` |
| `info` | Operational events | `logger.info('Image generated', { count: 4 })` |
| `debug` | Development details | `logger.debug('Cache state', { hits: 10 })` |
| `trace` | Granular flow tracking | `logger.trace('Entering function', { args })` |

### Output Format

- **Development**: Human-readable with colors
- **Production**: JSON for log aggregation

Set `LOG_FORMAT=json` to force JSON output in development.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# New Relic Configuration
# ========================

# Your New Relic license key (required)
# Get this from: New Relic Dashboard > API Keys > INGEST - LICENSE
NEW_RELIC_LICENSE_KEY=your_license_key_here

# Application name as it appears in New Relic dashboard
# Use different names for different environments
NEW_RELIC_APP_NAME=merly-app-dev

# Enable/disable New Relic agent
# Set to 'true' to enable monitoring
NEW_RELIC_ENABLED=true

# Log level for New Relic agent (optional)
# Options: fatal, error, warn, info, debug, trace
NEW_RELIC_LOG_LEVEL=info

# Application log level (optional, defaults based on NODE_ENV)
# Controls lib/logger.ts output
LOG_LEVEL=debug

# Force JSON log format in development (optional)
LOG_FORMAT=json
```

## Environment-Specific Configuration

| Environment | `NEW_RELIC_APP_NAME` | `NEW_RELIC_ENABLED` |
|-------------|----------------------|---------------------|
| Development | `merly-app-dev` | `false` (optional) |
| Staging | `merly-app-staging` | `true` |
| Production | `merly-app-prod` | `true` |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with New Relic enabled |
| `npm run dev:no-nr` | Development without New Relic |
| `npm run start` | Production with New Relic enabled |
| `npm run start:no-nr` | Production without New Relic |

## Files Modified

### Phase 1: Backend APM
- `newrelic.js` - New Relic agent configuration
- `next.config.js` - Webpack externals and server packages
- `package.json` - NPM scripts with NODE_OPTIONS
- `lib/logger.ts` - Structured logging utility

### Phase 2: Browser Agent
- `components/new-relic/NewRelicScript.tsx` - Browser agent injection component
- `app/layout.tsx` - Root layout with browser agent
- `types/newrelic.d.ts` - TypeScript types for window.newrelic

### Phase 3: Error Logging
- `lib/new-relic/error-reporter.ts` - Error reporting utilities
- `lib/new-relic/index.ts` - Centralized exports
- `app/error.tsx` - Client-side error boundary
- `app/global-error.tsx` - Root layout error boundary
- `lib/api/core.ts` - API error reporting integration

## Browser Agent Usage

Track client-side events and errors:

```typescript
// Report caught errors
try {
  await riskyOperation()
} catch (error) {
  window.newrelic?.noticeError(error as Error, { context: 'imageGeneration' })
}

// Track user actions
window.newrelic?.addPageAction('generateImage', {
  albumId: 'abc-123',
  prompt: 'fashion editorial'
})

// Set user context (after login)
window.newrelic?.setUserId(user.sub)
window.newrelic?.setCustomAttribute('plan', 'premium')

// Track SPA interactions
const interaction = window.newrelic?.interaction()
interaction?.setName('loadAlbum')
await fetchAlbumData()
interaction?.end()
```

## Verification

After setting up, verify the integration:

1. Start the application: `npm run dev`
2. Check console for New Relic agent startup messages
3. Visit [New Relic APM](https://one.newrelic.com/apm) to see your application

## Troubleshooting

### Agent not starting
- Verify `NEW_RELIC_ENABLED=true` is set
- Check `NEW_RELIC_LICENSE_KEY` is valid
- Ensure `newrelic.js` is in project root

### No data in dashboard
- Wait 2-3 minutes for initial data
- Check application logs for New Relic errors
- Verify network connectivity to New Relic endpoints

## Error Reporting Usage

### Client-Side Errors

```typescript
import { reportError, trackAction } from '@/lib/new-relic'

// Report caught errors
try {
  await generateImage(prompt)
} catch (error) {
  reportError(error as Error, { 
    context: 'imageGeneration',
    albumId: '123',
    prompt 
  })
}

// Track user actions
trackAction('generateImage', { albumId: '123', model: 'flux' })
```

### Server-Side Errors (API Routes)

```typescript
import { reportServerError } from '@/lib/new-relic'

export async function POST(request: Request) {
  try {
    // ... operation
  } catch (error) {
    reportServerError(error as Error, {
      context: 'imageGeneration',
      endpoint: '/api/image-gen/generate',
      userId: user.sub,
    })
    throw error
  }
}
```

### Error Boundaries

Errors in React components are automatically caught by:
- `app/error.tsx` - Route segment errors
- `app/global-error.tsx` - Root layout errors

Both report to New Relic automatically.

## Next Steps

- **Phase 4**: Performance Monitoring Enhancements (custom transactions, SSE tracking)
