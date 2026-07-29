import type { JSONContent } from '@tiptap/core';

import type { RichTextContent } from '../types';

import { extractPlainText } from './extractPlainText';

export const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export const createRichTextContent = (
  json: JSONContent | null | undefined,
): RichTextContent => {
  const safeJson = json?.type === 'doc' ? json : EMPTY_DOC;

  return {
    json: safeJson,
    preview: extractPlainText(safeJson),
  };
};

export const createEmptyRichTextContent = (): RichTextContent =>
  createRichTextContent(EMPTY_DOC);
