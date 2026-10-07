import type {
  AttachmentType,
  BinaryAttachment,
  Message,
  MessageDecorator,
  MessageVariant,
  TodoItem,
  ColumnItem,
} from '@/store/diary/type';

import {
  collectContentTagIds,
  createRichTextContent,
  isRichTextEmpty,
  migratePlainTextToRichText,
} from '@/packages/base/AdRichText/richtext';
import { classifyAttachmentType } from '@/store/diary/attachment.registry';

import {
  createDefaultTimerDecorator,
  scheduleDatetimeDecorator,
} from '../decorator/timer/timer.utils';
import {
  createEmptyTodoItem,
  createEmptyColumnItem,
  createInitialColumnItems,
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
      (item) => !isRichTextEmpty(item.content) || item.attachments.length > 0,
    );
  }

  if (draft.variant === 'column') {
    return draft.columnItems.some((item) => !isRichTextEmpty(item.content));
  }

  return !isRichTextEmpty(draft.content);
};

export const draftHasVariantContent = (draft: ComposerDraft): boolean => {
  if (draft.variant === 'todo') {
    return draft.todoItems.some((item) => !isRichTextEmpty(item.content));
  }

  if (draft.variant === 'column') {
    return draft.columnItems.some((item) => !isRichTextEmpty(item.content));
  }

  return !isRichTextEmpty(draft.content);
};

export const convertDraftToVariant = (
  draft: ComposerDraft,
  nextVariant: MessageVariant,
): Pick<ComposerDraft, 'variant' | 'content' | 'todoItems' | 'columnItems'> => {
  if (draft.variant === nextVariant) {
    return {
      variant: draft.variant,
      content: draft.content,
      todoItems: draft.todoItems,
      columnItems: draft.columnItems,
    };
  }

  if (nextVariant === 'todo' && draft.variant !== 'column') {
    const blocks = draft.content.json.content ?? [];
    const items = blocks.length
      ? blocks.map((block) => ({
          ...createEmptyTodoItem(),
          content: createRichTextContent({ type: 'doc', content: [block] }),
        }))
      : [createEmptyTodoItem()];

    return {
      variant: 'todo',
      content: migratePlainTextToRichText(''),
      todoItems: items,
      columnItems: createInitialColumnItems(),
    };
  }

  if (nextVariant === 'column') {
    const sourceItems =
      draft.variant === 'todo'
        ? draft.todoItems.map((item) => ({
            ...createEmptyColumnItem(),
            content: item.content,
          }))
        : [
            {
              ...createEmptyColumnItem(),
              content: draft.content,
            },
          ];
    while (sourceItems.length < 2) sourceItems.push(createEmptyColumnItem());
    return {
      variant: 'column',
      content: migratePlainTextToRichText(''),
      todoItems: [createEmptyTodoItem()],
      columnItems: sourceItems,
    };
  }

  if (draft.variant === 'column') {
    if (nextVariant === 'todo') {
      return {
        variant: 'todo',
        content: migratePlainTextToRichText(''),
        todoItems: draft.columnItems.map((column) => ({
          ...createEmptyTodoItem(),
          content: column.content,
        })),
        columnItems: createInitialColumnItems(),
      };
    }
    const blocks = draft.columnItems.flatMap((item) =>
      isRichTextEmpty(item.content) ? [] : (item.content.json.content ?? []),
    );
    return {
      variant: nextVariant,
      content: createRichTextContent({ type: 'doc', content: blocks }),
      todoItems: [createEmptyTodoItem()],
      columnItems: createInitialColumnItems(),
    };
  }

  if (draft.variant === 'todo') {
    const blocks = draft.todoItems.flatMap((item) =>
      isRichTextEmpty(item.content) ? [] : (item.content.json.content ?? []),
    );

    return {
      variant: nextVariant,
      content: createRichTextContent({ type: 'doc', content: blocks }),
      todoItems: [createEmptyTodoItem()],
      columnItems: createInitialColumnItems(),
    };
  }

  return {
    variant: nextVariant,
    content: draft.content,
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
  };
};

export const buildMessagePayload = (
  draft: ComposerDraft,
  chatboxId: string,
): Partial<Message> | null => {
  if (!hasDraftContent(draft)) {
    return null;
  }

  const savedAt = Date.now();
  const base = {
    chatboxId,
    sender: 'user' as const,
    attachments: draft.attachments,
    decorators: draft.decorators.map((decorator) =>
      decorator.type === 'timer' && decorator.mode === 'datetime'
        ? scheduleDatetimeDecorator(decorator, savedAt)
        : decorator,
    ),
    linkPreview: null,
    tagIds:
      draft.variant === 'todo'
        ? Array.from(
            new Set(
              draft.todoItems.flatMap((item) =>
                collectContentTagIds(item.content.json),
              ),
            ),
          )
        : draft.variant === 'text'
          ? collectContentTagIds(draft.content.json)
          : [],
    pinned: false,
    archived: false,
    replyToMessageId: draft.replyToMessageId,
    sourceMessageId: null,
    reactions: [],
  };

  if (draft.variant === 'todo') {
    const items = draft.todoItems
      .filter(
        (item) => !isRichTextEmpty(item.content) || item.attachments.length > 0,
      )
      .map(
        (item): TodoItem => ({
          id: item.id,
          completed: item.completed,
          content: item.content,
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
  if (draft.variant === 'column') {
    const columns: ColumnItem[] = draft.columnItems.map((item) => ({
      id: item.id,
      content: item.content,
    }));
    return {
      ...base,
      variant: 'column',
      content: { columns },
      tagIds: Array.from(
        new Set(
          columns.flatMap((item) => collectContentTagIds(item.content.json)),
        ),
      ),
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
    columnItems: createInitialColumnItems(),
    focused: false,
    replyToMessageId: message.replyToMessageId,
    linkPreview: null,
  };

  if (message.variant === 'todo') {
    const items = message.content.items.map((item) => ({
      id: item.id,
      completed: item.completed,
      content: item.content,
      attachments: item.attachments,
    }));

    const draft = {
      ...base,
      content: migratePlainTextToRichText(''),
      todoItems: items.length > 0 ? items : [createEmptyTodoItem()],
    };
    return draft;
  }

  if (message.variant === 'column') {
    return {
      ...base,
      columnItems: message.content.columns,
    };
  }

  const draft = {
    ...base,
    content: message.content,
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
  };
  return draft;
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
