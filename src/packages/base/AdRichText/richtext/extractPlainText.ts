import type { JSONContent } from '@tiptap/core';

/**
 * Recursively walk Tiptap JSON and concatenate text nodes + emoji values.
 * Ignores formatting marks.
 */
export const extractPlainText = (
  json: JSONContent | null | undefined,
): string => {
  if (!json) {
    return '';
  }

  if (json.type === 'text' && typeof json.text === 'string') {
    return json.text;
  }

  if (json.type === 'emoji' && typeof json.attrs?.value === 'string') {
    return json.attrs.value;
  }

  if (json.type === 'hardBreak') {
    return '\n';
  }

  const children = json.content;
  if (!children?.length) {
    return '';
  }

  const parts: string[] = [];

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    const piece = extractPlainText(child);

    if (
      child.type === 'paragraph' &&
      i > 0 &&
      parts.length > 0 &&
      !parts[parts.length - 1].endsWith('\n')
    ) {
      parts.push('\n');
    }

    parts.push(piece);
  }

  return parts.join('');
};
