import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { runReveTextToImage } from '@/lib/server/reve-service';
import { publishStatus } from '@/lib/server/status-bus';

export const runtime = 'nodejs';

const NUMERIC_FIELDS = ['seed', 'guidance_scale', 'width', 'height', 'num_inference_steps'];
const STRING_FIELDS = ['aspect_ratio', 'output_format'];

export async function POST(request: NextRequest) {
  let requestId = randomUUID();

  try {
    const { prompt, extras, requestId: parsedRequestId } = await parseRequest(request);
    requestId = parsedRequestId;

    if (!prompt.trim()) {
      return NextResponse.json({ error: { code: 'INVALID_PROMPT', message: 'Prompt is required' } }, { status: 400 });
    }

    publishStatus({
      requestId,
      route: 'text-to-image',
      type: 'STARTED',
      message: 'Renders backend received text-to-image request',
      timestamp: Date.now(),
    });

    const images = await runReveTextToImage({
      requestId,
      prompt,
      extras,
    });

    return NextResponse.json({ images, meta: { route: 'text-to-image', requestId } });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message ?? 'Unknown error';
    return NextResponse.json({ error: { code: 'REVE_TEXT_TO_IMAGE_FAILED', message } }, { status });
  }
}

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    return {
      prompt: typeof body.prompt === 'string' ? body.prompt : '',
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

  const extras: Record<string, string | number> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'prompt' || key === 'requestId') {
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

  return { prompt, extras, requestId };
}

function extractExtras(body: Record<string, any>): Record<string, string | number> {
  const extras: Record<string, string | number> = {};
  for (const key of Object.keys(body)) {
    if (['prompt', 'requestId'].includes(key)) {
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

