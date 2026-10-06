import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import ContentReferenceNodeView from './ContentReferenceNodeView';

export const ContentReferenceExtension = Node.create({
  name: 'contentReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      targetType: { default: 'chatbox' },
      targetId: { default: '' },
      fallbackLabel: { default: '' },
      fallbackChatboxId: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-content-reference]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-content-reference': '' }),
      `@${String(HTMLAttributes.fallbackLabel ?? '')}`,
    ];
  },
  renderText({ node }) {
    return `@${String(node.attrs.fallbackLabel ?? '')}`;
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentReferenceNodeView, { as: 'span' });
  },
});
