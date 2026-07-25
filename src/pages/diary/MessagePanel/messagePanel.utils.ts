import type { Message } from '@/store/diary/type';

import { truncatePreviewTitle } from '@/store/diary/messagePreview.utils';

/** Soft max for composer reply preview; finishes the word that crosses the limit. */
export const truncateReplyPreviewText = truncatePreviewTitle;

export const getMessagePreviewText = (message: Message | undefined): string => {
  if (!message) {
    return 'Message unavailable';
  }

  if (message.variant === 'todo') {
    const firstItem = message.content.items[0];

    if (!firstItem) {
      return 'Todo list';
    }

    const count = message.content.items.length;

    return count > 1
      ? `${firstItem.content.text} (+${count - 1})`
      : firstItem.content.text;
  }

  if (message.content.text.trim()) {
    return message.content.text.trim();
  }

  if (message.attachments.length > 0) {
    const first = message.attachments[0];

    if (first.type === 'image') {
      return 'Photo';
    }

    if (first.type === 'video') {
      return 'Video';
    }

    if (first.type === 'link') {
      return 'Link';
    }

    return first.name ?? 'Attachment';
  }

  if (message.sourceMessageId) {
    return 'Forwarded message';
  }

  return 'Message';
};

export const getMessageSenderLabel = (
  message: Message | undefined,
  selfLabel = 'You',
): string => {
  if (!message) {
    return '';
  }

  return (message.sender ?? 'user') === 'assistant'
    ? 'AI Assistant'
    : selfLabel;
};

export const messageMatchesSearch = (
  message: Message,
  searchQuery: string,
): boolean => {
  const normalized = searchQuery.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (getMessagePreviewText(message).toLowerCase().includes(normalized)) {
    return true;
  }

  if (message.variant === 'todo') {
    return message.content.items.some((item) =>
      item.content.text.toLowerCase().includes(normalized),
    );
  }

  return message.content.text.toLowerCase().includes(normalized);
};
