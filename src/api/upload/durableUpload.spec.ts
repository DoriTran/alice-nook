import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PresignedAttachment } from './durableUpload';

import { uploadToPresignedUrl } from './durableUpload';

class FakeXhr {
  static latest: FakeXhr;
  status = 200;
  withCredentials = true;
  method = '';
  url = '';
  body?: File;
  headers: Record<string, string> = {};
  listeners: Record<string, () => void> = {};
  uploadListener?: (event: ProgressEvent) => void;
  upload = {
    addEventListener: (
      _name: string,
      listener: (event: ProgressEvent) => void,
    ) => {
      this.uploadListener = listener;
    },
  };

  constructor() {
    FakeXhr.latest = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  addEventListener(name: string, listener: () => void) {
    this.listeners[name] = listener;
  }

  send(body: File) {
    this.body = body;
  }

  abort() {
    this.listeners.abort?.();
  }
}

describe('direct R2 upload transport', () => {
  beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
  });

  it('uses the exact signed method and headers without credentials', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const contract: PresignedAttachment = {
      attachmentId: 'att:1',
      uploadUrl: 'https://r2.example/signed',
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
    };
    const progress = vi.fn();
    const promise = uploadToPresignedUrl(file, contract, progress);
    const xhr = FakeXhr.latest;
    xhr.uploadListener?.({
      lengthComputable: true,
      loaded: 3,
      total: 5,
    } as ProgressEvent);
    xhr.listeners.load?.();
    await promise;

    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe(contract.uploadUrl);
    expect(xhr.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(xhr.withCredentials).toBe(false);
    expect(xhr.body).toBe(file);
    expect(progress).toHaveBeenCalledWith(60);
    expect(progress).toHaveBeenLastCalledWith(100);
  });

  it('aborts through AbortSignal', async () => {
    const controller = new AbortController();
    const promise = uploadToPresignedUrl(
      new File(['x'], 'x.bin'),
      {
        attachmentId: 'att:1',
        uploadUrl: 'https://r2.example/signed',
        expiresAt: '',
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
      },
      undefined,
      controller.signal,
    );
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
