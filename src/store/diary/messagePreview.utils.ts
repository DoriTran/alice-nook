import { resolveAttachmentThumbnail } from '@/api';

import type {
  Attachment,
  AttachmentType,
  Message,
  MessagePreviewResolution,
  PreviewTile,
  TimerDecorator,
} from './type';

import {
  ATTACHMENT_TYPE_PRIORITY,
  emptyAttachmentTypeCounts,
  isBinaryAttachment,
} from './attachment.registry';
import { ATTACHMENT_TYPE_STYLE, PREVIEW_STYLES } from './constants';

export const collectMessageAttachments = (message: Message): Attachment[] => {
  const attachments = [...message.attachments];

  if (message.variant === 'todo') {
    for (const item of message.content.items) {
      attachments.push(...item.attachments);
    }
  }

  return attachments;
};

export type AttachmentTypeCounts = Record<AttachmentType, number>;

export const countAttachmentsByType = (
  attachments: Attachment[],
): AttachmentTypeCounts => {
  const counts = emptyAttachmentTypeCounts();

  for (const attachment of attachments) {
    counts[attachment.type] += 1;
  }

  return counts;
};

/** Highest count wins; ties break by ATTACHMENT_TYPE_PRIORITY order. */
export const pickWinningAttachmentType = (
  counts: AttachmentTypeCounts,
): AttachmentType | null => {
  let winner: AttachmentType | null = null;
  let bestCount = 0;

  for (const type of ATTACHMENT_TYPE_PRIORITY) {
    const count = counts[type];

    if (count > bestCount) {
      bestCount = count;
      winner = type;
    }
  }

  return bestCount > 0 ? winner : null;
};

export const pickRepresentativeAttachment = (
  attachments: Attachment[],
  type: AttachmentType,
): Attachment | undefined => attachments.find((item) => item.type === type);

export const getFileExtensionLabel = (
  nameOrUrl: string | undefined,
): string => {
  if (!nameOrUrl) {
    return 'FILE';
  }

  const trimmed = nameOrUrl.trim();
  const withoutQuery = trimmed.split(/[?#]/)[0] ?? trimmed;
  const base = withoutQuery.split('/').pop() ?? withoutQuery;
  const dot = base.lastIndexOf('.');

  if (dot <= 0 || dot === base.length - 1) {
    return 'FILE';
  }

  return `.${base.slice(dot + 1).toUpperCase()}`;
};

export const formatMessagePreviewTime = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${day} • ${time}`;
};

/**
 * Soft max for preview titles — same behavior as reply preview:
 * finishes the word that crosses the limit, then appends "...".
 */
export const truncatePreviewTitle = (text: string, maxChars = 50): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  let end = maxChars;
  const cutsMidWord =
    normalized[maxChars] !== ' ' && normalized[maxChars - 1] !== ' ';

  if (cutsMidWord) {
    const nextSpace = normalized.indexOf(' ', maxChars);
    end = nextSpace === -1 ? normalized.length : nextSpace;
  }

  const slice = normalized.slice(0, end).trimEnd();

  if (slice.length >= normalized.length) {
    return normalized;
  }

  return `${slice}...`;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Lightweight timer label for list previews (no live tick). */
export const getTimerPreviewTitle = (timer: TimerDecorator): string => {
  if (timer.mode === 'datetime') {
    const target = new Date(timer.targetDate);

    if (!Number.isNaN(target.getTime())) {
      return target.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return 'Countdown';
  }

  const totalSeconds = Math.max(0, Math.floor(timer.durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  return `${pad2(minutes)}:${pad2(seconds)}`;
};

export const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const resolvePreviewTile = (
  attachment: Attachment,
): PreviewTile | null => {
  if (attachment.type === 'image' || attachment.type === 'video') {
    return {
      kind: 'media',
      thumbnailUrl: resolveAttachmentThumbnail(attachment),
      mediaType: attachment.type,
    };
  }

  if (attachment.type === 'link') {
    return {
      kind: 'link',
      url: attachment.url,
      hostname: getHostname(attachment.url),
      previewUrl: attachment.previewUrl,
      previewTitle: attachment.previewTitle,
    };
  }

  if (isBinaryAttachment(attachment)) {
    return {
      kind: 'file',
      extension: getFileExtensionLabel(attachment.name ?? attachment.url),
      name: attachment.name,
    };
  }

  return null;
};

export const resolveMessageTitle = (message: Message): string => {
  if (message.variant === 'todo') {
    const first = message.content.items[0];

    return first ? `Todo: ${first.content.preview}` : 'Todo list';
  }

  const heading = message.decorators.find((item) => item.type === 'heading');

  if (heading?.type === 'heading' && heading.title.trim()) {
    return heading.title.trim();
  }

  const text = message.content.preview.trim();

  if (text) {
    return text;
  }

  const attachments = collectMessageAttachments(message);

  if (attachments.some((item) => item.type === 'image')) {
    return 'Photo';
  }

  if (attachments.some((item) => item.type === 'video')) {
    return 'Video';
  }

  if (attachments.some((item) => item.type === 'audio')) {
    return 'Audio';
  }

  const binary = attachments.find(isBinaryAttachment);

  if (binary) {
    return binary.name ?? 'Attachment';
  }

  if (attachments.some((item) => item.type === 'link')) {
    const link = attachments.find((item) => item.type === 'link');

    return link?.previewTitle ?? link?.name ?? 'Link';
  }

  const timer = message.decorators.find((item) => item.type === 'timer');

  if (timer && timer.type === 'timer') {
    return getTimerPreviewTitle(timer);
  }

  const ticket = message.decorators.find((item) => item.type === 'ticket');

  if (ticket) {
    return ticket.state === 'done' ? 'Ticket completed' : 'Ticket';
  }

  if (message.replyToMessageId) {
    return 'Reply';
  }

  if (message.sourceMessageId) {
    return 'Forwarded message';
  }

  return 'Message';
};

const withAttachments = (
  message: Message,
  base: Omit<
    MessagePreviewResolution,
    'preview' | 'attachmentCount' | 'timeLabel' | 'title'
  > & { title?: string },
): MessagePreviewResolution => {
  const attachments = collectMessageAttachments(message);
  const attachmentCount = attachments.length;
  const winningType = pickWinningAttachmentType(
    countAttachmentsByType(attachments),
  );
  const representative = winningType
    ? pickRepresentativeAttachment(attachments, winningType)
    : undefined;

  const rawTitle = base.title ?? resolveMessageTitle(message);

  return {
    ...base,
    title: truncatePreviewTitle(rawTitle),
    timeLabel: formatMessagePreviewTime(message.createdAt),
    attachmentCount,
    preview:
      attachmentCount > 0 && representative
        ? resolvePreviewTile(representative)
        : null,
  };
};

/**
 * Resolve icon, title, timestamp, and optional attachment preview for a message.
 *
 * Priority: special variant (todo/ai) → decorator → attachments → reply → normal.
 * Right-side preview is attachment-driven only (null when no attachments).
 */
export const resolveMessagePreview = (
  message: Message,
): MessagePreviewResolution => {
  if (message.variant === 'todo') {
    return withAttachments(message, {
      source: 'variant',
      ...PREVIEW_STYLES.todo,
    });
  }

  if (message.variant === 'ai') {
    return withAttachments(message, {
      source: 'variant',
      ...PREVIEW_STYLES.ai,
    });
  }

  const timer = message.decorators.find((item) => item.type === 'timer');

  if (timer && timer.type === 'timer') {
    return withAttachments(message, {
      source: 'decorator',
      ...PREVIEW_STYLES.timer,
      title: resolveMessageTitle(message) || getTimerPreviewTitle(timer),
    });
  }

  const ticket = message.decorators.find((item) => item.type === 'ticket');

  if (ticket) {
    return withAttachments(message, {
      source: 'decorator',
      ...PREVIEW_STYLES.ticket,
    });
  }

  const attachments = collectMessageAttachments(message);
  const winningType = pickWinningAttachmentType(
    countAttachmentsByType(attachments),
  );

  if (winningType) {
    return withAttachments(message, {
      source: 'attachment',
      ...ATTACHMENT_TYPE_STYLE[winningType],
      attachmentType: winningType,
    });
  }

  if (message.replyToMessageId) {
    return withAttachments(message, {
      source: 'reply',
      ...PREVIEW_STYLES.reply,
    });
  }

  return withAttachments(message, {
    source: 'normal',
    ...PREVIEW_STYLES.normal,
  });
};
