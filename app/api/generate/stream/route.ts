import { NextRequest } from 'next/server';

import { subscribeToStatus, type StatusEvent } from '@/lib/server/status-bus';

export const runtime = 'nodejs';

const KEEP_ALIVE_INTERVAL_MS = 15000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    return new Response('Missing requestId', { status: 400 });
  }

  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let keepAliveTimer: ReturnType<typeof setInterval> | undefined;
      let unsubscribed = false;

      const send = (event: StatusEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        if (event.type === 'COMPLETED' || event.type === 'FAILED') {
          queueMicrotask(() => {
            cleanup?.();
            cleanup = undefined;
            controller.close();
          });
        }
      };

      const unsubscribe = subscribeToStatus(requestId, send);

      keepAliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, KEEP_ALIVE_INTERVAL_MS);

      controller.enqueue(encoder.encode(`event: stream-open\ndata: ${JSON.stringify({ requestId })}\n\n`));
      cleanup = () => {
        if (!unsubscribed) {
          unsubscribed = true;
          unsubscribe();
        }
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
        }
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
