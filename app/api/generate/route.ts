import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { requestImagesFromRenders } from '@/lib/server/renders-client';
import { clearStatusHistory, publishStatus, type StatusEvent } from '@/lib/server/status-bus';

export const runtime = 'nodejs';

type RouteType = 'text-to-image' | 'remix' | 'edit';

type ClientPayload = {
  requestId: string;
  prompt: string;
  image?: File | string | null;
  mask?: File | string | null;
  referenceImages: Array<File | string>;
  metadata: Record<string, string>;
  extras: Record<string, string | number>;
  mode?: RouteType;
};

const IGNORED_FIELDS = new Set([
  'style',
  'quality',
  'mood',
  'camera',
  'lighting',
  'composition',
  'colorPalette',
  'era',
  'genre',
  'preset',
  'subclass',
  'promptOptions',
]);

const EDIT_KEYWORDS = ['edit', 'replace', 'remove', 'erase', 'inpaint', 'retouch', 'swap', 'clean', 'modify', 'change'];
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.RENDERS_REQUEST_TIMEOUT_MS ?? '120000', 10);
const STATUS_CLEAR_DELAY_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  const controller = createAbortController();
  let clientPayload: ClientPayload | undefined;

  try {
    clientPayload = await parseClientRequest(request);
    const route = determineRoute(clientPayload);

    publishStatus(buildStatusEvent(clientPayload.requestId, route, 'QUEUED', 'Request queued'));
    publishStatus(
      buildStatusEvent(
        clientPayload.requestId,
        route,
        'STARTED',
        `Forwarding prompt to renders backend (${route})`,
      ),
    );

    const { formData, json } = buildRendersPayload(clientPayload, route);

    const response = await requestImagesFromRenders({
      path: `/reve/${route}`,
      requestId: clientPayload.requestId,
      formData,
      json,
      signal: controller?.signal,
    });

    publishStatus(
      buildStatusEvent(
        clientPayload.requestId,
        route,
        'COMPLETED',
        'Received generated images from renders backend',
      ),
    );

    scheduleStatusCleanup(clientPayload.requestId);

    return NextResponse.json({
      images: response.images,
      meta: { route, requestId: clientPayload.requestId },
    });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message ?? 'Unknown error';
    const requestId =
      clientPayload?.requestId ?? (error as any)?.requestId ?? randomUUID();
    const route = clientPayload ? determineRoute(clientPayload) : undefined;
    const alreadyNotified = Boolean((error as any)?.alreadyNotified);

    if (!alreadyNotified) {
      publishStatus(
        buildStatusEvent(requestId, route, 'FAILED', message, {
          code: 'RENDERS_REQUEST_FAILED',
          message,
          details: (error as any)?.details,
        }),
      );
    }
    scheduleStatusCleanup(requestId);

    return NextResponse.json({ error: { code: 'RENDERS_REQUEST_FAILED', message } }, { status });
  } finally {
    if (controller) {
      clearTimeout(controller.timeoutId);
    }
  }
}

function determineRoute(payload: ClientPayload): RouteType {
  if (payload.mode) {
    return payload.mode;
  }

  const referenceCount = payload.referenceImages.length;
  const hasMask = Boolean(payload.mask);
  const hasImage = Boolean(payload.image);

  if (referenceCount >= 2) {
    return 'remix';
  }

  if (hasImage) {
    const prompt = payload.prompt.toLowerCase();
    const hasEditKeyword = EDIT_KEYWORDS.some((keyword) => prompt.includes(keyword));
    if (hasMask || hasEditKeyword || referenceCount === 0) {
      return 'edit';
    }
  }

  if (referenceCount >= 1) {
    return 'remix';
  }

  return 'text-to-image';
}

function buildStatusEvent(
  requestId: string,
  route: RouteType | undefined,
  type: StatusEvent['type'],
  message: string,
  error?: StatusEvent['error'],
): StatusEvent {
  return {
    requestId,
    route,
    type,
    message,
    timestamp: Date.now(),
    error,
  };
}

function scheduleStatusCleanup(requestId: string) {
  setTimeout(() => {
    clearStatusHistory(requestId);
  }, STATUS_CLEAR_DELAY_MS);
}

async function parseClientRequest(request: NextRequest): Promise<ClientPayload> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    return normalizeJsonPayload(body);
  }

  const formData = await request.formData();
  return normalizeFormPayload(formData);
}

function normalizeJsonPayload(body: Record<string, any>): ClientPayload {
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const requestId =
    typeof body.requestId === 'string' && body.requestId.trim().length > 0 ? body.requestId : randomUUID();
  const referenceImages = Array.isArray(body.reference_images ?? body.referenceImages)
    ? (body.reference_images ?? body.referenceImages)
    : [];

  const extras = extractExtras(body);
  const metadata = normalizeMetadata(body.metadata);

  return {
    requestId,
    prompt,
    image: body.image ?? body.image_url ?? null,
    mask: body.mask ?? null,
    referenceImages,
    metadata,
    extras,
    mode: normalizeMode(body.mode),
  };
}

function normalizeFormPayload(formData: FormData): ClientPayload {
  const promptField = formData.get('prompt');
  const prompt = typeof promptField === 'string' ? promptField : '';

  const requestIdField = formData.get('requestId');
  const requestId =
    typeof requestIdField === 'string' && requestIdField.trim().length > 0
      ? requestIdField
      : randomUUID();

  const referenceImages = collectReferenceImages(formData);

  const imageField = formData.get('image');
  const image = imageField instanceof File || typeof imageField === 'string' ? imageField : null;

  const maskField = formData.get('mask');
  const mask = maskField instanceof File || typeof maskField === 'string' ? maskField : null;

  const metadata: Record<string, string> = { source: 'dashboard' };
  const extras: Record<string, string | number> = {};

  for (const [key, value] of formData.entries()) {
    if (key === 'prompt' || key === 'image' || key === 'mask' || key === 'requestId') {
      continue;
    }
    if (key === 'mode') {
      continue;
    }
    if (IGNORED_FIELDS.has(key) || key.startsWith('reference_')) {
      continue;
    }
    if (key.startsWith('metadata[') && typeof value === 'string') {
      const metadataKey = key.slice('metadata['.length, -1);
      metadata[metadataKey] = value;
      continue;
    }
    if (typeof value === 'string') {
      if (isNumericField(key)) {
        const numericValue = Number.parseFloat(value);
        if (!Number.isNaN(numericValue)) {
          extras[key] = numericValue;
        }
      } else if (isStringField(key)) {
        extras[key] = value;
      } else {
        metadata[key] = value;
      }
    }
  }

  return {
    requestId,
    prompt,
    image,
    mask,
    referenceImages,
    metadata,
    extras,
    mode: normalizeMode(formData.get('mode')),
  };
}

function collectReferenceImages(formData: FormData): Array<File | string> {
  const results: Array<File | string> = [];
  const candidates = [
    ...formData.getAll('reference_images'),
    ...formData.getAll('referenceImages'),
    ...formData.getAll('reference_images[]'),
  ];
  for (const value of candidates) {
    if (value instanceof File) {
      if (value.size > 0) {
        results.push(value);
      }
    } else if (typeof value === 'string' && value.trim().length > 0) {
      results.push(value);
    }
  }
  return results;
}

function extractExtras(body: Record<string, any>): Record<string, string | number> {
  const extras: Record<string, string | number> = {};
  for (const key of Object.keys(body)) {
    if (['prompt', 'image', 'image_url', 'mask', 'requestId', 'mode', 'reference_images', 'referenceImages', 'metadata'].includes(key)) {
      continue;
    }
    const value = body[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (isNumericField(key)) {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue)) {
        extras[key] = numericValue;
      }
    } else if (isStringField(key)) {
      extras[key] = String(value);
    }
  }
  return extras;
}

function buildRendersPayload(payload: ClientPayload, route: RouteType) {
  const hasFiles =
    route !== 'text-to-image' ||
    payload.image instanceof File ||
    payload.mask instanceof File ||
    payload.referenceImages.some((item) => item instanceof File);

  if (route === 'text-to-image' && !hasFiles) {
    return {
      json: {
        requestId: payload.requestId,
        prompt: payload.prompt,
        ...payload.extras,
      },
    };
  }

  const formData = new FormData();
  formData.append('requestId', payload.requestId);
  formData.append('prompt', payload.prompt);

  appendExtras(formData, payload.extras);
  appendMetadata(formData, payload.metadata);

  if (route !== 'text-to-image' && payload.image) {
    appendFormValue(formData, 'image', payload.image, payload.requestId);
  }

  if (route === 'edit' && payload.mask) {
    appendFormValue(formData, 'mask', payload.mask, payload.requestId);
  }

  if (route === 'remix') {
    payload.referenceImages.forEach((entry, index) => {
      appendFormValue(formData, 'reference_images', entry, `${payload.requestId}-${index + 1}`);
    });
  }

  return { formData };
}

function appendExtras(formData: FormData, extras: Record<string, string | number>) {
  Object.entries(extras).forEach(([key, value]) => {
    if (key === 'mode') {
      return;
    }
    formData.append(key, String(value));
  });
}

function appendMetadata(formData: FormData, metadata: Record<string, string>) {
  Object.entries(metadata).forEach(([key, value]) => {
    formData.append(`metadata[${key}]`, value);
  });
}

function appendFormValue(formData: FormData, key: string, value: File | string, requestId: string) {
  if (typeof value === 'string') {
    formData.append(key, value);
    return;
  }

  const filename = value.name || `${key}-${requestId}.png`;
  formData.append(key, value, filename);
}

function normalizeMetadata(metadata: unknown): Record<string, string> {
  if (!metadata || typeof metadata !== 'object') {
    return { source: 'dashboard' };
  }

  const entries = Object.entries(metadata as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = String(value);
    return acc;
  }, {});

  if (!entries.source) {
    entries.source = 'dashboard';
  }

  return entries;
}

function normalizeMode(value: unknown): RouteType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value === 'text-to-image' || value === 'remix' || value === 'edit') {
    return value;
  }
  return undefined;
}

function isNumericField(key: string): boolean {
  return ['seed', 'guidance_scale', 'width', 'height', 'num_inference_steps'].includes(key);
}

function isStringField(key: string): boolean {
  return ['aspect_ratio', 'output_format'].includes(key);
}

function createAbortController():
  | (AbortController & { timeoutId: ReturnType<typeof setTimeout> })
  | null {
  if (!Number.isFinite(DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS <= 0) {
    return null;
  }
  const controller = new AbortController() as AbortController & {
    timeoutId: ReturnType<typeof setTimeout>;
  };
  controller.timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  return controller;
}

export { determineRoute };
