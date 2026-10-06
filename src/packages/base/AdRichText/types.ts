import type { JSONContent } from '@tiptap/core';

import type {
  ContentFeatureId,
  ContentFeatureState,
} from './content/contentFeatureRegistry';

export interface RichTextContent {
  json: JSONContent;

  /**
   * Plain text cache.
   * Used for sidebar preview, workspace preview, search, pinned dialog, notifications.
   * Always derived from `json` — never edit manually.
   */
  preview: string;
}

export type ContentFeatureAnchor = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type AdRichTextHandle = {
  focus: (position?: 'start' | 'end') => void;
  insertAtCursor: (value: string) => void;
  runContentFeature: (
    id: ContentFeatureId,
    anchor?: ContentFeatureAnchor,
  ) => boolean;
  getContentFeatureState: () => ContentFeatureState;
  setContentLinkPreviewEnabled: (url: string, enabled: boolean) => boolean;
  finalizeContentEntities: () => RichTextContent;
};
