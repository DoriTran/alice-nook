import type { JSONContent } from '@tiptap/core';

import type { RichTextContent } from '../types';

import {
  createEmptyRichTextContent,
  createRichTextContent,
} from './createRichTextContent';
import { splitPlainTextToInlineNodes } from './splitPlainTextToInlineNodes';

type LegacyRichText = { text: string };

const isLegacyRichText = (value: unknown): value is LegacyRichText =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'text' in value &&
    typeof (value as LegacyRichText).text === 'string' &&
    !('json' in value),
  );

const isRichTextContent = (value: unknown): value is RichTextContent =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'json' in value &&
    (value as RichTextContent).json?.type === 'doc',
  );

/** Build a TipTap doc from plain text (paragraphs split on newlines). */
export const plainTextToDoc = (text: string): JSONContent => {
  if (!text) {
    return createEmptyRichTextContent().json;
  }

  const lines = text.split('\n');
  const content: JSONContent[] = lines.map((line) => {
    const inline = splitPlainTextToInlineNodes(line);
    return {
      type: 'paragraph',
      content: inline.length > 0 ? inline : undefined,
    };
  });

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
};

/**
 * Convert plain string or legacy `{ text }` into `RichTextContent`.
 * Already-migrated content is returned as-is (preview refreshed from json).
 */
export const migratePlainTextToRichText = (
  value: string | LegacyRichText | RichTextContent | null | undefined,
): RichTextContent => {
  if (value == null) {
    return createEmptyRichTextContent();
  }

  if (typeof value === 'string') {
    return createRichTextContent(plainTextToDoc(value));
  }

  if (isRichTextContent(value)) {
    return createRichTextContent(value.json);
  }

  if (isLegacyRichText(value)) {
    return createRichTextContent(plainTextToDoc(value.text));
  }

  return createEmptyRichTextContent();
};
