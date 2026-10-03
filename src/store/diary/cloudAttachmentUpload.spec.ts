import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sanitizeMessageForCloud } from '@/api/diary/mapper';

import type { CloudMessagePayload } from './type';

const { presignAttachment, uploadToPresignedUrl, finalizeAttachment } =
  vi.hoisted(() => ({
    presignAttachment: vi.fn(),
    uploadToPresignedUrl: vi.fn(),
    finalizeAttachment: vi.fn(),
  }));
vi.mock('@/api', () => ({
  finalizeAttachment,
  presignAttachment,
  uploadToPresignedUrl,
}));

import {
  materializeCloudAttachments,
  type RuntimeAttachment,
  type UploadRuntime,
} from './cloudAttachmentUpload';

const runtime = (): UploadRuntime => ({
  canonical: {},
  uploads: {},
  weights: {},
  controller: new AbortController(),
  previewUrls: [],
});

const base = (): CloudMessagePayload => ({
  id: 'ms:one',
  chatboxId: 'cb:one',
  sender: 'user',
  variant: 'text',
  content: { json: { type: 'doc' }, preview: 'hello' },
  tagIds: [],
  pinned: false,
  archived: false,
  replyToMessageId: null,
  sourceMessageId: null,
  reactions: [],
  attachments: [],
  decorators: [],
  linkPreview: null,
});

const localImage = (name: string): RuntimeAttachment => {
  const file = new File([name], name, { type: 'image/png' });
  return {
    id: `temp:${name}`,
    type: 'image',
    name,
    url: `blob:${name}`,
    file,
    previewUrl: `blob:${name}`,
    status: 'local',
  };
};

describe('Cloud attachment materialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presignAttachment.mockImplementation(({ fileName }: { fileName: string }) =>
      Promise.resolve({
        attachmentId: `att:${fileName}`,
        uploadUrl: `https://r2.example/${fileName}`,
        expiresAt: '',
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
      }),
    );
    uploadToPresignedUrl.mockImplementation(
      (
        _file: File,
        _contract: unknown,
        onProgress?: (progress: number) => void,
      ) => {
        onProgress?.(100);
        return Promise.resolve();
      },
    );
    finalizeAttachment.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        type: 'image',
        name: `${id}.png`,
        mimeType: 'image/png',
        size: 1,
      }),
    );
  });

  it('preserves ordering and emits canonical metadata only after finalize', async () => {
    const payload = base();
    payload.attachments = [localImage('a.png'), localImage('b.png')];
    const result = await materializeCloudAttachments(
      payload,
      runtime(),
      vi.fn(),
    );
    expect(result.attachments.map((item) => item.id)).toEqual([
      'att:a.png',
      'att:b.png',
    ]);
    expect(result.attachments[0]).not.toHaveProperty('file');
    expect(result.attachments[0]).not.toHaveProperty('url');
    const serialized = JSON.stringify(sanitizeMessageForCloud(result));
    expect(serialized).not.toMatch(/blob:|data:|uploadUrl|objectKey/);
    expect(serialized).not.toContain('"file"');
    expect(serialized).not.toContain('"status"');
    expect(uploadToPresignedUrl).toHaveBeenCalledTimes(2);
    expect(finalizeAttachment).toHaveBeenCalledTimes(2);
  });

  it('keeps Todo ownership and skips LinkAttachment', async () => {
    const payload = {
      ...base(),
      variant: 'todo' as const,
      content: {
        items: [
          {
            id: 'todo:one',
            completed: false,
            content: { json: { type: 'doc' }, preview: 'row' },
            attachments: [localImage('todo.png')],
          },
        ],
      },
      attachments: [
        { id: 'link:one', type: 'link' as const, url: 'https://example.com' },
      ],
    };
    const result = await materializeCloudAttachments(
      payload,
      runtime(),
      vi.fn(),
    );
    expect(result.attachments[0]?.type).toBe('link');
    expect(result.variant).toBe('todo');
    if (result.variant !== 'todo') throw new Error('Expected Todo payload');
    expect(result.content.items[0]?.attachments[0]?.id).toBe('att:todo.png');
    expect(presignAttachment).toHaveBeenCalledTimes(1);
  });

  it('reuses finalized attachments on retry', async () => {
    const payload = base();
    payload.attachments = [localImage('a.png')];
    const state = runtime();
    await materializeCloudAttachments(payload, state, vi.fn());
    await materializeCloudAttachments(payload, state, vi.fn());
    expect(presignAttachment).toHaveBeenCalledTimes(1);
  });

  it('limits direct uploads to three concurrent files', async () => {
    let active = 0;
    let maximum = 0;
    uploadToPresignedUrl.mockImplementation(() => {
      active += 1;
      maximum = Math.max(maximum, active);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          active -= 1;
          resolve();
        }, 0);
      });
    });
    const payload = base();
    payload.attachments = ['a', 'b', 'c', 'd'].map((name) =>
      localImage(`${name}.png`),
    );
    await materializeCloudAttachments(payload, runtime(), vi.fn());
    expect(maximum).toBe(3);
  });
});
