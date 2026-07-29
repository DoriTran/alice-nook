import { v4 as uuidv4 } from 'uuid';

import { createEmptyRichTextContent } from '@/packages/base/AdRichText/richtext';
import type { RichTextContent } from '@/packages/base/AdRichText/types';
import type {
  Attachment,
  MessageDecorator,
  MessageVariant,
} from '@/store/diary/type';

export type DraftTodoItem = {
  id: string;
  completed: boolean;
  text: string;
  attachments: Attachment[];
};

export type ComposerDraft = {
  variant: MessageVariant;
  decorators: MessageDecorator[];
  attachments: Attachment[];
  /** TipTap content for text / AI variants. */
  content: RichTextContent;
  todoItems: DraftTodoItem[];
  focused: boolean;
  replyToMessageId: string | null;
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
});

export type PendingVariantSwitch = {
  nextVariant: MessageVariant;
} | null;
