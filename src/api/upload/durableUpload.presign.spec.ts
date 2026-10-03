import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_ATTACHMENT_SIZE_BYTES } from './attachmentSize';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('../client', () => ({
  apiRequest,
  ApiError: class MockApiError extends Error {},
}));

import { presignAttachment } from './durableUpload';

const input = (size: number) => ({
  fileName: 'archive.zip',
  mimeType: 'application/zip',
  size,
});

describe('attachment presign size preflight', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows exactly 200 MiB to reach the presign API', () => {
    apiRequest.mockResolvedValue({});

    void presignAttachment(input(MAX_ATTACHMENT_SIZE_BYTES));

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects 200 MiB plus one byte without a presign request', () => {
    expect(() =>
      presignAttachment(input(MAX_ATTACHMENT_SIZE_BYTES + 1)),
    ).toThrow('Attachment exceeds the 200 MiB size limit');
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
