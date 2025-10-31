import { randomUUID } from 'crypto';
import { fal, ApiError, ValidationError, type QueueStatus } from '@fal-ai/client';

import { publishStatus } from '@/lib/server/status-bus';

type RouteType = 'text-to-image' | 'remix' | 'edit';

interface ReveTextToImageParams {
  requestId: string;
  prompt: string;
  extras?: Record<string, string | number>;
}

interface ReveEditParams {
  requestId: string;
  prompt: string;
  image: File | Blob | string;
  mask?: File | Blob | string | null;
  extras?: Record<string, string | number>;
}

interface ReveRemixParams {
  requestId: string;
  prompt: string;
  referenceImages: Array<File | Blob | string>;
  extras?: Record<string, string | number>;
}

const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.REVE_REQUEST_TIMEOUT_MS ?? '120000', 10);
const DEFAULT_POLL_INTERVAL_MS = Number.parseInt(process.env.REVE_POLL_INTERVAL_MS ?? '500', 10);

let configured = false;

function ensureFalConfigured() {
  if (configured) {
    return;
  }

  const direct = process.env.FAL_API_KEY ?? process.env.FAL_KEY;
  const keyId = process.env.FAL_KEY_ID;
  const keySecret = process.env.FAL_KEY_SECRET;

  if (direct) {
    fal.config({ credentials: direct, requestorBaseUrl: process.env.REVE_BASE_URL });
    configured = true;
    return;
  }

  if (keyId && keySecret) {
    fal.config({ credentials: `${keyId}:${keySecret}`, requestorBaseUrl: process.env.REVE_BASE_URL });
    configured = true;
    return;
  }

  throw Object.assign(new Error('Fal.ai credentials are not configured'), { status: 500 });
}

export async function runReveTextToImage(params: ReveTextToImageParams): Promise<string[]> {
  ensureFalConfigured();

  publishStatus({
    requestId: params.requestId,
    route: 'text-to-image',
    type: 'POLLING',
    message: 'Submitting text-to-image request to fal.ai',
    timestamp: Date.now(),
  });

  try {
    const input: Record<string, unknown> = {
      prompt: params.prompt,
      ...params.extras,
    };

    const result = await fal.subscribe('fal-ai/reve/text-to-image', {
      input,
      mode: 'polling',
      pollInterval: normalizePollInterval(),
      timeout: normalizeTimeout(),
      onQueueUpdate: (status: QueueStatus) => handleQueueUpdate(params.requestId, 'text-to-image', status),
    });

    const images = extractImages(result.data?.images, params.requestId, 'text-to-image');
    return ensureThreeImages(images, params.requestId, 'text-to-image');
  } catch (error) {
    handleFalError(error, params.requestId, 'text-to-image');
  }
}

export async function runReveEdit(params: ReveEditParams): Promise<string[]> {
  ensureFalConfigured();

  publishStatus({
    requestId: params.requestId,
    route: 'edit',
    type: 'POLLING',
    message: 'Submitting edit request to fal.ai',
    timestamp: Date.now(),
  });

  try {
    const input: Record<string, unknown> = {
      prompt: params.prompt,
      image_url: params.image,
      ...params.extras,
    };

  if (params.mask) {
    publishStatus({
      requestId: params.requestId,
      route: 'edit',
      type: 'POLLING',
      message: 'Mask provided but the Reve edit endpoint currently ignores masks.',
      timestamp: Date.now(),
    });
  }

    const result = await fal.subscribe('fal-ai/reve/edit', {
      input,
      mode: 'polling',
      pollInterval: normalizePollInterval(),
      timeout: normalizeTimeout(),
      onQueueUpdate: (status: QueueStatus) => handleQueueUpdate(params.requestId, 'edit', status),
    });

    const images = extractImages(result.data?.images, params.requestId, 'edit');
    return ensureThreeImages(images, params.requestId, 'edit');
  } catch (error) {
    handleFalError(error, params.requestId, 'edit');
  }
}

export async function runReveRemix(params: ReveRemixParams): Promise<string[]> {
  ensureFalConfigured();

  publishStatus({
    requestId: params.requestId,
    route: 'remix',
    type: 'POLLING',
    message: 'Submitting remix request to fal.ai',
    timestamp: Date.now(),
  });

  try {
    const imageUrls = await Promise.all(params.referenceImages.map((image) => toDataUrl(image)));

    const input: Record<string, unknown> = {
      prompt: params.prompt,
      image_urls: imageUrls,
      ...params.extras,
    };

    const result = await fal.subscribe('fal-ai/reve/remix', {
      input,
      mode: 'polling',
      pollInterval: normalizePollInterval(),
      timeout: normalizeTimeout(),
      onQueueUpdate: (status: QueueStatus) => handleQueueUpdate(params.requestId, 'remix', status),
    });

    const images = extractImages(result.data?.images, params.requestId, 'remix');
    return ensureThreeImages(images, params.requestId, 'remix');
  } catch (error) {
    handleFalError(error, params.requestId, 'remix');
  }
}

async function toDataUrl(value: File | Blob | string): Promise<string> {
  if (typeof value === 'string') {
    return value;
  }
  const buffer = Buffer.from(await value.arrayBuffer());
  const mime = value.type || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function extractImages(
  images: Array<{ url: string }> | undefined,
  requestId: string,
  route: RouteType,
): string[] {
  if (!images || images.length === 0) {
    throw Object.assign(new Error('Fal.ai did not return any images'), { status: 502, requestId, route });
  }
  return images.map((image) => image.url);
}

function ensureThreeImages(images: string[], requestId: string, route: RouteType): string[] {
  if (images.length >= 3) {
    return images.slice(0, 3);
  }

  const result = [...images];
  while (result.length < 3) {
    result.push(result[result.length - 1] ?? images[0]);
  }

  publishStatus({
    requestId,
    route,
    type: 'POLLING',
    message: `Fal.ai returned ${images.length} image(s); duplicating to reach 3.`,
    timestamp: Date.now(),
  });

  return result.slice(0, 3);
}

function handleQueueUpdate(requestId: string, route: RouteType, update: QueueStatus) {
  let message = 'Job update received';
  if (update.status === 'IN_QUEUE') {
    message = `Queued (position ${'queue_position' in update ? update.queue_position : 'unknown'})`;
  } else if (update.status === 'IN_PROGRESS') {
    message = 'Generation in progress';
  } else if (update.status === 'COMPLETED') {
    message = 'Generation completed on fal.ai';
  }

  publishStatus({
    requestId,
    route,
    type: 'POLLING',
    message,
    timestamp: Date.now(),
  });
}

function handleFalError(error: unknown, requestId: string, route: RouteType): never {
  if (error instanceof ValidationError) {
    publishStatus({
      requestId,
      route,
      type: 'FAILED',
      message: 'Fal.ai validation error',
      timestamp: Date.now(),
      error: {
        code: 'FAL_VALIDATION_ERROR',
        message: error.message,
        details: error.details,
      },
    });
    throw Object.assign(new Error(error.message), {
      status: 422,
      requestId,
      details: error.details,
      alreadyNotified: true,
    });
  }

  if (error instanceof ApiError) {
    publishStatus({
      requestId,
      route,
      type: 'FAILED',
      message: 'Fal.ai API error',
      timestamp: Date.now(),
      error: {
        code: 'FAL_API_ERROR',
        message: error.message,
      },
    });
    throw Object.assign(new Error(error.message), {
      status: error.status,
      requestId,
      alreadyNotified: true,
    });
  }

  const message = error instanceof Error ? error.message : 'Fal.ai request failed';

  publishStatus({
    requestId,
    route,
    type: 'FAILED',
    message,
    timestamp: Date.now(),
    error: {
      code: 'FAL_REQUEST_FAILED',
      message,
    },
  });

  throw Object.assign(new Error(message), { status: 502, requestId, alreadyNotified: true });
}

function normalizeTimeout(): number | undefined {
  if (Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return undefined;
}

function normalizePollInterval(): number {
  return Number.isFinite(DEFAULT_POLL_INTERVAL_MS) && DEFAULT_POLL_INTERVAL_MS > 0
    ? DEFAULT_POLL_INTERVAL_MS
    : 500;
}
