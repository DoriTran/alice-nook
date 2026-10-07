import type {
  AttachmentType,
  BinaryAttachment,
  Message,
  MessageDecorator,
  MessageVariant,
  TodoItem,
  ColumnItem,
  TableCell,
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
  createInitialTable,
  createEmptyTableColumn,
  createEmptyTableRow,
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
  if (draft.variant === 'table') {
    return draft.tableRows.some((row) => Object.keys(row.cells).length > 0);
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

  if (draft.variant === 'table') {
    return draft.tableRows.some((row) => Object.keys(row.cells).length > 0);
  }

  return !isRichTextEmpty(draft.content);
};

export const convertDraftToVariant = (
  draft: ComposerDraft,
  nextVariant: MessageVariant,
): Pick<
  ComposerDraft,
  | 'variant'
  | 'content'
  | 'todoItems'
  | 'columnItems'
  | 'tableColumns'
  | 'tableRows'
  | 'attachments'
> => {
  const emptyTable = createInitialTable();
  const base = {
    content: migratePlainTextToRichText(''),
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
    tableColumns: emptyTable.columns,
    tableRows: emptyTable.rows,
    attachments: draft.attachments,
  };
  if (draft.variant === nextVariant) {
    return {
      variant: draft.variant,
      content: draft.content,
      todoItems: draft.todoItems,
      columnItems: draft.columnItems,
      tableColumns: draft.tableColumns,
      tableRows: draft.tableRows,
      attachments: draft.attachments,
    };
  }
  if (nextVariant === 'table') {
    const table = createInitialTable();
    if (draft.variant === 'column') {
      while (table.columns.length < draft.columnItems.length)
        table.columns.push(createEmptyTableColumn());
      const row = table.rows[0];
      draft.columnItems.forEach((item, index) => {
        if (!isRichTextEmpty(item.content))
          row.cells[table.columns[index].id] = {
            kind: 'richText',
            content: item.content,
          };
      });
    } else if (draft.variant === 'todo') {
      while (table.rows.length < draft.todoItems.length)
        table.rows.push(createEmptyTableRow());
      const requiredColumns = Math.max(
        3,
        ...draft.todoItems.map((item) => 1 + item.attachments.length),
      );
      while (table.columns.length < requiredColumns)
        table.columns.push(createEmptyTableColumn());
      draft.todoItems.forEach((item, rowIndex) => {
        const row = table.rows[rowIndex];
        if (!isRichTextEmpty(item.content))
          row.cells[table.columns[0].id] = {
            kind: 'richText',
            content: item.content,
          };
        item.attachments.forEach((attachment, index) => {
          row.cells[table.columns[index + 1].id] = {
            kind: 'attachment',
            attachment,
          };
        });
      });
    } else if (!isRichTextEmpty(draft.content)) {
      table.rows[0].cells[table.columns[0].id] = {
        kind: 'richText',
        content: draft.content,
      };
    }
    return {
      ...base,
      variant: 'table',
      tableColumns: table.columns,
      tableRows: table.rows,
    };
  }

  if (draft.variant === 'table') {
    const cells = draft.tableRows.flatMap((row) =>
      draft.tableColumns.flatMap((column) => {
        const cell = row.cells[column.id];
        return cell ? [cell] : [];
      }),
    );
    const promoted = cells.flatMap((cell) =>
      cell.kind === 'attachment' ? [cell.attachment] : [],
    );
    const richBlocks = (values: TableCell[]) =>
      values.flatMap((cell) =>
        cell.kind === 'richText' && !isRichTextEmpty(cell.content)
          ? (cell.content.json.content ?? [])
          : [],
      );
    if (nextVariant === 'todo') {
      const items = draft.tableRows.flatMap((row) => {
        const rowCells = draft.tableColumns.flatMap((column) => {
          const cell = row.cells[column.id];
          return cell ? [cell] : [];
        });
        if (rowCells.length === 0) return [];
        return [
          {
            ...createEmptyTodoItem(),
            content: createRichTextContent({
              type: 'doc',
              content: richBlocks(rowCells),
            }),
            attachments: rowCells.flatMap((cell) =>
              cell.kind === 'attachment' ? [cell.attachment] : [],
            ),
          },
        ];
      });
      return {
        ...base,
        variant: 'todo',
        todoItems: items.length ? items : [createEmptyTodoItem()],
      };
    }
    if (nextVariant === 'column') {
      const columns = draft.tableColumns.map((column) => ({
        ...createEmptyColumnItem(),
        content: createRichTextContent({
          type: 'doc',
          content: richBlocks(
            draft.tableRows.flatMap((row) => {
              const cell = row.cells[column.id];
              return cell ? [cell] : [];
            }),
          ),
        }),
      }));
      while (columns.length < 2) columns.push(createEmptyColumnItem());
      return {
        ...base,
        variant: 'column',
        columnItems: columns,
        attachments: [...draft.attachments, ...promoted],
      };
    }
    return {
      ...base,
      variant: nextVariant,
      content: createRichTextContent({
        type: 'doc',
        content: richBlocks(cells),
      }),
      attachments: [...draft.attachments, ...promoted],
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
      tableColumns: base.tableColumns,
      tableRows: base.tableRows,
      attachments: draft.attachments,
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
      tableColumns: base.tableColumns,
      tableRows: base.tableRows,
      attachments: draft.attachments,
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
        tableColumns: base.tableColumns,
        tableRows: base.tableRows,
        attachments: draft.attachments,
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
      tableColumns: base.tableColumns,
      tableRows: base.tableRows,
      attachments: draft.attachments,
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
      tableColumns: base.tableColumns,
      tableRows: base.tableRows,
      attachments: draft.attachments,
    };
  }

  return {
    variant: nextVariant,
    content: draft.content,
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
    tableColumns: base.tableColumns,
    tableRows: base.tableRows,
    attachments: draft.attachments,
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

  if (draft.variant === 'table') {
    return {
      ...base,
      variant: 'table',
      content: { columns: draft.tableColumns, rows: draft.tableRows },
      tagIds: Array.from(
        new Set(
          draft.tableRows.flatMap((row) =>
            Object.values(row.cells).flatMap((cell) =>
              cell?.kind === 'richText'
                ? collectContentTagIds(cell.content.json)
                : [],
            ),
          ),
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
  const initialTable = createInitialTable();
  const base: ComposerDraft = {
    variant: message.variant,
    decorators: message.decorators,
    attachments: message.attachments,
    content: migratePlainTextToRichText(''),
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
    tableColumns: initialTable.columns,
    tableRows: initialTable.rows,
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

  if (message.variant === 'table') {
    return {
      ...base,
      tableColumns: message.content.columns,
      tableRows: message.content.rows,
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
    ...draft.tableRows.flatMap((row) =>
      Object.values(row.cells).flatMap((cell) =>
        cell?.kind === 'attachment' ? [cell.attachment] : [],
      ),
    ),
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
