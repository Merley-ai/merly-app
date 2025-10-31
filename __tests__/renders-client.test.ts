import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
const originalEnv = { ...process.env };

vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  process.env = {
    ...originalEnv,
    RENDERS_API_BASE_URL: 'http://renders.test/api/',
  };
});

afterAll(() => {
  vi.unstubAllGlobals();
  process.env = originalEnv;
});

describe('requestImagesFromRenders', () => {
  it('throws when renders url is missing', async () => {
    delete process.env.RENDERS_API_BASE_URL;
    const { requestImagesFromRenders } = await import('@/lib/server/renders-client');

    await expect(
      requestImagesFromRenders({
        path: '/reve/text-to-image',
        json: { prompt: 'Test prompt' },
      }),
    ).rejects.toMatchObject({
      status: 500,
    });
  });

  it('forwards prompt and image to renders backend', async () => {
    const mockResponse = createMockResponse({
      ok: true,
      status: 200,
      json: async () => ({ images: ['a', 'b', 'c'] }),
    });
    fetchMock.mockResolvedValueOnce(mockResponse);

    const { requestImagesFromRenders } = await import('@/lib/server/renders-client');

    const formData = new FormData();
    formData.append('prompt', 'Studio fashion editorial');

    const result = await requestImagesFromRenders({
      path: '/reve/text-to-image',
      formData,
    });

    expect(result.images).toEqual(['a', 'b', 'c']);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://renders.test/api/reve/text-to-image');
    expect(options?.method).toBe('POST');

    const outgoingFormData = options?.body as FormData;
    expect(outgoingFormData.get('prompt')).toBe('Studio fashion editorial');
  });

  it('propagates renders backend errors', async () => {
    const mockResponse = createMockResponse({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Downstream failure' }),
    });
    fetchMock.mockResolvedValueOnce(mockResponse);

    const { requestImagesFromRenders } = await import('@/lib/server/renders-client');

    await expect(
      requestImagesFromRenders({
        path: '/reve/remix',
        json: { prompt: 'High key portrait', reference_images: ['http://example.com/img.png'] },
      }),
    ).rejects.toMatchObject({
      status: 502,
      message: 'Downstream failure',
    });
  });
});

function createMockResponse({
  ok,
  status,
  json,
}: {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}) {
  return {
    ok,
    status,
    json,
  } as unknown as Response;
}
