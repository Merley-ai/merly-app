import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { runReveRemix } from '@/lib/server/reve-service';
import { publishStatus } from '@/lib/server/status-bus';

export const runtime = 'nodejs';

const NUMERIC_FIELDS = ['guidance_scale', 'width', 'height', 'num_inference_steps'];
const STRING_FIELDS = ['aspect_ratio', 'output_format'];

export async function POST(request: NextRequest) {
  let requestId = randomUUID();

  try {
    const { prompt, referenceImages, extras, requestId: parsedRequestId } = await parseRequest(request);
    requestId = parsedRequestId;

    if (!prompt.trim()) {
      return NextResponse.json({ error: { code: 'INVALID_PROMPT', message: 'Prompt is required' } }, { status: 400 });
    }

    if (referenceImages.length === 0) {
      return NextResponse.json(
        { error: { code: 'MISSING_REFERENCE_IMAGES', message: 'At least one reference image is required' } },
        { status: 400 },
      );
    }

    publishStatus({
      requestId,
      route: 'remix',
      type: 'STARTED',
      message: 'Renders backend received remix request',
      timestamp: Date.now(),
    });

    const images = await runReveRemix({
      requestId,
      prompt,
      referenceImages,
      extras,
    });

    return NextResponse.json({ images, meta: { route: 'remix', requestId } });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message ?? 'Unknown error';
    return NextResponse.json({ error: { code: 'REVE_REMIX_FAILED', message } }, { status });
  }
}

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const referenceImages = Array.isArray(body.reference_images ?? body.referenceImages)
      ? (body.reference_images ?? body.referenceImages)
      : [];

    return {
      prompt: typeof body.prompt === 'string' ? body.prompt : '',
      referenceImages,
      extras: extractExtras(body),
      requestId:
        typeof body.requestId === 'string' && body.requestId.trim().length > 0 ? body.requestId : randomUUID(),
    };
  }

  const formData = await request.formData();
  const promptField = formData.get('prompt');
  const prompt = typeof promptField === 'string' ? promptField : '';
  const requestIdField = formData.get('requestId');
  const requestId =
    typeof requestIdField === 'string' && requestIdField.trim().length > 0 ? requestIdField : randomUUID();

  const referenceImages = collectReferenceImages(formData);

  const extras: Record<string, string | number> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'prompt' || key === 'requestId' || key.startsWith('reference')) {
      continue;
    }
    if (typeof value === 'string') {
      if (NUMERIC_FIELDS.includes(key)) {
        const numeric = Number.parseFloat(value);
        if (!Number.isNaN(numeric)) {
          extras[key] = numeric;
        }
      } else if (STRING_FIELDS.includes(key)) {
        extras[key] = value;
      }
    }
  }

  return { prompt, referenceImages, extras, requestId };
}

function collectReferenceImages(formData: FormData): Array<File | string> {
  const results: Array<File | string> = [];
  const values = [
    ...formData.getAll('reference_images'),
    ...formData.getAll('referenceImages'),
    ...formData.getAll('reference_images[]'),
  ];

  for (const value of values) {
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
    if (['prompt', 'requestId', 'reference_images', 'referenceImages'].includes(key)) {
      continue;
    }
    const value = body[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (NUMERIC_FIELDS.includes(key)) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        extras[key] = numeric;
      }
    } else if (STRING_FIELDS.includes(key)) {
      extras[key] = String(value);
    }
  }
  return extras;
}

