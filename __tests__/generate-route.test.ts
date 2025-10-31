import { describe, expect, it } from 'vitest';

import { determineRoute } from '@/app/api/generate/route';

const basePayload = {
  requestId: 'req-1',
  prompt: 'Create a striking editorial portrait',
  image: null,
  mask: null,
  referenceImages: [] as Array<File | string>,
  metadata: {},
  extras: {},
} satisfies Parameters<typeof determineRoute>[0];

describe('determineRoute', () => {
  it('routes prompt only requests to text-to-image', () => {
    expect(determineRoute({ ...basePayload })).toBe('text-to-image');
  });

  it('routes image edits to edit mode', () => {
    expect(
      determineRoute({
        ...basePayload,
        prompt: 'Please edit this look and remove the logo',
        image: 'https://example.com/image.png',
      }),
    ).toBe('edit');
  });

  it('routes remix with multiple reference images', () => {
    expect(
      determineRoute({
        ...basePayload,
        referenceImages: ['https://example.com/img1.png', 'https://example.com/img2.png'],
      }),
    ).toBe('remix');
  });

  it('honours explicit mode override', () => {
    expect(
      determineRoute({
        ...basePayload,
        mode: 'edit',
        image: 'https://example.com/img.png',
      }),
    ).toBe('edit');
  });
});

