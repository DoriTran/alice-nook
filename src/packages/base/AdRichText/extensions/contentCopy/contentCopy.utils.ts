import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { getContentPreviewText } from '../../content';
import { serializeVisibleJson } from '../contentSecret/contentSecret.utils';
import { useSecretRuntime } from '../contentSecret/secretRuntime';

export const serializeVisibleContentNode = (node: ProseMirrorNode): string => {
  const preview = getContentPreviewText(node.toJSON());
  if (preview !== undefined) {
    if (
      node.type.name === 'secretContentInline' ||
      node.type.name === 'secretContentBlock'
    ) {
      const id = String(node.attrs.secretId ?? '');
      const hydrated = useSecretRuntime.getState().hydrations[id];
      return hydrated ? serializeVisibleJson(hydrated) : '[Secret]';
    }
    return preview;
  }
  if (node.type.name === 'emoji' && typeof node.attrs.value === 'string')
    return node.attrs.value;
  return '';
};

export const serializeContentCopyNode = (node: ProseMirrorNode) =>
  node.textBetween(0, node.content.size, '\n', serializeVisibleContentNode);
