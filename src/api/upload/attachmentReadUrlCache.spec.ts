import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAttachmentReadUrl } = vi.hoisted(() => ({
  getAttachmentReadUrl: vi.fn(),
}));
vi.mock('./durableUpload', () => ({ getAttachmentReadUrl }));

import {
  clearAttachmentReadUrlCache,
  resolvePrivateAttachmentUrl,
} from './attachmentReadUrlCache';

describe('private attachment URL cache', () => {
  beforeEach(() => {
    clearAttachmentReadUrlCache();
    getAttachmentReadUrl.mockReset();
  });

  it('deduplicates in-flight requests and reuses a valid URL', async () => {
    getAttachmentReadUrl.mockResolvedValue({
      url: 'https://r2.example/read-one',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
    const first = resolvePrivateAttachmentUrl('att:one');
    const second = resolvePrivateAttachmentUrl('att:one');
    await expect(first).resolves.toBe('https://r2.example/read-one');
    await expect(second).resolves.toBe('https://r2.example/read-one');
    await expect(resolvePrivateAttachmentUrl('att:one')).resolves.toBe(
      'https://r2.example/read-one',
    );
    expect(getAttachmentReadUrl).toHaveBeenCalledTimes(1);
  });

  it('refreshes a URL that is within the early-expiry window', async () => {
    getAttachmentReadUrl
      .mockResolvedValueOnce({
        url: 'https://r2.example/old',
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      })
      .mockResolvedValueOnce({
        url: 'https://r2.example/new',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      });
    await resolvePrivateAttachmentUrl('att:one');
    await expect(resolvePrivateAttachmentUrl('att:one')).resolves.toBe(
      'https://r2.example/new',
    );
    expect(getAttachmentReadUrl).toHaveBeenCalledTimes(2);
  });

  it('clears URLs between sessions', async () => {
    getAttachmentReadUrl.mockResolvedValue({
      url: 'https://r2.example/read',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
    await resolvePrivateAttachmentUrl('att:one');
    clearAttachmentReadUrlCache();
    await resolvePrivateAttachmentUrl('att:one');
    expect(getAttachmentReadUrl).toHaveBeenCalledTimes(2);
  });
});
