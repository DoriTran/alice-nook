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

export type ContentFeatureInvocation = {
  anchor?: ContentFeatureAnchor;
  value?: string;
};

export type AdRichTextHandle = {
  focus: (position?: 'start' | 'end') => void;
  insertAtCursor: (value: string) => void;
  runContentFeature: (
    id: ContentFeatureId,
    invocation?: ContentFeatureInvocation,
  ) => boolean;
  getContentFeatureState: () => ContentFeatureState;
  setContentLinkPreviewEnabled: (url: string, enabled: boolean) => boolean;
  finalizeContentEntities: () => RichTextContent;
};
