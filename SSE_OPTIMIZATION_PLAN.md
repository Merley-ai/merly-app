# SSE Implementation Optimization Plan

## Problem Statement

The SSE API call in `useImageGeneration.ts` (lines 144-147) is using a relative URL `/api/events?requestId=` which resolves to `https://www.merley.co/api/events` instead of using the `NEXT_PUBLIC_BACKEND_URL` environment variable (`https://api.merley.co/api/events`). This doesn't follow the project's architecture pattern where all backend API calls use the centralized `lib/api/core.ts` utilities.

## Current Architecture Analysis

### ✅ What's Working Well
1. **HTTP API Calls**: All HTTP requests use `lib/api/core.ts` → `apiFetch()` → `BACKEND_URL`
2. **Server-Side Routes**: Next.js API routes use `getBackendURL()` from `lib/api/core.ts`
3. **Type Safety**: Well-defined types in `types/image-generation.ts`
4. **SSE Proxy**: `/app/api/events/route.ts` correctly uses `getBackendURL()` to proxy backend SSE

### ❌ Current Issue
- **Client-Side SSE**: `useImageGeneration.ts` uses relative URL `/api/events` instead of backend URL
- **Inconsistency**: Doesn't follow the same pattern as other API calls
- **Hardcoded Path**: Relies on Next.js proxy route instead of direct backend connection

## Solution Options

### Option A: Direct Backend Connection (Recommended)
**Approach**: Create a client-side SSE utility that uses `NEXT_PUBLIC_BACKEND_URL` directly, following the same pattern as `apiFetch`.

**Pros**:
- Consistent with project architecture
- Uses environment variable directly
- Eliminates unnecessary proxy hop
- Better performance (direct connection)

**Cons**:
- Requires CORS configuration on backend
- May need authentication handling (if backend SSE requires auth)

### Option B: Keep Proxy, Use Environment Variable
**Approach**: Keep using Next.js proxy but ensure it uses the backend URL correctly (already working).

**Pros**:
- No CORS issues
- Can handle authentication server-side
- Already implemented

**Cons**:
- Extra network hop
- Still uses relative URL in hook (inconsistent)

## Recommended Solution: Option A with Fallback

Create a client-side SSE utility that:
1. Uses `NEXT_PUBLIC_BACKEND_URL` from environment
2. Follows the same pattern as `apiFetch` in `lib/api/core.ts`
3. Provides proper error handling and cleanup
4. Falls back to proxy route if direct connection fails

## Implementation Plan

### Phase 1: Create SSE Client Utility
**File**: `lib/api/image-gen/sse-client.ts`

**Tasks**:
1. Create `createSSEConnection()` function that:
   - Uses `NEXT_PUBLIC_BACKEND_URL` environment variable
   - Constructs backend SSE URL: `${BACKEND_URL}/v1/image-gen/events?request_id=${requestId}`
   - Returns EventSource instance with proper error handling
   - Follows same pattern as `apiFetch` in `lib/api/core.ts`

2. Export utility functions:
   - `createImageGenerationSSE(requestId: string): EventSource`
   - `getSSEUrl(requestId: string): string` (helper)

### Phase 2: Update Hook to Use New Utility
**File**: `hooks/useImageGeneration.ts`

**Tasks**:
1. Import SSE utility from `lib/api/image-gen/sse-client`
2. Replace hardcoded `/api/events` URL with `createImageGenerationSSE(requestId)`
3. Update EventSource creation to use new utility
4. Maintain existing error handling and cleanup logic

### Phase 3: Export from API Index
**File**: `lib/api/index.ts`

**Tasks**:
1. Export SSE client utilities for consistency

### Phase 4: Handle Edge Cases
**Considerations**:
1. **CORS**: Ensure backend allows CORS for SSE connections
2. **Authentication**: If backend SSE requires auth, may need to:
   - Use proxy route as fallback
   - Or pass auth token via query params (if supported)
3. **Error Handling**: Graceful fallback to proxy route if direct connection fails
4. **Environment Variables**: Ensure `NEXT_PUBLIC_BACKEND_URL` is set in all environments

### Phase 5: Testing & Validation
**Tasks**:
1. Test SSE connection with backend URL
2. Verify environment variable is used correctly
3. Test error handling and cleanup
4. Verify CORS configuration (if direct connection)
5. Test fallback mechanism (if implemented)

## File Structure Changes

```
lib/api/
  ├── core.ts                    (existing - no changes)
  ├── image-gen/
  │   ├── client.ts             (existing - no changes)
  │   └── sse-client.ts         (NEW - SSE client utility)
  └── index.ts                  (update - export SSE utilities)

hooks/
  └── useImageGeneration.ts     (update - use SSE client utility)
```

## Code Changes Summary

### New File: `lib/api/image-gen/sse-client.ts`
- Client-side SSE connection utility
- Uses `NEXT_PUBLIC_BACKEND_URL`
- Follows project architecture patterns

### Modified: `hooks/useImageGeneration.ts`
- Replace line 146: `const sseUrl = '/api/events?requestId=${requestIdValue}'`
- With: `const eventSource = createImageGenerationSSE(requestIdValue)`

### Modified: `lib/api/index.ts`
- Export SSE client utilities

## Benefits

1. **Consistency**: SSE follows same pattern as other API calls
2. **Environment-Aware**: Uses `NEXT_PUBLIC_BACKEND_URL` correctly
3. **Maintainability**: Centralized SSE logic in `lib/api`
4. **Performance**: Direct backend connection (if CORS allows)
5. **Type Safety**: Proper TypeScript types throughout

## Migration Notes

- The existing `/app/api/events/route.ts` proxy can remain as a fallback
- No breaking changes to hook API
- Backward compatible if environment variable is not set (can fallback to proxy)

## Next Steps

1. ✅ Review and approve plan
2. Implement Phase 1: Create SSE client utility
3. Implement Phase 2: Update hook
4. Implement Phase 3: Export utilities
5. Test and validate
6. Update documentation if needed

