import { EventEmitter } from 'events';

export type StatusType =
  | 'QUEUED'
  | 'STARTED'
  | 'POLLING'
  | 'PARTIAL_RESULT'
  | 'COMPLETED'
  | 'FAILED';

export interface StatusEvent {
  requestId: string;
  type: StatusType;
  route?: 'text-to-image' | 'remix' | 'edit';
  message?: string;
  progress?: number;
  previews?: string[];
  timestamp: number;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type StatusListener = (event: StatusEvent) => void;

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const history = new Map<string, StatusEvent[]>();

export function publishStatus(event: StatusEvent) {
  const events = history.get(event.requestId) ?? [];
  events.push(event);
  history.set(event.requestId, events);
  emitter.emit(event.requestId, event);
}

export function subscribeToStatus(requestId: string, listener: StatusListener) {
  const events = history.get(requestId) ?? [];
  events.forEach(listener);

  emitter.on(requestId, listener);

  return () => {
    emitter.off(requestId, listener);
  };
}

export function clearStatusHistory(requestId: string) {
  history.delete(requestId);
  emitter.removeAllListeners(requestId);
}

export function getStatusHistory(requestId: string): StatusEvent[] {
  return history.get(requestId) ?? [];
}

