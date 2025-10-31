import { randomUUID } from 'crypto';
import { fal, ApiError, ValidationError, type QueueStatus } from '@fal-ai/client';
import { enhancePrompt, type PromptOptions } from '@/lib/prompt-layer';

const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
  style: 'photorealistic',
  quality: 'high',
  mood: 'dramatic',
  camera: 'professional',
  lighting: 'studio',
  composition: 'medium-shot',
};

const DEFAULT_IMAGE_SIZE = process.env.FAL_IMAGE_SIZE ?? 'square_hd';
const DEFAULT_TEXT_MODEL = process.env.FAL_TEXT_MODEL ?? 'fal-ai/flux/schnell';
const DEFAULT_IMAGE_MODEL = process.env.FAL_IMAGE_MODEL ?? 'fal-ai/flux/dev/image-to-image';
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.FAL_REQUEST_TIMEOUT_MS ?? '120000', 10);
const DEFAULT_POLL_INTERVAL_MS = Number.parseInt(process.env.FAL_POLL_INTERVAL_MS ?? '500', 10);
const DEFAULT_NUM_IMAGES = Number.parseInt(process.env.FAL_NUM_IMAGES ?? '3', 10) || 3;

type FalImageInput = File | Blob | string;

export interface GenerateImagesParams {
  prompt: string;
  image?: FalImageInput | null;
  requestId?: string;
}

export type GenerateImagesResult = {
  images: string[];
  requestId: string;
};

let configured = false;

function buildCredentials(): string {
  const direct = process.env.FAL_API_KEY ?? process.env.FAL_KEY;
  if (direct) {
    return direct;
  }

  const id = process.env.FAL_KEY_ID;
  const secret = process.env.FAL_KEY_SECRET;
  if (id && secret) {
    return `${id}:${secret}`;
  }

  throw Object.assign(new Error('Fal.ai credentials are not configured'), { status: 500 });
}

function ensureFalConfigured() {
  if (configured) {
    return;
  }

  const credentials = buildCredentials();
  fal.config({ credentials });
  configured = true;
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

function sanitizePrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw Object.assign(new Error('Prompt is required'), { status: 400 });
  }
  return trimmed;
}

function convertImage(image?: FalImageInput | null): FalImageInput | undefined {
  if (!image) {
    return undefined;
  }

  if (typeof image === 'string') {
    return image;
  }

  if (image instanceof Blob) {
    if ((image as File).size === 0) {
      return undefined;
    }
    return image;
  }

  return undefined;
}

export async function generateImagesWithFal(params: GenerateImagesParams): Promise<GenerateImagesResult> {
  ensureFalConfigured();

  const requestId = params.requestId ?? randomUUID();
  const prompt = sanitizePrompt(params.prompt);
  const image = convertImage(params.image);

  const enhanced = enhancePrompt(prompt, DEFAULT_PROMPT_OPTIONS);
  const finalPrompt = enhanced.enhanced ?? prompt;

  const timeout = normalizeTimeout();
  const pollInterval = normalizePollInterval();

  const endpoint = image ? DEFAULT_IMAGE_MODEL : DEFAULT_TEXT_MODEL;

  const input: Record<string, unknown> = {
    prompt: finalPrompt,
    num_images: DEFAULT_NUM_IMAGES,
    enable_safety_checker: true,
  };

  if (!image) {
    input.image_size = DEFAULT_IMAGE_SIZE;
  } else {
    input.image_url = image;
  }

  if (process.env.FAL_GUIDANCE_SCALE) {
    const scale = Number.parseFloat(process.env.FAL_GUIDANCE_SCALE);
    if (Number.isFinite(scale)) {
      input.guidance_scale = scale;
    }
  }

  if (process.env.FAL_NUM_INFERENCE_STEPS) {
    const steps = Number.parseInt(process.env.FAL_NUM_INFERENCE_STEPS, 10);
    if (Number.isInteger(steps) && steps > 0) {
      input.num_inference_steps = steps;
    }
  }

  console.info(`[renders:${requestId}] submitting request to fal.ai (${endpoint})`);

  try {
    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
      mode: 'polling',
      pollInterval,
      timeout,
      onQueueUpdate: (update: QueueStatus) => {
        console.info(
          `[renders:${requestId}] fal.ai status=${update.status}${
            'position' in update ? ` position=${update.queue_position}` : ''
          }`,
        );
      },
    });

    const images = result.data?.images ?? [];
    if (!Array.isArray(images) || images.length < DEFAULT_NUM_IMAGES) {
      throw Object.assign(
        new Error(`Fal.ai returned ${images.length} image(s); expected ${DEFAULT_NUM_IMAGES}`),
        { status: 502 },
      );
    }

    const normalized = images.slice(0, DEFAULT_NUM_IMAGES).map((imageInfo) => imageInfo.url);
    console.info(`[renders:${requestId}] generation completed with ${normalized.length} image(s)`);

    return {
      images: normalized,
      requestId: result.requestId,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`[renders:${requestId}] fal.ai validation error`, error);
      throw Object.assign(new Error(error.message), { status: 422, details: error.details });
    }

    if (error instanceof ApiError) {
      console.error(`[renders:${requestId}] fal.ai api error`, error);
      throw Object.assign(new Error(error.message), { status: error.status });
    }

    console.error(`[renders:${requestId}] fal.ai request failed`, error);
    throw Object.assign(new Error('Fal.ai request failed'), { status: 502 });
  }
}
