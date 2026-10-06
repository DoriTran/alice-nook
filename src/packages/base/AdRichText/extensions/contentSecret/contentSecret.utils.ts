import type { JSONContent } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { getContentPreviewText } from '../../content';

const leafText = (node: ProseMirrorNode) =>
  getContentPreviewText(node.toJSON()) ??
  (node.type.name === 'emoji' ? String(node.attrs.value ?? '') : '');

export const serializeVisibleFragment = (doc: ProseMirrorNode) =>
  doc.textBetween(0, doc.content.size, '\n', leafText);

export const countGraphemes = (value: string) => {
  if (typeof Intl.Segmenter === 'function')
    return [
      ...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
        value,
      ),
    ].length;
  return Array.from(value).length;
};

export const secretPreviewText = () => '[Secret]';

export const serializeVisibleJson = (node: JSONContent): string => {
  if (typeof node.text === 'string') return node.text;
  if (node.type === 'contentTag') return `#${String(node.attrs?.label ?? '')}`;
  if (node.type === 'contentReference')
    return `@${String(node.attrs?.fallbackLabel ?? '')}`;
  if (node.type === 'emoji') return String(node.attrs?.value ?? '');
  if (node.type === 'hardBreak') return '\n';
  const separator = node.type === 'doc' ? '\n' : '';
  return node.content?.map(serializeVisibleJson).join(separator) ?? '';
};

export const collectPendingSecretPayloads = (
  json: JSONContent,
  hydrations: Record<string, JSONContent>,
) => {
  const payloads: Array<{ secretId: string; fragment: JSONContent }> = [];
  const visit = (node: JSONContent) => {
    if (
      (node.type === 'secretContentInline' ||
        node.type === 'secretContentBlock') &&
      typeof node.attrs?.secretId === 'string' &&
      !node.attrs.ciphertext
    ) {
      const fragment = hydrations[node.attrs.secretId];
      if (fragment) payloads.push({ secretId: node.attrs.secretId, fragment });
      return;
    }
    node.content?.forEach(visit);
  };
  visit(json);
  return payloads;
};
