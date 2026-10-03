import type { Attachment } from '@/store/diary/type';

import { apiRequest, ApiError } from '../client';

export type PresignAttachmentInput = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type PresignedAttachment = {
  attachmentId: string;
  uploadUrl: string;
  expiresAt: string;
  method: 'PUT';
  headers: Record<string, string> & { 'Content-Type': string };
};

export type AttachmentReadUrl = { url: string; expiresAt: string };

export type DurableAttachment = Exclude<Attachment, { type: 'link' }> & {
  name: string;
  mimeType: string;
  size: number;
  url?: never;
};

export const presignAttachment = (input: PresignAttachmentInput) =>
  apiRequest<PresignedAttachment>('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const finalizeAttachment = (attachmentId: string) =>
  apiRequest<DurableAttachment>(
    `/api/uploads/${encodeURIComponent(attachmentId)}/finalize`,
    { method: 'POST' },
  );

export const getAttachmentReadUrl = (attachmentId: string) =>
  apiRequest<AttachmentReadUrl>(
    `/api/uploads/${encodeURIComponent(attachmentId)}/url`,
  );

export const uploadToPresignedUrl = (
  file: File,
  contract: PresignedAttachment,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const detachAbort = () => signal?.removeEventListener('abort', abort);
    xhr.open(contract.method, contract.uploadUrl);
    xhr.withCredentials = false;
    Object.entries(contract.headers).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value);
    });
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      detachAbort();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(
          new ApiError(`R2 upload failed (${xhr.status})`, {
            status: xhr.status,
          }),
        );
      }
    });
    xhr.addEventListener('error', () => {
      detachAbort();
      reject(new ApiError('Could not upload the attachment to R2.'));
    });
    xhr.addEventListener('abort', () => {
      detachAbort();
      reject(
        new DOMException('The attachment upload was aborted.', 'AbortError'),
      );
    });
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    onProgress?.(0);
    xhr.send(file);
  });
