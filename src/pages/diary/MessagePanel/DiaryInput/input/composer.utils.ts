import type {
  AttachmentType,
  BinaryAttachment,
  Message,
  MessageDecorator,
  MessageVariant,
  TodoItem,
} from '@/store/diary/type';

import {
  isRichTextEmpty,
  migratePlainTextToRichText,
} from '@/packages/base/AdRichText/richtext';
import { classifyAttachmentType } from '@/store/diary/attachment.registry';

import {
  collectDraftUrls,
  syncLinkPreviewState,
} from '../../LinkPreview/linkPreview.utils';
import { createDefaultTimerDecorator } from '../decorator/timer/timer.utils';
import {
  createEmptyTodoItem,
  type ComposerDraft,
  type DraftAttachment,
  type LocalDraftAttachment,
} from './composer.types';

export const createTicketDecorator = (): MessageDecorator => ({
  type: 'ticket',
  state: 'todo',
  ticked: false,
  placement: 'outside',
});

export const createTimerDecorator = (): MessageDecorator =>
  createDefaultTimerDecorator();

export const createHeadingDecorator = (): MessageDecorator => ({
  type: 'heading',
  title: '',
  description: '',
  headingLevel: 'h2',
  customFontSize: null,
});

export const hasDraftContent = (draft: ComposerDraft): boolean => {
  if (draft.attachments.length > 0 || draft.decorators.length > 0) {
    return true;
  }

  if (draft.variant === 'todo') {
    return draft.todoItems.some(
      (item) => item.text.trim() || item.attachments.length > 0,
    );
  }

  return !isRichTextEmpty(draft.content);
};

export const draftHasVariantContent = (draft: ComposerDraft): boolean => {
  if (draft.variant === 'todo') {
    return draft.todoItems.some((item) => item.text.trim());
  }

  return !isRichTextEmpty(draft.content);
};

export const convertDraftToVariant = (
  draft: ComposerDraft,
  nextVariant: MessageVariant,
): Pick<ComposerDraft, 'variant' | 'content' | 'todoItems'> => {
  if (draft.variant === nextVariant) {
    return {
      variant: draft.variant,
      content: draft.content,
      todoItems: draft.todoItems,
    };
  }

  if (nextVariant === 'todo') {
    const lines = draft.content.preview
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

    return {
      variant: 'todo',
      content: migratePlainTextToRichText(''),
      todoItems: items,
    };
  }

  if (draft.variant === 'todo') {
    const text = draft.todoItems
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join('\n');

    return {
      variant: nextVariant,
      content: migratePlainTextToRichText(text),
      todoItems: [createEmptyTodoItem()],
    };
  }

  return {
    variant: nextVariant,
    content: draft.content,
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
    linkPreview: draft.linkPreview,
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
          content: migratePlainTextToRichText(item.text.trim()),
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
      content: draft.content,
    };
  }

  return {
    ...base,
    variant: 'text',
    content: draft.content,
  };
};

export const buildDraftFromMessage = (message: Message): ComposerDraft => {
  const base: ComposerDraft = {
    variant: message.variant,
    decorators: message.decorators,
    attachments: message.attachments,
    content: migratePlainTextToRichText(''),
    todoItems: [createEmptyTodoItem()],
    focused: false,
    replyToMessageId: message.replyToMessageId,
    linkPreview: message.linkPreview ?? null,
  };

  if (message.variant === 'todo') {
    const items = message.content.items.map((item) => ({
      id: item.id,
      completed: item.completed,
      text: item.content.preview,
      attachments: item.attachments,
    }));

    const draft = {
      ...base,
      content: migratePlainTextToRichText(''),
      todoItems: items.length > 0 ? items : [createEmptyTodoItem()],
    };
    return {
      ...draft,
      linkPreview:
        message.linkPreview ??
        syncLinkPreviewState(null, collectDraftUrls(draft)),
    };
  }

  const draft = {
    ...base,
    content: message.content,
    todoItems: [createEmptyTodoItem()],
  };
  return {
    ...draft,
    linkPreview:
      message.linkPreview ??
      syncLinkPreviewState(null, collectDraftUrls(draft)),
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
): LocalDraftAttachment => {
  const localFields = {
    file,
    previewUrl: blobUrl,
    status: 'local' as const,
  };

  if (attachmentType === 'image') {
    return {
      id: tempId,
      type: 'image',
      url: blobUrl,
      name: file.name,
      ...localFields,
    };
  }

  if (attachmentType === 'video') {
    return {
      id: tempId,
      type: 'video',
      url: blobUrl,
      name: file.name,
      ...localFields,
    };
  }

  return {
    id: tempId,
    type: attachmentType,
    url: blobUrl,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    ...localFields,
  } as BinaryAttachment & LocalDraftAttachment;
};

export const isLocalDraftAttachment = (
  attachment: DraftAttachment,
): attachment is LocalDraftAttachment =>
  'status' in attachment &&
  attachment.status === 'local' &&
  'file' in attachment &&
  'previewUrl' in attachment;

export const revokeDraftAttachmentUrls = (
  attachments: DraftAttachment[],
): void => {
  const urls = new Set(
    attachments
      .filter(isLocalDraftAttachment)
      .map((attachment) => attachment.previewUrl),
  );

  urls.forEach((url) => URL.revokeObjectURL(url));
};

export const revokeDraftObjectUrls = (draft: ComposerDraft): void => {
  revokeDraftAttachmentUrls([
    ...draft.attachments,
    ...draft.todoItems.flatMap((item) => item.attachments),
  ]);
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
