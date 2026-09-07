import { v4 as uuidv4 } from 'uuid';

import type { RichTextContent } from '@/packages/base/AdRichText/types';
import type {
  Attachment,
  LinkPreviewState,
  MessageDecorator,
  MessageVariant,
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
  text: string;
  attachments: DraftAttachment[];
};

export type ComposerDraft = {
  variant: MessageVariant;
  decorators: MessageDecorator[];
  attachments: DraftAttachment[];
  /** TipTap content for text / AI variants. */
  content: RichTextContent;
  todoItems: DraftTodoItem[];
  focused: boolean;
  replyToMessageId: string | null;
  linkPreview: LinkPreviewState | null;
};

export type ComposerEditorRef = {
  insertAtCursor: (value: string) => void;
  focus: () => void;
};

export const createEmptyTodoItem = (): DraftTodoItem => ({
  id: `todo:${uuidv4()}`,
  completed: false,
  text: '',
  attachments: [],
});

export const createInitialDraft = (): ComposerDraft => ({
  variant: 'text',
  decorators: [],
  attachments: [],
  content: createEmptyRichTextContent(),
  todoItems: [createEmptyTodoItem()],
  focused: false,
  replyToMessageId: null,
  linkPreview: null,
});

export type PendingVariantSwitch = {
  nextVariant: MessageVariant;
} | null;
