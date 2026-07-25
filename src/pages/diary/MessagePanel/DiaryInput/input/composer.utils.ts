import type {
  Attachment,
  AttachmentType,
  BinaryAttachment,
  Message,
  MessageDecorator,
  MessageVariant,
  TodoItem,
} from '@/store/diary/type';

import { classifyAttachmentType } from '@/store/diary/attachment.registry';

import { createDefaultTimerDecorator } from '../decorator/timer/timer.utils';
import { createEmptyTodoItem, type ComposerDraft } from './composer.types';

export const createTicketDecorator = (): MessageDecorator => ({
  type: 'ticket',
  state: 'todo',
  ticked: false,
  placement: 'outside',
});

export const createTimerDecorator = (): MessageDecorator =>
  createDefaultTimerDecorator();

export const hasDraftContent = (draft: ComposerDraft): boolean => {
  if (draft.attachments.length > 0 || draft.decorators.length > 0) {
    return true;
  }

  if (draft.variant === 'todo') {
    return draft.todoItems.some(
      (item) => item.text.trim() || item.attachments.length > 0,
    );
  }

  return draft.text.trim().length > 0;
};

export const draftHasVariantContent = (draft: ComposerDraft): boolean => {
  if (draft.variant === 'todo') {
    return draft.todoItems.some((item) => item.text.trim());
  }

  return draft.text.trim().length > 0;
};

export const convertDraftToVariant = (
  draft: ComposerDraft,
  nextVariant: MessageVariant,
): Pick<ComposerDraft, 'variant' | 'text' | 'todoItems'> => {
  if (draft.variant === nextVariant) {
    return {
      variant: draft.variant,
      text: draft.text,
      todoItems: draft.todoItems,
    };
  }

  if (nextVariant === 'todo') {
    const lines = draft.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const items =
      lines.length > 0
        ? lines.map((line) => ({
            ...createEmptyTodoItem(),
            text: line,
          }))
        : [createEmptyTodoItem()];

    return { variant: 'todo', text: '', todoItems: items };
  }

  if (draft.variant === 'todo') {
    const text = draft.todoItems
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join('\n');

    return { variant: nextVariant, text, todoItems: [createEmptyTodoItem()] };
  }

  return {
    variant: nextVariant,
    text: draft.text,
    todoItems: [createEmptyTodoItem()],
  };
};

export const buildMessagePayload = (
  draft: ComposerDraft,
  chatboxId: string,
): Partial<Message> | null => {
  if (!hasDraftContent(draft)) {
    return null;
  }

  const base = {
    chatboxId,
    sender: 'user' as const,
    attachments: draft.attachments,
    decorators: draft.decorators,
    tagIds: [],
    pinned: false,
    archived: false,
    replyToMessageId: draft.replyToMessageId,
    sourceMessageId: null,
    reactions: [],
  };

  if (draft.variant === 'todo') {
    const items = draft.todoItems
      .filter((item) => item.text.trim() || item.attachments.length > 0)
      .map(
        (item): TodoItem => ({
          id: item.id,
          completed: item.completed,
          content: { text: item.text.trim() },
          attachments: item.attachments,
        }),
      );

    if (items.length === 0) {
      return null;
    }

    return {
      ...base,
      variant: 'todo',
      content: { items },
    };
  }

  if (draft.variant === 'ai') {
    return {
      ...base,
      variant: 'ai',
      content: { text: draft.text.trim() },
    };
  }

  return {
    ...base,
    variant: 'text',
    content: { text: draft.text.trim() },
  };
};

export const buildDraftFromMessage = (message: Message): ComposerDraft => {
  const base: ComposerDraft = {
    variant: message.variant,
    decorators: message.decorators,
    attachments: message.attachments,
    text: '',
    todoItems: [createEmptyTodoItem()],
    focused: false,
    replyToMessageId: message.replyToMessageId,
  };

  if (message.variant === 'todo') {
    const items = message.content.items.map((item) => ({
      id: item.id,
      completed: item.completed,
      text: item.content.text,
      attachments: item.attachments,
    }));

    return {
      ...base,
      text: '',
      todoItems: items.length > 0 ? items : [createEmptyTodoItem()],
    };
  }

  return {
    ...base,
    text: message.content.text,
    todoItems: [createEmptyTodoItem()],
  };
};

export const fileToAttachmentType = (
  file: File,
  kind: 'file' | 'image' | 'video',
): Exclude<AttachmentType, 'link'> => {
  if (kind === 'image') {
    return 'image';
  }

  if (kind === 'video') {
    return 'video';
  }

  return classifyAttachmentType(file.type, file.name);
};

export const createTempAttachment = (
  file: File,
  attachmentType: Exclude<AttachmentType, 'link'>,
  tempId: string,
  blobUrl: string,
): Attachment => {
  if (attachmentType === 'image') {
    return {
      id: tempId,
      type: 'image',
      url: blobUrl,
      name: file.name,
    };
  }

  if (attachmentType === 'video') {
    return {
      id: tempId,
      type: 'video',
      url: blobUrl,
      name: file.name,
    };
  }

  return {
    id: tempId,
    type: attachmentType,
    url: blobUrl,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  } as BinaryAttachment;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) {
    return '';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
