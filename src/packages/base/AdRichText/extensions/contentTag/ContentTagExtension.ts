import { mergeAttributes, Node } from '@tiptap/core';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
} from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';

import ContentTagNodeView from './ContentTagNodeView';

export type ContentEntityKind = 'tag' | 'reference';

export type ContentEntitySuggestionState = {
  open: boolean;
  kind: ContentEntityKind;
  from: number;
  to: number;
  query: string;
};

const CLOSED: ContentEntitySuggestionState = {
  open: false,
  kind: 'tag',
  from: 0,
  to: 0,
  query: '',
};

export const contentEntitySuggestionKey =
  new PluginKey<ContentEntitySuggestionState>('contentEntitySuggestion');
export const contentTagSuggestionKey = contentEntitySuggestionKey;

const OPEN_EXPLICITLY = 'open';
const CLOSE = 'close';

const suggestionAtSelection = (
  state: EditorState,
): ContentEntitySuggestionState => {
  const selection = state.selection;
  if (!(selection instanceof TextSelection) || !selection.empty) return CLOSED;

  const before = selection.$from.parent.textBetween(
    0,
    selection.$from.parentOffset,
    '\n',
    '\ufffc',
  );
  const match = before.match(/(?:^|\s|\(|\[|\{|["'“‘])([#@])([^\s#@]*)$/u);
  if (!match) return CLOSED;

  const trigger = match[1];
  const query = match[2] ?? '';
  const from = selection.from - query.length - 1;
  const prefix = before.slice(0, Math.max(0, before.length - query.length - 1));
  if (/(?:https?:\/\/|www\.)\S*$/i.test(prefix)) return CLOSED;

  return {
    open: true,
    kind: trigger === '@' ? 'reference' : 'tag',
    from,
    to: selection.from,
    query,
  };
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentTag: {
      openContentEntityPicker: (kind: ContentEntityKind) => ReturnType;
      closeContentEntityPicker: () => ReturnType;
      openContentTagPicker: () => ReturnType;
      closeContentTagPicker: () => ReturnType;
      insertContentTag: (attrs: {
        tagId: string;
        label: string;
        colorId: string;
      }) => ReturnType;
      insertContentReference: (attrs: {
        targetType: 'chatbox' | 'message';
        targetId: string;
        fallbackLabel: string;
        fallbackChatboxId?: string;
      }) => ReturnType;
    };
  }
}

export const ContentTagExtension = Node.create({
  name: 'contentTag',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      tagId: { default: '' },
      label: { default: '' },
      colorId: { default: 'lavender' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-content-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-content-tag': '',
        'data-content-tag-id': String(HTMLAttributes.tagId ?? ''),
      }),
      `#${String(HTMLAttributes.label ?? '')}`,
    ];
  },

  renderText({ node }) {
    return `#${String(node.attrs.label ?? '')}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContentTagNodeView, {
      as: 'span',
      contentDOMElementTag: 'span',
    });
  },

  addCommands() {
    return {
      openContentTagPicker:
        () =>
        ({ commands }) =>
          commands.openContentEntityPicker('tag'),
      openContentEntityPicker:
        (kind) =>
        ({ state, dispatch }) => {
          if (!dispatch) return true;
          const { from, to } = state.selection;
          dispatch(
            state.tr.setMeta(contentEntitySuggestionKey, {
              type: OPEN_EXPLICITLY,
              kind,
              from,
              to,
            }),
          );
          return true;
        },
      closeContentTagPicker:
        () =>
        ({ commands }) =>
          commands.closeContentEntityPicker(),
      closeContentEntityPicker:
        () =>
        ({ state, dispatch }) => {
          if (dispatch) {
            dispatch(
              state.tr.setMeta(contentEntitySuggestionKey, { type: CLOSE }),
            );
          }
          return true;
        },
      insertContentTag:
        (attrs) =>
        ({ state, tr, dispatch }) => {
          const suggestion =
            contentEntitySuggestionKey.getState(state) ?? CLOSED;
          const from = suggestion.open ? suggestion.from : state.selection.from;
          const to = suggestion.open ? suggestion.to : state.selection.to;
          if (!dispatch) return true;
          const tagNode = state.schema.nodes[this.name]?.create(attrs);
          if (!tagNode) return false;
          const space = state.schema.text(' ');
          tr.replaceWith(from, to, [tagNode, space]);
          tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
          tr.setMeta(contentEntitySuggestionKey, { type: CLOSE });
          dispatch(tr.scrollIntoView());
          return true;
        },
      insertContentReference:
        (attrs) =>
        ({ state, tr, dispatch }) => {
          const suggestion =
            contentEntitySuggestionKey.getState(state) ?? CLOSED;
          const from = suggestion.open ? suggestion.from : state.selection.from;
          const to = suggestion.open ? suggestion.to : state.selection.to;
          if (!dispatch) return true;
          const node = state.schema.nodes.contentReference?.create(attrs);
          if (!node) return false;
          tr.replaceWith(from, to, [node, state.schema.text(' ')]);
          tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
          tr.setMeta(contentEntitySuggestionKey, { type: CLOSE });
          dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<ContentEntitySuggestionState>({
        key: contentEntitySuggestionKey,
        state: {
          init: () => CLOSED,
          apply: (transaction, previous, _oldState, nextState) => {
            const meta = transaction.getMeta(contentEntitySuggestionKey) as
              | {
                  type: string;
                  kind?: ContentEntityKind;
                  from?: number;
                  to?: number;
                }
              | undefined;
            if (meta?.type === CLOSE) return CLOSED;
            if (meta?.type === OPEN_EXPLICITLY) {
              return {
                open: true,
                kind: meta.kind ?? 'tag',
                from: meta.from ?? nextState.selection.from,
                to: meta.to ?? nextState.selection.to,
                query: '',
              };
            }
            if (!transaction.docChanged && previous.open) return previous;
            return suggestionAtSelection(nextState);
          },
        },
      }),
    ];
  },
});

export const getContentEntitySuggestionState = (
  state: Parameters<typeof contentEntitySuggestionKey.getState>[0],
): ContentEntitySuggestionState =>
  contentEntitySuggestionKey.getState(state) ?? CLOSED;

export const getContentTagSuggestionState = getContentEntitySuggestionState;
export type ContentTagSuggestionState = ContentEntitySuggestionState;
