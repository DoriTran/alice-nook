import { v4 as uuidv4 } from 'uuid';

import type {
  AdRichTextHandle,
  RichTextContent,
} from '@/packages/base/AdRichText/types';
import type {
  Attachment,
  LinkPreviewState,
  MessageDecorator,
  MessageVariant,
  TableColumn,
  TableRow,
} from '@/store/diary/type';

import { createEmptyRichTextContent } from '@/packages/base/AdRichText/richtext';

export type LocalDraftAttachment = Exclude<Attachment, { type: 'link' }> & {
  file: File;
  previewUrl: string;
  status: 'local';
};

export type DraftAttachment = Attachment | LocalDraftAttachment;

export type DraftTodoItem = {
  id: string;
  completed: boolean;
  content: RichTextContent;
  attachments: DraftAttachment[];
};

export type DraftColumnItem = {
  id: string;
  content: RichTextContent;
};

export type DraftTableColumn = TableColumn;
export type DraftTableRow = Omit<TableRow, 'cells'> & {
  cells: TableRow['cells'];
};

export const TABLE_DEFAULT_COLUMN_WIDTH = 160;
export const TABLE_DEFAULT_ROW_MIN_HEIGHT = 48;

export const createEmptyTableColumn = (): DraftTableColumn => ({
  id: `table-column:${uuidv4()}`,
  width: TABLE_DEFAULT_COLUMN_WIDTH,
});

export const createEmptyTableRow = (): DraftTableRow => ({
  id: `table-row:${uuidv4()}`,
  minHeight: TABLE_DEFAULT_ROW_MIN_HEIGHT,
  cells: {},
});

export const createInitialTable = () => ({
  columns: Array.from({ length: 3 }, createEmptyTableColumn),
  rows: Array.from({ length: 3 }, createEmptyTableRow),
});

export type ComposerDraft = {
  variant: MessageVariant;
  decorators: MessageDecorator[];
  attachments: DraftAttachment[];
  /** TipTap content for text / AI variants. */
  content: RichTextContent;
  todoItems: DraftTodoItem[];
  columnItems: DraftColumnItem[];
  tableColumns: DraftTableColumn[];
  tableRows: DraftTableRow[];
  focused: boolean;
  replyToMessageId: string | null;
  linkPreview: LinkPreviewState | null;
};

export type ComposerEditorRef = AdRichTextHandle;

export const createEmptyTodoItem = (): DraftTodoItem => ({
  id: `todo:${uuidv4()}`,
  completed: false,
  content: createEmptyRichTextContent(),
  attachments: [],
});

export const createEmptyColumnItem = (): DraftColumnItem => ({
  id: `column:${uuidv4()}`,
  content: createEmptyRichTextContent(),
});

export const createInitialColumnItems = (): DraftColumnItem[] => [
  createEmptyColumnItem(),
  createEmptyColumnItem(),
];

export const createInitialDraft = (): ComposerDraft => {
  const table = createInitialTable();
  return {
    variant: 'text',
    decorators: [],
    attachments: [],
    content: createEmptyRichTextContent(),
    todoItems: [createEmptyTodoItem()],
    columnItems: createInitialColumnItems(),
    tableColumns: table.columns,
    tableRows: table.rows,
    focused: false,
    replyToMessageId: null,
    linkPreview: null,
  };
};

export type PendingVariantSwitch = {
  nextVariant: MessageVariant;
} | null;
