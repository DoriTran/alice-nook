import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, Plugin } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';

import {
  normalizeSpecialSelection,
  resolveContentSelection,
} from '../../content/contentSelectionResolver';
import {
  serializeContentCopyNode,
  serializeVisibleContentNode,
} from './contentCopy.utils';
import ContentCopyNodeView from './ContentCopyNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentCopy: {
      applyContentCopy: () => ReturnType;
      removeContentCopy: () => ReturnType;
    };
  }
}

const attrs = { copyId: { default: '' } };

const InlineCopy = Node.create({
  name: 'contentCopyInline',
  inline: true,
  group: 'inline',
  content: 'inline*',
  isolating: true,
  defining: true,
  addAttributes: () => attrs,
  parseHTML: () => [{ tag: 'span[data-content-copy]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    mergeAttributes(HTMLAttributes, { 'data-content-copy': '' }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ContentCopyNodeView),
});

const BlockCopy = Node.create({
  name: 'contentCopyBlock',
  group: 'block',
  content: 'block*',
  isolating: true,
  defining: true,
  addAttributes: () => attrs,
  parseHTML: () => [{ tag: 'div[data-content-copy]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { 'data-content-copy': '' }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(ContentCopyNodeView),
});

const flattenCopyNodes = (fragment: Fragment): Fragment => {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    const content = node.content.size
      ? flattenCopyNodes(node.content)
      : node.content;
    if (
      node.type.name === 'contentCopyInline' ||
      node.type.name === 'contentCopyBlock'
    ) {
      content.forEach((child) => nodes.push(child));
    } else {
      nodes.push(node.copy(content));
    }
  });
  return Fragment.fromArray(nodes);
};

const CopyCommands = Extension.create({
  name: 'contentCopyControls',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged))
            return null;
          const emptyWrappers: Array<{
            from: number;
            to: number;
            content: Fragment;
          }> = [];
          newState.doc.descendants((node, pos) => {
            if (
              node.type.name.startsWith('contentCopy') &&
              !serializeContentCopyNode(node).trim()
            ) {
              emptyWrappers.push({
                from: pos,
                to: pos + node.nodeSize,
                content: node.content,
              });
              return false;
            }
          });
          if (!emptyWrappers.length) return null;
          const tr = newState.tr;
          emptyWrappers
            .sort((a, b) => b.from - a.from)
            .forEach(({ from, to, content }) =>
              tr.replaceWith(from, to, content),
            );
          return tr.steps.length ? tr : null;
        },
      }),
    ];
  },
  addCommands() {
    return {
      removeContentCopy:
        () =>
        ({ state, dispatch }) => {
          const resolved = resolveContentSelection(state);
          const targets = (
            state.selection.empty
              ? resolved.specialAncestors
              : resolved.intersectingSpecials
          )
            .filter((range) => range.kind === 'copy')
            .sort((a, b) => b.from - a.from);
          if (!targets.length) return false;
          if (!dispatch) return true;
          const tr = state.tr;
          targets.forEach((target) => {
            const node = state.doc.nodeAt(target.from);
            if (node?.type.name.startsWith('contentCopy'))
              tr.replaceWith(target.from, target.to, node.content);
          });
          dispatch(tr.scrollIntoView());
          return true;
        },
      applyContentCopy:
        () =>
        ({ state, dispatch, commands }) => {
          const resolved = resolveContentSelection(state);
          const insideCopy = resolved.specialAncestors.some(
            (range) => range.kind === 'copy',
          );
          if (state.selection.empty && insideCopy)
            return commands.removeContentCopy();
          if (insideCopy) return true;
          const normalized = normalizeSpecialSelection(state);
          if (normalized.from === normalized.to) return false;
          const visible = state.doc.textBetween(
            normalized.from,
            normalized.to,
            '\n',
            serializeVisibleContentNode,
          );
          if (!visible.trim()) return false;
          if (!dispatch) return true;
          const content = flattenCopyNodes(
            state.doc.slice(normalized.from, normalized.to).content,
          );
          const sameParent = state.doc
            .resolve(normalized.from)
            .sameParent(state.doc.resolve(normalized.to));
          const type = sameParent
            ? state.schema.nodes.contentCopyInline
            : state.schema.nodes.contentCopyBlock;
          if (!type) return false;
          const wrapper = type.create({ copyId: uuidv4() }, content);
          const tr = state.tr.replaceRangeWith(
            normalized.from,
            normalized.to,
            wrapper,
          );
          const pos = Math.min(normalized.from, tr.doc.content.size);
          if (tr.doc.nodeAt(pos)?.type === type)
            tr.setSelection(NodeSelection.create(tr.doc, pos));
          dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },
});

export const ContentCopyExtensions = [InlineCopy, BlockCopy, CopyCommands];
