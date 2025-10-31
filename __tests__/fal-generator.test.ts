import { beforeEach, describe, expect, it, vi } from 'vitest';

const subscribeMock = vi.fn();
const configMock = vi.fn();

class MockApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

class MockValidationError extends Error {
  status: number;
  details: unknown[];
  constructor(message: string, details: unknown[] = []) {
    super(message);
    this.status = 422;
    this.details = details;
  }
}

vi.mock('@fal-ai/client', () => ({
  fal: {
    config: configMock,
    subscribe: subscribeMock,
  },
  ApiError: MockApiError,
  ValidationError: MockValidationError,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  subscribeMock.mockReset();
  configMock.mockReset();
  process.env = { ...originalEnv, FAL_API_KEY: 'test-key' };
});

describe('generateImagesWithFal', () => {
  it('throws when prompt is empty', async () => {
    const { generateImagesWithFal } = await import('@/lib/server/fal-generator');

    await expect(generateImagesWithFal({ prompt: '   ' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('returns normalized image urls from fal.ai', async () => {
    subscribeMock.mockResolvedValueOnce({
      data: {
        images: [
          { url: 'http://example.com/1.png' },
          { url: 'http://example.com/2.png' },
          { url: 'http://example.com/3.png' },
        ],
      },
      requestId: 'abc',
    });

    const { generateImagesWithFal } = await import('@/lib/server/fal-generator');

    const result = await generateImagesWithFal({ prompt: 'Stylish outfit in studio lighting' });

    expect(configMock).toHaveBeenCalledWith({ credentials: 'test-key' });
    expect(subscribeMock).toHaveBeenCalled();
    expect(result.images).toEqual([
      'http://example.com/1.png',
      'http://example.com/2.png',
      'http://example.com/3.png',
    ]);
  });

  it('throws when fal.ai returns fewer than three images', async () => {
    subscribeMock.mockResolvedValueOnce({
      data: {
        images: [{ url: 'http://example.com/1.png' }],
      },
      requestId: 'xyz',
    });

    const { generateImagesWithFal } = await import('@/lib/server/fal-generator');

    await expect(generateImagesWithFal({ prompt: 'Minimalist product shot' })).rejects.toMatchObject({
      status: 502,
    });
  });
});

