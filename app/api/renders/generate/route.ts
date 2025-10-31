import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { generateImagesWithFal } from '@/lib/server/fal-generator';

export const runtime = 'nodejs';

type ParsedRequest = {
  prompt: string;
  image?: File | Blob | string;
  requestId: string;
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

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  try {
    const parsed = await parseRequest(request, requestId);
    console.info(`[renders:${parsed.requestId}] received generation request`);

    const result = await generateImagesWithFal(parsed);
    return NextResponse.json({ images: result.images });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as Error).message ?? 'Unknown error';
    console.error(`[renders:${requestId}] generation failed`, error);
    return NextResponse.json({ error: message }, { status });
  }
}

async function parseRequest(request: NextRequest, fallbackRequestId: string): Promise<ParsedRequest> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const image =
      typeof body.image === 'string'
        ? body.image
        : typeof body.image_url === 'string'
          ? body.image_url
          : undefined;
    const requestId = typeof body.requestId === 'string' ? body.requestId : fallbackRequestId;

    return { prompt, image, requestId };
  }

  const formData = await request.formData();
  const promptField = formData.get('prompt');
  const prompt = typeof promptField === 'string' ? promptField : '';

  let image: File | undefined;
  const imageField = formData.get('image');
  if (imageField instanceof File && imageField.size > 0) {
    image = imageField;
  }

  const requestIdField = formData.get('requestId');
  const requestId =
    typeof requestIdField === 'string' && requestIdField.trim().length > 0
      ? requestIdField
      : fallbackRequestId;

  // Ignore any prompt-layer hints coming from the client.
  for (const [key] of formData.entries()) {
    if (IGNORED_FIELDS.has(key)) {
      formData.delete(key);
    }
  }

  return { prompt, image, requestId };
}

