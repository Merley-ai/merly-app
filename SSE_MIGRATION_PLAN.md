# Server-Sent Events (SSE) Migration Plan

## Overview
Migrate from WebSocket to Server-Sent Events (SSE) for real-time image generation updates. SSE provides a simpler, more HTTP-friendly approach for server-to-client real-time communication.

## Background
- **Current**: WebSocket-based real-time updates with polling fallback
- **Target**: SSE-based real-time updates with polling fallback
- **Reason**: API is already configured for SSE, simpler implementation, better for unidirectional server-to-client communication

## Key Differences: WebSocket vs SSE

### WebSocket
- Bidirectional communication
- Custom protocol requiring handshake
- Requires separate port/endpoint management
- More complex reconnection logic
- Can be blocked by some proxies

### Server-Sent Events
- Unidirectional (server → client)
- Standard HTTP protocol
- Built-in reconnection
- Simpler implementation
- Better proxy compatibility
- Native browser EventSource API

## Implementation Tasks

### 1. Create SSE Hook (`hooks/useServerSentEvents.ts`)
**Status**: To be created

**Requirements**:
- Replace `useWebSocket` hook with `useServerSentEvents`
- Use native `EventSource` API
- Handle connection lifecycle (open, message, error, close)
- Automatic reconnection with exponential backoff
- Support for multiple request subscriptions
- Handle event parsing and dispatching

**Interface**:
```typescript
interface UseServerSentEventsReturn {
    isConnected: boolean
    reconnectCount: number
    subscribe: (requestId: string, handlers: SSEHandlers) => () => void
    disconnect: () => void
}

interface SSEHandlers {
    onSuccess?: (data: SSEMessage) => void
    onError?: (data: SSEMessage) => void
    onProgress?: (data: SSEMessage) => void
    onDisconnect?: () => void
}

interface SSEMessage {
    request_id: string
    status: 'OK' | 'ERROR' | 'PROGRESS'
    message?: string
    payload?: {
        images?: Array<{
            url: string
            content_type: string
            file_name: string
            file_size: number
            width: number
            height: number
        }>
        progress?: number
    }
}
```

**Key Features**:
- Connection to SSE endpoint (e.g., `/api/image-gen/events`)
- Event parsing from SSE data format
- Request ID filtering
- Handler management with Map
- Graceful error handling
- Connection state management

**API Endpoint**:
- Endpoint: `GET /api/image-gen/events?request_id={requestId}`
- Or: `GET /api/image-gen/events` (streams all user's requests)

### 2. Update Image Generation Hook (`hooks/useImageGeneration.ts`)
**Status**: To be modified

**Changes**:
- Replace `useWebSocket` import with `useServerSentEvents`
- Update subscription logic to use SSE handlers
- Keep polling fallback mechanism
- Update connection state checks
- Maintain same external API

**Specific Updates**:
```typescript
// Before
const { isConnected: wsConnected, subscribe: wsSubscribe } = useWebSocket()

// After
const { isConnected: sseConnected, subscribe: sseSubscribe } = useServerSentEvents()
```

- Update all `ws*` references to `sse*`
- Keep same message handling logic
- Maintain fallback to polling

### 3. Create SSE API Route (`app/api/image-gen/events/route.ts`)
**Status**: To be created

**Requirements**:
- Server-side SSE stream implementation
- Authentication check
- Filter events by user
- Optional filter by request_id query param
- Proper SSE headers and formatting
- Heartbeat/keep-alive mechanism
- Handle client disconnect

**Response Format**:
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: message
data: {"request_id":"123","status":"OK","payload":{...}}

event: message
data: {"request_id":"456","status":"PROGRESS","payload":{"progress":50}}

event: heartbeat
data: {"type":"ping"}
```

**Implementation Options**:

#### Option A: Proxy Backend SSE
- Connect to backend SSE endpoint
- Forward events to frontend
- Filter by user authentication
- Add any frontend-specific metadata

#### Option B: Poll Backend + Broadcast
- Poll backend for updates
- Maintain in-memory event stream per user
- Broadcast to connected SSE clients
- More complex but allows transformation

**Recommended**: Option A (simpler, real-time)

### 4. Update Hook Exports (`hooks/index.ts`)
**Status**: To be modified

**Changes**:
```typescript
// Remove
export { useWebSocket } from './useWebSocket'
export type { WebSocketMessage, WebSocketHandlers } from './useWebSocket'

// Add
export { useServerSentEvents } from './useServerSentEvents'
export type { SSEMessage, SSEHandlers } from './useServerSentEvents'
```

### 5. Remove WebSocket Hook (`hooks/useWebSocket.ts`)
**Status**: To be deleted

**Action**: Delete file after SSE implementation is complete and tested

### 6. Update Type Definitions
**Status**: To be modified/created

**Files**:
- Create `types/sse.ts` for SSE-specific types
- Update `types/index.ts` to export SSE types
- Ensure compatibility with existing `TimelineEntry` and `GalleryImage` types

### 7. Testing & Validation
**Status**: To be performed

**Test Cases**:
1. **Connection Establishment**
   - Verify SSE connection on component mount
   - Check authentication headers
   - Validate connection state updates

2. **Event Reception**
   - Submit generation request
   - Verify success events received
   - Verify error events received
   - Check progress updates (if supported)

3. **Multiple Subscriptions**
   - Submit multiple requests
   - Verify each subscription receives correct events
   - Check event filtering by request_id

4. **Reconnection**
   - Simulate connection drop
   - Verify automatic reconnection
   - Check subscription restoration

5. **Fallback to Polling**
   - Disable SSE connection
   - Verify polling fallback works
   - Check seamless transition

6. **Cleanup**
   - Unmount component
   - Verify SSE connection closed
   - Check no memory leaks

### 8. Error Handling & Edge Cases
**Status**: To be implemented

**Scenarios**:
- SSE connection fails → fallback to polling
- SSE disconnects during generation → reconnect + resume
- Browser doesn't support EventSource → graceful degradation
- Network timeout → retry with backoff
- Invalid event data → log error, continue listening
- User authentication expires → close connection, show error

## Implementation Sequence

### Phase 1: Setup (Create new infrastructure)
1. ✅ Create `types/sse.ts` with SSE type definitions
2. ✅ Create `hooks/useServerSentEvents.ts` with basic structure
3. ✅ Create `app/api/image-gen/events/route.ts` with SSE endpoint

### Phase 2: Integration (Connect to existing code)
4. ✅ Update `hooks/useImageGeneration.ts` to use SSE instead of WebSocket
5. ✅ Update `hooks/index.ts` to export SSE hook
6. ✅ Update `types/index.ts` to export SSE types

### Phase 3: Cleanup (Remove old code)
7. ✅ Remove `hooks/useWebSocket.ts`
8. ✅ Remove WebSocket-related type exports from `hooks/index.ts`

### Phase 4: Testing (Verify functionality)
9. ✅ Test SSE connection and event handling
10. ✅ Test polling fallback
11. ✅ Test multiple concurrent requests
12. ✅ Test error scenarios
13. ✅ Verify no regressions in image generation flow

## API Contract

### Backend SSE Endpoint
**Assumption**: Backend provides SSE endpoint

**Expected Endpoint**:
```
GET /v1/image-gen/events?request_id={requestId}
Authorization: Bearer {token}
```

**Expected Event Format**:
```javascript
// Success Event
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "OK",
  "payload": {
    "images": [
      {
        "url": "https://url.to/image.png",
        "content_type": "image/png",
        "file_name": "image.png",
        "file_size": 1824075,
        "width": 1024,
        "height": 1024
      }
    ]
  }
}

// Error Event
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "ERROR",
  "message": "Invalid status code: 422"
}

// Progress Event (optional)
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "PROGRESS",
  "payload": {
    "progress": 50
  }
}
```

### Frontend API Route
**New Endpoint**:
```
GET /api/image-gen/events?request_id={requestId}
```

**Purpose**: Proxy to backend SSE endpoint with authentication

## Rollback Plan

If SSE implementation has issues:
1. Keep `useWebSocket.ts` temporarily (rename to `useWebSocket.backup.ts`)
2. Add feature flag to switch between SSE and WebSocket
3. Monitor error rates and performance
4. Rollback by restoring WebSocket imports if needed

## Benefits of SSE Migration

1. **Simpler Implementation**: Native browser API, less boilerplate
2. **HTTP-friendly**: Uses standard HTTP, better proxy support
3. **Auto-reconnection**: Built-in reconnection handling
4. **Better for Unidirectional**: Perfect for server → client updates
5. **Easier Debugging**: Standard HTTP tools work
6. **Lower Overhead**: Less protocol overhead than WebSocket

## Considerations

1. **Browser Support**: EventSource is widely supported (IE 11 needs polyfill)
2. **Connection Limits**: Browsers limit concurrent HTTP connections (typically 6 per domain)
3. **Unidirectional**: If bidirectional needed later, may need to reconsider
4. **Backend Support**: Requires backend to support SSE streaming

## Success Criteria

- [ ] SSE connection established successfully
- [ ] Generation events received in real-time
- [ ] Optimistic placeholders update with generated images
- [ ] Error events handled gracefully
- [ ] Automatic reconnection works
- [ ] Polling fallback functions correctly
- [ ] No regressions in existing functionality
- [ ] All tests pass
- [ ] No memory leaks
- [ ] Performance is equal or better than WebSocket

## Timeline Estimate

- Phase 1 (Setup): 1-2 hours
- Phase 2 (Integration): 1-2 hours
- Phase 3 (Cleanup): 30 minutes
- Phase 4 (Testing): 1-2 hours
- **Total**: 4-6 hours

## Notes

- SSE is text-based, so large binary data should still be URLs
- Consider adding request_id to SSE connection URL for server-side filtering
- Implement connection pooling if multiple requests need simultaneous monitoring
- Add telemetry to compare SSE vs polling performance
- Document the event format for future reference

## Questions to Clarify with Backend Team

1. What is the exact SSE endpoint URL?
2. Does it filter by request_id via query param?
3. What authentication method does it expect?
4. What is the exact event format (field names, structure)?
5. Are progress events supported?
6. What is the connection timeout/keep-alive interval?
7. How are errors formatted in the event stream?
8. Is there a heartbeat/ping mechanism?

