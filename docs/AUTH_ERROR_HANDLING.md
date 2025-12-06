# Authentication Error Handling

## Overview

Automatic authentication error handling system that detects expired/invalid tokens and redirects users to logout without manual intervention.

## Architecture

### 1. Error Types (`lib/auth0/errors.ts`)

**AuthErrorCode Enum:**
- `TOKEN_EXPIRED` - Access token has expired
- `MISSING_REFRESH_TOKEN` - Refresh token not available
- `INVALID_TOKEN` - Token is invalid or malformed
- `NO_SESSION` - No active session found
- `UNAUTHORIZED` - Generic auth failure

**AuthTokenError Class:**
```typescript
new AuthTokenError(
  code: AuthErrorCode,
  message: string,
  shouldLogout: boolean = true
)
```

**handleAuthError Function:**
- Converts errors to standardized 401 responses
- Returns `AuthErrorResponse` with logout flag

### 2. Server-Side Token Management (`lib/auth0/server.ts`)

**getAccessToken():**
- Returns `Promise<string>` (never null)
- Throws `AuthTokenError` on failure
- Detects Auth0 SDK errors and converts them

```typescript
// Usage
const token = await getAccessToken() // Throws on error
```

### 3. API Route Wrapper (`lib/auth0/api-handler.ts`)

**withAuth(handler)** - For routes without params:
```typescript
export const GET = withAuth(async (request) => {
  const token = await getAccessToken()
  // ... handler logic
})
```

**withAuthParams(handler)** - For routes with params:
```typescript
export const GET = withAuthParams<ResponseType, ParamsType>(
  async (request, { params }) => {
    const { id } = await params
    const token = await getAccessToken()
    // ... handler logic
  }
)
```

### 4. Client-Side Interceptor

**Server-Side (`lib/api/core.ts`):**
- `apiFetch` detects 401 with `shouldLogout: true`
- Redirects to `/auth/logout` immediately

**Client-Side (`lib/api/client-fetch.ts`):**
- `clientFetch` wrapper for hooks
- Drop-in replacement for native `fetch`
- Auto-redirects on auth errors

```typescript
import { clientFetch } from '@/lib/api'

const response = await clientFetch('/api/album/getAll')
```

## Flow Diagram

```
User Request
    ↓
API Route (withAuth wrapper)
    ↓
getAccessToken() → Throws AuthTokenError
    ↓
withAuth catches error
    ↓
handleAuthError() → Returns 401 + shouldLogout: true
    ↓
Client receives response
    ↓
clientFetch/apiFetch detects shouldLogout
    ↓
window.location.href = '/auth/logout'
    ↓
User logged out & redirected to login
```

## Edge Cases Handled

### 1. Token Expired During Request
- **Scenario:** Token expires between page load and API call
- **Handling:** `getAccessToken()` throws `TOKEN_EXPIRED`
- **Result:** Auto-logout, user redirected

### 2. Missing Refresh Token
- **Scenario:** Auth0 session exists but refresh token missing
- **Handling:** `getAccessToken()` throws `MISSING_REFRESH_TOKEN`
- **Result:** Auto-logout with message "Session expired"

### 3. Invalid Token Format
- **Scenario:** Malformed or corrupted token
- **Handling:** `getAccessToken()` throws `INVALID_TOKEN`
- **Result:** Auto-logout, user must re-authenticate

### 4. No Session
- **Scenario:** User not logged in
- **Handling:** `getAccessToken()` throws `NO_SESSION`
- **Result:** Auto-logout, redirect to login

### 5. Network Errors
- **Scenario:** Backend unreachable
- **Handling:** Not treated as auth error
- **Result:** Standard error handling, no logout

### 6. Server-Side Rendering
- **Scenario:** API call during SSR
- **Handling:** `window` check prevents redirect errors
- **Result:** Error thrown, handled by Next.js

## Migration Guide

### API Routes

**Before:**
```typescript
export async function GET(request, { params }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    
    // ... nested try-catch
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**After:**
```typescript
export const GET = withAuthParams<ResponseType, ParamsType>(
  async (request, { params }) => {
    const token = await getAccessToken() // Auto-handled
    // ... clean logic
  }
)
```

### Client-Side Hooks

**Before:**
```typescript
const response = await fetch('/api/album/getAll')
```

**After:**
```typescript
import { clientFetch } from '@/lib/api'

const response = await clientFetch('/api/album/getAll')
```

## Testing Scenarios

### Manual Testing

1. **Expired Token:**
   - Wait for token to expire (check Auth0 settings)
   - Make API request
   - Verify auto-logout

2. **Invalid Token:**
   - Manually corrupt token in browser storage
   - Make API request
   - Verify auto-logout

3. **No Session:**
   - Clear all cookies
   - Make API request
   - Verify redirect to login

### Automated Testing

```typescript
// Example test
it('should redirect to logout on expired token', async () => {
  // Mock expired token
  jest.spyOn(auth0, 'getAccessToken').mockRejectedValue(
    new Error('Token expired')
  )
  
  const response = await fetch('/api/album/getAll')
  
  expect(response.status).toBe(401)
  expect(window.location.href).toContain('/auth/logout')
})
```

## Benefits

- ✅ **Zero boilerplate** - No manual auth checks in routes
- ✅ **Automatic logout** - Users never stuck with expired tokens
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Consistent** - Same error handling everywhere
- ✅ **Minimal** - Single responsibility, clean API
- ✅ **Scalable** - Easy to extend with new error codes
- ✅ **Testable** - Clear error boundaries

## Remaining Work

### Routes to Update (Optional)

Apply the pattern to remaining routes:
- `/api/album/getAll/route.ts`
- `/api/album/create/route.ts`
- `/api/album/update/route.ts`
- `/api/album/delete/route.ts`
- `/api/album/get/[id]/route.ts`
- `/api/image-gen/create/route.ts`
- `/api/image-gen/remix/route.ts`
- `/api/events/route.ts`
- `/api/subscription/status/route.ts`
- `/api/stripe/customer-session/route.ts`

### Hooks to Update (Optional)

Replace `fetch` with `clientFetch`:
- `useAlbumGallery.ts`
- `useAlbumTimeline.ts`
- `useAlbums.ts`
- `useImageGeneration.ts`
- `useSubscriptionStatus.ts`

## Troubleshooting

### Issue: Infinite redirect loop
**Cause:** Logout endpoint also requires auth
**Solution:** Exclude `/auth/*` routes from auth checks

### Issue: User not redirected
**Cause:** Response not properly formatted
**Solution:** Verify `shouldLogout: true` in response

### Issue: TypeScript errors
**Cause:** Missing type imports
**Solution:** Import `AuthErrorResponse` type

## References

- Auth0 SDK: https://github.com/auth0/nextjs-auth0
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Error Handling Best Practices: https://kentcdodds.com/blog/get-a-catch-block
