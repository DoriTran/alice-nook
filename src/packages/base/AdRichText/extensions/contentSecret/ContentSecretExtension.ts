import { Node, mergeAttributes, type JSONContent } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';

import {
  normalizeSpecialSelection,
  resolveContentSelection,
} from '../../content/contentSelectionResolver';
import { serializeVisibleContentNode } from '../contentCopy';
import { countGraphemes } from './contentSecret.utils';
import SecretNodeView from './SecretNodeView';
import { setSecretHydration, useSecretRuntime } from './secretRuntime';

const flattenSecrets = (
  fragment: Fragment,
  schema: Parameters<typeof Fragment.fromJSON>[0],
): Fragment | null => {
  const nodes: ProseMirrorNode[] = [];
  for (let index = 0; index < fragment.childCount; index += 1) {
    const node = fragment.child(index);
    if (node.type.name.startsWith('secretContent')) {
      const hydration =
        useSecretRuntime.getState().hydrations[
          String(node.attrs.secretId ?? '')
        ];
      if (!hydration?.content) return null;
      const inner = Fragment.fromJSON(schema, hydration.content);
      inner.forEach((child) => nodes.push(child));
      continue;
    }
    const content = node.content.size
      ? flattenSecrets(node.content, schema)
      : node.content;
    if (!content) return null;
    nodes.push(node.copy(content));
  }
  return Fragment.fromArray(nodes);
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentSecret: { applyContentSecret: () => ReturnType };
  }
}

const attributes = {
  secretId: { default: '' },
  version: { default: 1 },
  keyVersion: { default: 1 },
  ciphertext: { default: '' },
  iv: { default: '' },
  authTag: { default: null },
  displayLength: { default: 0 },
};

const render = (name: string, HTMLAttributes: Record<string, unknown>) =>
  [
    name,
    mergeAttributes(HTMLAttributes, { 'data-secret-content': '' }),
  ] as const;

const InlineSecret = Node.create({
  name: 'secretContentInline',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  addAttributes: () => attributes,
  parseHTML: () => [{ tag: 'span[data-secret-content]' }],
  renderHTML: ({ HTMLAttributes }) => render('span', HTMLAttributes),
  addNodeView: () => ReactNodeViewRenderer(SecretNodeView),
});

const BlockSecret = Node.create({
  name: 'secretContentBlock',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes: () => attributes,
  parseHTML: () => [{ tag: 'div[data-secret-content]' }],
  renderHTML: ({ HTMLAttributes }) => render('div', HTMLAttributes),
  addNodeView: () => ReactNodeViewRenderer(SecretNodeView),
});

const SecretCommands = Node.create({
  name: 'contentSecretControls',
  addCommands() {
    return {
      applyContentSecret:
        () =>
        ({ state, dispatch }) => {
          const resolved = resolveContentSelection(state);
          const selectedSecret =
            resolved.explicitSpecial?.kind === 'secret'
              ? resolved.explicitSpecial
              : undefined;
          if (selectedSecret) {
            const node = state.doc.nodeAt(selectedSecret.from);
            const hydration = node
              ? useSecretRuntime.getState().hydrations[
                  String(node.attrs.secretId ?? '')
                ]
              : undefined;
            if (!node || !hydration?.content) return false;
            if (!dispatch) return true;
            dispatch(
              state.tr
                .replaceWith(
                  selectedSecret.from,
                  selectedSecret.to,
                  Fragment.fromJSON(state.schema, hydration.content),
                )
                .scrollIntoView(),
            );
            return true;
          }
          const normalized = normalizeSpecialSelection(state);
          if (normalized.from === normalized.to) return false;
          const text = state.doc.textBetween(
            normalized.from,
            normalized.to,
            '\n',
            serializeVisibleContentNode,
          );
          if (!text.trim()) return false;
          if (!dispatch) return true;
          const exactCopy = resolved.intersectingSpecials.find(
            (range) =>
              range.kind === 'copy' &&
              range.from === normalized.from &&
              range.to === normalized.to,
          );
          const copyNode = exactCopy
            ? state.doc.nodeAt(exactCopy.from)
            : undefined;
          const rawSlice = copyNode
            ? copyNode.content
            : state.doc.slice(normalized.from, normalized.to).content;
          const slice = flattenSecrets(rawSlice, state.schema);
          if (!slice) return false;
          const nodes = slice.toJSON() as JSONContent[];
          const fragment = {
            type: 'doc',
            content:
              nodes[0]?.type === 'paragraph'
                ? nodes
                : [{ type: 'paragraph', content: nodes }],
          };
          const secretId = uuidv4();
          setSecretHydration(secretId, fragment);
          const sameParent = copyNode
            ? copyNode.type.name === 'contentCopyInline'
            : state.doc
                .resolve(normalized.from)
                .sameParent(state.doc.resolve(normalized.to));
          const type = sameParent
            ? state.schema.nodes.secretContentInline
            : state.schema.nodes.secretContentBlock;
          const secret = type.create({
            secretId,
            displayLength: countGraphemes(text),
          });
          const replaceFrom = exactCopy ? exactCopy.from + 1 : normalized.from;
          const replaceTo = exactCopy ? exactCopy.to - 1 : normalized.to;
          const tr = state.tr.replaceRangeWith(replaceFrom, replaceTo, secret);
          const pos = Math.min(replaceFrom, tr.doc.content.size);
          if (tr.doc.nodeAt(pos)?.type === type)
            tr.setSelection(NodeSelection.create(tr.doc, pos));
          dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },
});

export const ContentSecretExtensions = [
  InlineSecret,
  BlockSecret,
  SecretCommands,
];
