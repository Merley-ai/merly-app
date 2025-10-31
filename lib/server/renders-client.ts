import { randomUUID } from 'crypto';

export interface RendersClientRequest {
  path: string;
  requestId?: string;
  formData?: FormData;
  json?: Record<string, unknown>;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export interface RendersClientResponse {
  images: string[];
  meta?: Record<string, unknown>;
}

function resolveBaseUrl(): URL {
  const target = process.env.RENDERS_API_BASE_URL ?? process.env.RENDERS_API_URL;
  if (!target) {
    throw Object.assign(new Error('RENDERS_API_BASE_URL is not configured'), { status: 500 });
  }

  try {
    return new URL(target.endsWith('/') ? target : `${target}/`);
  } catch {
    throw Object.assign(new Error('RENDERS_API_BASE_URL must be an absolute URL'), { status: 500 });
  }
}

function buildHeaders(additional?: HeadersInit): HeadersInit {
  const headers: HeadersInit = additional ? { ...additional } : {};
  const token = process.env.RENDERS_API_TOKEN;
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function requestImagesFromRenders({
  path,
  requestId = randomUUID(),
  formData,
  json,
  signal,
  headers,
}: RendersClientRequest): Promise<RendersClientResponse> {
  if (!formData && !json) {
    throw Object.assign(new Error('Either formData or json payload is required for renders request'), {
      status: 400,
    });
  }

  const baseUrl = resolveBaseUrl();
  const url = new URL(path.replace(/^\//, ''), baseUrl);
  const requestHeaders = buildHeaders(headers);
  const init: RequestInit = {
    method: 'POST',
    signal,
    headers: requestHeaders,
  };

  if (formData) {
    init.body = formData;
  } else if (json) {
    (requestHeaders as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  }

  console.info(`[dashboard:${requestId}] forwarding request to renders backend ${url.href}`);

  try {
    const response = await fetch(url, init);

    const payload = await safeParseJson(response);
    if (!response.ok) {
      console.error(
        `[dashboard:${requestId}] renders backend error status=${response.status} body=${JSON.stringify(payload)}`,
      );
      throw Object.assign(new Error(payload?.error?.message ?? payload?.error ?? 'Renders backend error'), {
        status: response.status,
        details: payload?.error,
      });
    }

    if (!payload || !Array.isArray(payload.images)) {
      console.error(
        `[dashboard:${requestId}] renders backend returned invalid payload: ${JSON.stringify(payload)}`,
      );
      throw Object.assign(new Error('Invalid response from renders backend'), { status: 502 });
    }

    const images = payload.images.map((image: unknown) => String(image)).slice(0, 3);
    if (images.length !== 3) {
      console.warn(`[dashboard:${requestId}] renders backend returned ${images.length} image(s), expected 3`);
    } else {
      console.info(`[dashboard:${requestId}] renders backend returned ${images.length} image(s)`);
    }

    return {
      images,
      meta: payload.meta ?? {},
    };
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      console.error(`[dashboard:${requestId}] request to renders backend aborted`, error);
      throw Object.assign(new Error('Request to renders backend timed out'), { status: 504 });
    }

    if ((error as any)?.status) {
      throw error;
    }

    console.error(`[dashboard:${requestId}] request to renders backend failed`, error);
    throw Object.assign(new Error('Failed to reach renders backend'), { status: 502 });
  }
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

