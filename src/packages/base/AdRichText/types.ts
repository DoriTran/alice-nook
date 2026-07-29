import type { JSONContent } from '@tiptap/core';

export interface RichTextContent {
  json: JSONContent;

  /**
   * Plain text cache.
   * Used for sidebar preview, workspace preview, search, pinned dialog, notifications.
   * Always derived from `json` — never edit manually.
   */
  preview: string;
}

export type AdRichTextHandle = {
  focus: () => void;
  insertAtCursor: (value: string) => void;
};
