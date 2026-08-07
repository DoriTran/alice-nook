import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import EmojiNodeView from './EmojiNodeView';

export type EmojiOptions = {
  HTMLAttributes: Record<string, unknown>;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emoji: {
      insertEmoji: (value: string) => ReturnType;
    };
  }
}

export const EmojiExtension = Node.create<EmojiOptions>({
  name: 'emoji',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      value: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-emoji') ?? element.textContent ?? '',
        renderHTML: (attributes) => {
          const raw = (attributes as { value?: unknown }).value;
          const value = typeof raw === 'string' ? raw : '';
          return { 'data-emoji': value };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-emoji]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const raw = (node.attrs as { value?: unknown }).value;
    const value = typeof raw === 'string' ? raw : '';
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-emoji': value,
      }),
      value,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmojiNodeView, {
      as: 'span',
      className: 'ad-richtext-emoji',
    });
  },

  addCommands() {
    return {
      insertEmoji:
        (value: string) =>
        ({ commands }) => {
          if (!value) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: { value },
          });
        },
    };
  },
});
