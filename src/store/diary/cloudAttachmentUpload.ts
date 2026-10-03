import type { DurableAttachment } from '@/api/upload/durableUpload';

import {
  finalizeAttachment,
  presignAttachment,
  uploadToPresignedUrl,
} from '@/api';

import type { Attachment, CloudMessagePayload, Message } from './type';

export type UploadStage =
  | 'waiting'
  | 'presigning'
  | 'uploading'
  | 'finalizing'
  | 'done'
  | 'failed';

export type RuntimeUploadState = {
  stage: UploadStage;
  progress: number;
  error?: string;
};

export type RuntimeAttachment = Attachment & {
  file?: File;
  previewUrl?: string;
  status?: 'local';
};

export type UploadRuntime = {
  canonical: Record<string, DurableAttachment>;
  uploads: Record<string, RuntimeUploadState>;
  weights: Record<string, number>;
  controller: AbortController;
  previewUrls: string[];
};

const isRuntimeUpload = (
  attachment: Attachment,
): attachment is RuntimeAttachment & { file: File } =>
  'file' in attachment && attachment.file instanceof File;

const attachmentsFrom = (payload: CloudMessagePayload) => {
  const attachments = [...payload.attachments];
  if (payload.variant === 'todo') {
    payload.content.items.forEach((item) =>
      attachments.push(...item.attachments),
    );
  }
  return attachments;
};

export const cloneCloudDraftPreviews = (
  data: Partial<Message>,
): Partial<Message> => {
  const previewUrls: string[] = [];
  const clone = (attachment: Attachment): Attachment => {
    if (!isRuntimeUpload(attachment)) return attachment;
    const url = URL.createObjectURL(attachment.file);
    previewUrls.push(url);
    return { ...attachment, url, previewUrl: url } as Attachment;
  };
  const next = {
    ...data,
    attachments: data.attachments?.map(clone),
  } as Partial<Message>;
  if (next.variant === 'todo' && next.content) {
    next.content = {
      ...next.content,
      items: next.content.items.map((item) => ({
        ...item,
        attachments: item.attachments.map(clone),
      })),
    };
  }
  Object.defineProperty(next, '__previewUrls', { value: previewUrls });
  return next;
};

export const takeCloudDraftPreviewUrls = (value: object): string[] =>
  ((value as { __previewUrls?: string[] }).__previewUrls ?? []).slice();

const displayMetadata = (attachment: Attachment) => ({
  ...('width' in attachment && attachment.width !== undefined
    ? { width: attachment.width }
    : {}),
  ...('height' in attachment && attachment.height !== undefined
    ? { height: attachment.height }
    : {}),
  ...('duration' in attachment && attachment.duration !== undefined
    ? { duration: attachment.duration }
    : {}),
  ...('thumbnail' in attachment && attachment.thumbnail !== undefined
    ? { thumbnail: attachment.thumbnail }
    : {}),
});

export const materializeCloudAttachments = async (
  payload: CloudMessagePayload,
  runtime: UploadRuntime,
  onRuntimeChange: () => void,
  concurrency = 3,
) => {
  const pending = attachmentsFrom(payload).filter(isRuntimeUpload);
  pending.forEach((attachment) => {
    runtime.weights[attachment.id] = attachment.file.size;
  });
  let cursor = 0;
  const update = (id: string, patch: Partial<RuntimeUploadState>) => {
    runtime.uploads[id] = {
      ...(runtime.uploads[id] ?? { stage: 'waiting', progress: 0 }),
      ...patch,
    };
    onRuntimeChange();
  };
  const uploadOne = async (attachment: RuntimeAttachment & { file: File }) => {
    if (runtime.canonical[attachment.id]) return;
    const mimeType = attachment.file.type || 'application/octet-stream';
    try {
      update(attachment.id, {
        stage: 'presigning',
        progress: 0,
        error: undefined,
      });
      const contract = await presignAttachment({
        fileName: attachment.file.name,
        mimeType,
        size: attachment.file.size,
      });
      update(attachment.id, { stage: 'uploading' });
      await uploadToPresignedUrl(
        attachment.file,
        contract,
        (progress) => update(attachment.id, { progress }),
        runtime.controller.signal,
      );
      update(attachment.id, { stage: 'finalizing', progress: 100 });
      runtime.canonical[attachment.id] = {
        ...(await finalizeAttachment(contract.attachmentId)),
        ...displayMetadata(attachment),
      };
      update(attachment.id, { stage: 'done', progress: 100 });
    } catch (error) {
      update(attachment.id, {
        stage: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  };
  const worker = async () => {
    while (cursor < pending.length) {
      const attachment = pending[cursor];
      cursor += 1;
      if (attachment) await uploadOne(attachment);
    }
  };
  const results = await Promise.allSettled(
    Array.from({ length: Math.min(concurrency, pending.length) }, worker),
  );
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (failure) throw failure.reason;
  const replace = (attachment: Attachment) =>
    runtime.canonical[attachment.id] ?? attachment;
  return {
    ...payload,
    attachments: payload.attachments.map(replace),
    ...(payload.variant === 'todo'
      ? {
          content: {
            ...payload.content,
            items: payload.content.items.map((item) => ({
              ...item,
              attachments: item.attachments.map(replace),
            })),
          },
        }
      : {}),
  } as typeof payload;
};

export const uploadProgress = (runtime: UploadRuntime): number => {
  const values = Object.values(runtime.uploads);
  if (values.length === 0) return 0;
  const entries = Object.entries(runtime.uploads);
  const total = entries.reduce(
    (sum, [id]) => sum + (runtime.weights[id] ?? 1),
    0,
  );
  return Math.round(
    entries.reduce(
      (sum, [id, item]) => sum + item.progress * (runtime.weights[id] ?? 1),
      0,
    ) / total,
  );
};

export const releaseUploadRuntime = (runtime: UploadRuntime) => {
  runtime.controller.abort();
  runtime.previewUrls.forEach((url) => URL.revokeObjectURL(url));
};
