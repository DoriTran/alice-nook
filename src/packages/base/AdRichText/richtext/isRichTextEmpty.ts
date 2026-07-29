import type { RichTextContent } from '../types';

import { extractPlainText } from './extractPlainText';

export const isRichTextEmpty = (
  content: RichTextContent | null | undefined,
): boolean => {
  if (!content) {
    return true;
  }

  const preview =
    typeof content.preview === 'string'
      ? content.preview
      : extractPlainText(content.json);

  return preview.trim().length === 0;
};
