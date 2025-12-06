# API Routes Migration Guide

## Overview

Migration guide for updating API routes to use the new `withAuth` and `withAuthParams` wrappers for automatic authentication error handling.

## Completed Routes ✅

### Album Routes
- ✅ `/api/album/[id]/gallery` - withAuthParams
- ✅ `/api/album/[id]/timeline` - withAuthParams  
- ✅ `/api/album/getAll` - withAuth
- ✅ `/api/album/create` - withAuth (POST)
- ✅ `/api/album/update` - withAuth (PATCH)
- ✅ `/api/album/delete` - withAuth (DELETE)

## Migration Pattern

### Before: Traditional Error Handling
```typescript
export async function GET(request: NextRequest) {
  try {
    // Manual auth check
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Nested try-catch for backend
    try {
      const accessToken = await getAccessToken()
      
      const response = await apiFetchService(url, {
        headers: {
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      })
      
      return NextResponse.json(response.data)
    } catch (backendError) {
      return NextResponse.json({ error: 'Backend failed' }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**Issues:**
- 40+ lines of boilerplate
- Nested try-catch blocks
- Manual auth checks
- Conditional token headers
- Repetitive error handling

### After: withAuth Wrapper
```typescript
export const GET = withAuth(async (request: NextRequest) => {
  const user = await getUser()
  const accessToken = await getAccessToken() // Throws on error

  if (!user?.sub) {
    throw new Error('User ID not found')
  }

  const response = await apiFetchService(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  return NextResponse.json(response.data)
})
```

**Benefits:**
- 15 lines (60% reduction)
- Single error boundary
- Auto-logout on auth errors
- Clean, readable code
- Type-safe

## Route-Specific Patterns

### 1. Routes Without Params (withAuth)

**Use Case:** `/api/album/getAll`, `/api/album/create`, etc.

```typescript
import { withAuth } from '@/lib/auth0'

export const GET = withAuth<ResponseType>(async (request) => {
  const user = await getUser()
  const token = await getAccessToken()
  
  // Handler logic
  return NextResponse.json(data)
})
```

### 2. Routes With Params (withAuthParams)

**Use Case:** `/api/album/[id]/gallery`, `/api/album/[id]/timeline`, etc.

```typescript
import { withAuthParams } from '@/lib/auth0'

export const GET = withAuthParams<
  ResponseType,
  Promise<{ id: string }>
>(async (request, { params }) => {
  const { id } = await params
  const token = await getAccessToken()
  
  // Handler logic
  return NextResponse.json(data)
})
```

### 3. POST/PATCH/DELETE Routes

```typescript
export const POST = withAuth(async (request: NextRequest) => {
  const user = await getUser()
  const token = await getAccessToken()
  
  const body = await request.json()
  
  // Validation - throw errors instead of returning responses
  if (!body.name) {
    throw new Error('Name is required')
  }
  
  // Handler logic
  return NextResponse.json(result, { status: 201 })
})
```

## Validation Pattern

### ❌ Old Way (Type Issues)
```typescript
if (!name) {
  return NextResponse.json({ error: 'Name required' }, { status: 400 })
}
// TypeScript error: Return type mismatch
```

### ✅ New Way (Throw Errors)
```typescript
if (!name) {
  throw new Error('Name is required')
}
// Caught by withAuth, returns 500 with error message
```

### ✅ Alternative (Early Return with Correct Type)
```typescript
if (!name) {
  return NextResponse.json(
    { albums: [], count: 0 }, // Match success type
    { status: 200 }
  )
}
```

## Remaining Routes to Migrate

### Album Routes
- ⏳ `/api/album/get/[id]` - withAuthParams

### Image Generation Routes
- ⏳ `/api/image-gen/create` - withAuth (POST)
- ⏳ `/api/image-gen/edit` - withAuth (POST)
- ⏳ `/api/image-gen/generate` - withAuth (POST)
- ⏳ `/api/image-gen/remix` - withAuth (POST)

### Other Routes
- ⏳ `/api/events` - withAuth
- ⏳ `/api/subscription/status` - withAuth
- ⏳ `/api/stripe/customer-session` - withAuth

### Skip These Routes
- ❌ `/api/auth/access-token` - Auth route, don't wrap
- ❌ `/api/profile` - May have different auth requirements

## Step-by-Step Migration

### 1. Update Imports
```typescript
// Before
import { getUser, getAccessToken } from '@/lib/auth0/server'

// After
import { getUser, getAccessToken, withAuth } from '@/lib/auth0'
// or
import { getUser, getAccessToken, withAuthParams } from '@/lib/auth0'
```

### 2. Change Function Declaration
```typescript
// Before
export async function GET(request: NextRequest) {

// After (no params)
export const GET = withAuth(async (request: NextRequest) => {

// After (with params)
export const GET = withAuthParams(async (request, { params }) => {
```

### 3. Remove Manual Auth Checks
```typescript
// Remove this
const user = await getUser()
if (!user) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}
```

### 4. Remove Nested Try-Catch
```typescript
// Remove outer try-catch
// Remove inner backend try-catch
// Keep only the handler logic
```

### 5. Update Token Header
```typescript
// Before
headers: {
  ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
}

// After
headers: {
  'Authorization': `Bearer ${accessToken}`,
}
```

### 6. Close the Wrapper
```typescript
// Add closing parenthesis and bracket
})
```

## Testing Checklist

After migrating a route:

- [ ] Route compiles without TypeScript errors
- [ ] Route returns correct response on success
- [ ] Route returns 401 on expired token
- [ ] Route triggers auto-logout on auth error
- [ ] Validation errors are handled correctly
- [ ] Backend errors are handled correctly

## Common Issues & Solutions

### Issue: TypeScript Type Mismatch
**Error:** `Type 'X' is not assignable to type 'Y | AuthErrorResponse'`

**Solution:** Add type parameter to wrapper
```typescript
export const GET = withAuth<{ data: Album[] }>(async (request) => {
  // ...
})
```

### Issue: Validation Returns Wrong Type
**Error:** Early returns for validation don't match success type

**Solution:** Throw errors instead
```typescript
// Instead of
return NextResponse.json({ error: 'Invalid' }, { status: 400 })

// Use
throw new Error('Invalid input')
```

### Issue: User Might Be Null
**Error:** `'user' is possibly 'null'`

**Solution:** Add null check
```typescript
if (!user?.sub) {
  throw new Error('User ID not found')
}
```

## Performance Impact

- **Before:** ~40-80 lines per route
- **After:** ~15-30 lines per route
- **Reduction:** 50-60% less code
- **Maintainability:** ⬆️ Significantly improved
- **Type Safety:** ⬆️ Improved with explicit types
- **Error Handling:** ⬆️ Consistent across all routes

## Benefits Summary

### Code Quality
- ✅ 50-60% less boilerplate
- ✅ Single error boundary
- ✅ Consistent patterns
- ✅ Easier to read and maintain

### Security
- ✅ Automatic token validation
- ✅ Auto-logout on expiration
- ✅ No silent failures
- ✅ Consistent auth checks

### Developer Experience
- ✅ Less repetitive code
- ✅ Type-safe error handling
- ✅ Clear migration path
- ✅ Easy to test

## Next Steps

1. **Complete album routes** - Finish `/api/album/get/[id]`
2. **Migrate image-gen routes** - 4 routes to update
3. **Migrate utility routes** - events, subscription, stripe
4. **Update client hooks** - Replace `fetch` with `clientFetch`
5. **Add tests** - Test auth error scenarios
6. **Monitor production** - Verify auto-logout works correctly

## Resources

- [Auth Error Handling Docs](./AUTH_ERROR_HANDLING.md)
- [withAuth API Reference](../lib/auth0/api-handler.ts)
- [Example: Gallery Route](../app/api/album/[id]/gallery/route.ts)
- [Example: Timeline Route](../app/api/album/[id]/timeline/route.ts)
