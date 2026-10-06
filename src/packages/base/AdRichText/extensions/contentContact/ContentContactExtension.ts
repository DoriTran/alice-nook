import type { MarkType, Node as ProseMirrorNode } from '@tiptap/pm/model';

import {
  getMarkRange,
  InputRule,
  Extension,
  Mark,
  PasteRule,
  mergeAttributes,
  type InputRuleMatch,
  type PasteRuleMatch,
  type Editor,
} from '@tiptap/core';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import { Mapping } from '@tiptap/pm/transform';
import { ReactMarkViewRenderer } from '@tiptap/react';

import type { ContentFeatureAnchor } from '../../types';

import { normalizeContentLinkUrl } from '../contentLink/contentLink.utils';
import {
  findContentEmails,
  findContentPhones,
  normalizeContentEmail,
  normalizeContentPhone,
  type ContentContactKind,
  type ContentContactMatch,
} from './contentContact.utils';
import ContentContactMarkView from './ContentContactMarkView';

type SuppressedContact = ContentContactMatch;

type SuppressionMeta = {
  type: 'suppress';
  entries: SuppressedContact[];
};

export type ContentContactEditorState = {
  open: boolean;
  kind: ContentContactKind;
  from: number;
  to: number;
  value: string;
  anchor?: ContentFeatureAnchor;
};

const CLOSED_CONTACT_EDITOR: ContentContactEditorState = {
  open: false,
  kind: 'phone',
  from: 0,
  to: 0,
  value: '',
};

export const contentContactEditorKey = new PluginKey<ContentContactEditorState>(
  'contentContactEditor',
);

export const getContentContactEditorState = (
  state: Parameters<typeof contentContactEditorKey.getState>[0],
) => contentContactEditorKey.getState(state) ?? CLOSED_CONTACT_EDITOR;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentContact: {
      openContentContactEditor: (
        kind: ContentContactKind,
        anchor?: ContentFeatureAnchor,
      ) => ReturnType;
      applyContentContact: (
        kind: ContentContactKind,
        value: string,
      ) => ReturnType;
      closeContentContactEditor: () => ReturnType;
      finalizeContentEntities: () => ReturnType;
    };
  }
}

export const contentContactSuppressionKey = new PluginKey<SuppressedContact[]>(
  'contentContactSuppression',
);

const isSuppressed = (
  state: Parameters<typeof contentContactSuppressionKey.getState>[0],
  candidate: ContentContactMatch,
) =>
  (contentContactSuppressionKey.getState(state) ?? []).some(
    (entry) =>
      entry.kind === candidate.kind &&
      entry.from === candidate.from &&
      entry.to === candidate.to &&
      entry.text === candidate.text,
  );

const hasExcludedContent = (
  state: Parameters<typeof contentContactSuppressionKey.getState>[0],
  from: number,
  to: number,
) => {
  let excluded = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (
      (node.isInline && !node.isText) ||
      (node.isText &&
        node.marks.some((mark) => ['code', 'link'].includes(mark.type.name)))
    )
      excluded = true;
  });
  return excluded;
};

const createInputFinder =
  (kind: ContentContactKind, find: (text: string) => ContentContactMatch[]) =>
  (text: string): InputRuleMatch | null => {
    const boundary = text.at(-1);
    if (!boundary || !/[ \t,;!?)]/.test(boundary)) return null;
    const tokenText = text.slice(0, -1);
    const candidate = find(tokenText).at(-1);
    if (!candidate || candidate.to !== tokenText.length) return null;
    return {
      index: candidate.from,
      text: `${candidate.text}${boundary}`,
      data: { ...candidate, kind, boundary },
    };
  };

const createPasteFinder =
  (find: (text: string) => ContentContactMatch[]) =>
  (text: string): PasteRuleMatch[] =>
    find(text).map((candidate) => ({
      index: candidate.from,
      text: candidate.text,
      data: candidate,
    }));

const addContactMark = (
  kind: ContentContactKind,
  markName: 'contentPhone' | 'contentEmail',
  attributeName: 'normalizedPhone' | 'normalizedEmail',
  find: (text: string) => ContentContactMatch[],
) => ({
  input: (markType: MarkType) =>
    new InputRule({
      find: createInputFinder(kind, find),
      handler: ({ state, range, match }) => {
        const candidate = match.data as
          | (ContentContactMatch & { boundary: string })
          | undefined;
        if (
          !candidate ||
          isSuppressed(state, {
            ...candidate,
            from: range.from,
            to: range.to,
          }) ||
          hasExcludedContent(state, range.from, range.to)
        )
          return null;
        state.tr
          .insertText(candidate.boundary, range.to)
          .removeMark(range.from, range.to, markType)
          .addMark(
            range.from,
            range.to,
            markType.create({ [attributeName]: candidate.normalized }),
          )
          .removeStoredMark(markType);
      },
    }),
  paste: (markType: MarkType) =>
    new PasteRule({
      find: createPasteFinder(find),
      handler: ({ state, range, match }) => {
        const candidate = match.data as ContentContactMatch | undefined;
        if (!candidate || hasExcludedContent(state, range.from, range.to))
          return null;
        state.tr.addMark(
          range.from,
          range.to,
          markType.create({ [attributeName]: candidate.normalized }),
        );
      },
    }),
  markName,
});

type SemanticMarkRange = {
  from: number;
  to: number;
  type: 'contentPhone' | 'contentEmail';
  attrs: Record<string, unknown>;
  text: string;
};

const collectSemanticMarkRanges = (
  doc: ProseMirrorNode,
): SemanticMarkRange[] => {
  const ranges: SemanticMarkRange[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const mark of node.marks) {
      if (!['contentPhone', 'contentEmail'].includes(mark.type.name)) continue;
      const type = mark.type.name as SemanticMarkRange['type'];
      const previous = ranges.at(-1);
      if (
        previous?.type === type &&
        previous.to === pos &&
        JSON.stringify(previous.attrs) === JSON.stringify(mark.attrs)
      ) {
        previous.to = pos + node.nodeSize;
        previous.text += node.text;
      } else {
        ranges.push({
          from: pos,
          to: pos + node.nodeSize,
          type,
          attrs: { ...mark.attrs },
          text: node.text,
        });
      }
    }
  });
  return ranges;
};

const addValidFragments = (
  tr: Transaction,
  doc: ProseMirrorNode,
  from: number,
  to: number,
  markType: MarkType,
) => {
  doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) return;
    const partFrom = Math.max(from, pos);
    const partTo = Math.min(to, pos + node.nodeSize);
    const raw = node.text.slice(partFrom - pos, partTo - pos);
    for (const match of raw.matchAll(/\S+/g)) {
      const visible = match[0];
      const normalized = normalizeContentEmail(visible);
      if (!normalized) continue;
      const tokenFrom = partFrom + (match.index ?? 0);
      tr.addMark(
        tokenFrom,
        tokenFrom + visible.length,
        markType.create({ normalizedEmail: normalized }),
      );
    }
  });
};

const semanticIntegrityKey = new PluginKey('semanticMarkIntegrity');

const createSemanticIntegrityPlugin = () =>
  new Plugin({
    key: semanticIntegrityKey,
    appendTransaction: (transactions, oldState, newState) => {
      if (
        !transactions.some((transaction) => transaction.docChanged) ||
        transactions.some((transaction) =>
          Boolean(
            transaction.getMeta(semanticIntegrityKey) ||
            transaction.getMeta('preventUpdate'),
          ),
        )
      )
        return null;
      const oldRanges = collectSemanticMarkRanges(oldState.doc);
      if (oldRanges.length === 0) return null;
      const mapping = new Mapping();
      transactions.forEach((transaction) =>
        mapping.appendMapping(transaction.mapping),
      );
      const tr = newState.tr;
      for (const range of oldRanges) {
        const from = mapping.map(range.from, 1);
        const to = mapping.map(range.to, -1);
        if (from >= to || to > newState.doc.content.size) continue;
        const nextText = newState.doc.textBetween(from, to, '\n', '\ufffc');
        if (nextText === range.text) continue;
        const markType = newState.schema.marks[range.type];
        if (!markType) continue;
        const gainedSeparator =
          (nextText.match(/\s/g)?.length ?? 0) >
          (range.text.match(/\s/g)?.length ?? 0);
        tr.removeMark(from, to, markType);
        if (range.type === 'contentPhone') {
          if (gainedSeparator) continue;
          const target = normalizeContentPhone(nextText) ?? nextText.trim();
          if (target)
            tr.addMark(from, to, markType.create({ normalizedPhone: target }));
          continue;
        }
        if (range.type === 'contentEmail') {
          if (gainedSeparator) {
            addValidFragments(tr, newState.doc, from, to, markType);
          } else {
            const target = normalizeContentEmail(nextText) ?? nextText.trim();
            if (target)
              tr.addMark(
                from,
                to,
                markType.create({ normalizedEmail: target }),
              );
          }
          continue;
        }
      }
      if (!tr.steps.length) return null;
      tr.setMeta(semanticIntegrityKey, true);
      return tr;
    },
  });

const phoneRules = addContactMark(
  'phone',
  'contentPhone',
  'normalizedPhone',
  findContentPhones,
);
const emailRules = addContactMark(
  'email',
  'contentEmail',
  'normalizedEmail',
  findContentEmails,
);

export const ContentPhoneExtension = Mark.create({
  name: phoneRules.markName,
  inclusive: false,
  excludes: 'link code contentEmail',
  addAttributes() {
    return { normalizedPhone: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'a[data-content-phone]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const target = String(HTMLAttributes.normalizedPhone ?? '');
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-content-phone': '',
        href: `tel:${target}`,
      }),
      0,
    ];
  },
  addMarkView() {
    return ReactMarkViewRenderer(ContentContactMarkView);
  },
  addInputRules() {
    return [phoneRules.input(this.type)];
  },
  addPasteRules() {
    return [phoneRules.paste(this.type)];
  },
});

export const ContentEmailExtension = Mark.create({
  name: emailRules.markName,
  inclusive: false,
  excludes: 'link code contentPhone',
  addAttributes() {
    return { normalizedEmail: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'a[data-content-email]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const target = String(HTMLAttributes.normalizedEmail ?? '');
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-content-email': '',
        href: `mailto:${target}`,
      }),
      0,
    ];
  },
  addMarkView() {
    return ReactMarkViewRenderer(ContentContactMarkView);
  },
  addInputRules() {
    return [emailRules.input(this.type)];
  },
  addPasteRules() {
    return [emailRules.paste(this.type)];
  },
});

export const ContentContactSuppressionExtension = Extension.create({
  name: 'contentContactSuppression',
  addProseMirrorPlugins() {
    return [
      new Plugin<SuppressedContact[]>({
        key: contentContactSuppressionKey,
        state: {
          init: () => [],
          apply: (transaction, previous, _oldState, nextState) => {
            const mapped = previous
              .map((entry) => ({
                ...entry,
                from: transaction.mapping.map(entry.from, 1),
                to: transaction.mapping.map(entry.to, -1),
              }))
              .filter(
                (entry) =>
                  nextState.doc.textBetween(entry.from, entry.to, ' ') ===
                  entry.text,
              );
            const meta = transaction.getMeta(contentContactSuppressionKey) as
              | SuppressionMeta
              | undefined;
            return meta?.type === 'suppress'
              ? [...mapped, ...meta.entries]
              : mapped;
          },
        },
      }),
    ];
  },
});

export const ContentContactControlsExtension = Extension.create({
  name: 'contentContactControls',
  addCommands() {
    return {
      openContentContactEditor:
        (kind, anchor) =>
        ({ state, tr }) => {
          const { from, to } = state.selection;
          tr.setMeta(contentContactEditorKey, {
            type: 'open',
            state: { open: true, kind, from, to, value: '', anchor },
          });
          return true;
        },
      applyContentContact:
        (kind, value) =>
        ({ state, tr }) => {
          const popup =
            contentContactEditorKey.getState(state) ?? CLOSED_CONTACT_EDITOR;
          if (!popup.open || popup.kind !== kind) return false;
          const { markName, attributeName } = contactConfig(kind);
          const markType = state.schema.marks[markName];
          if (!markType) return false;
          const nextValue = value.trim();
          if (popup.from !== popup.to) tr.delete(popup.from, popup.to);
          if (nextValue) {
            const marks = state.doc
              .resolve(Math.min(popup.from, state.doc.content.size))
              .marks()
              .filter(
                (mark) =>
                  !['link', 'contentPhone', 'contentEmail'].includes(
                    mark.type.name,
                  ),
              );
            tr.insert(
              popup.from,
              state.schema.text(nextValue, [
                ...marks,
                markType.create({ [attributeName]: nextValue }),
              ]),
            );
          }
          tr.setMeta(contentContactEditorKey, {
            type: 'update',
            state: {
              ...popup,
              from: popup.from,
              to: popup.from + nextValue.length,
              value: nextValue,
            },
          });
          return true;
        },
      closeContentContactEditor:
        () =>
        ({ tr }) => {
          tr.setMeta(contentContactEditorKey, { type: 'close' });
          return true;
        },
      finalizeContentEntities:
        () =>
        ({ state, tr }) => {
          tr.setMeta(contentContactEditorKey, { type: 'close' });
          const paragraph = state.doc.lastChild;
          if (!paragraph?.isTextblock || paragraph.content.size === 0)
            return true;
          const blockStart = state.doc.content.size - paragraph.nodeSize + 1;
          const text = paragraph.textContent;
          const candidates = [
            findContentEmails(text).at(-1),
            findContentPhones(text).at(-1),
          ];
          let candidate = candidates.find((item) => item?.to === text.length);
          let markName: 'contentEmail' | 'contentPhone' | 'link' | undefined =
            candidate?.kind === 'email'
              ? 'contentEmail'
              : candidate?.kind === 'phone'
                ? 'contentPhone'
                : undefined;
          let attrs: Record<string, unknown> | undefined = candidate
            ? candidate.kind === 'email'
              ? { normalizedEmail: candidate.normalized }
              : { normalizedPhone: candidate.normalized }
            : undefined;
          if (!candidate) {
            const token = /\S+$/.exec(text);
            const href = token ? normalizeContentLinkUrl(token[0]) : null;
            if (token && href) {
              candidate = {
                kind: 'email',
                from: token.index,
                to: text.length,
                text: token[0],
                normalized: href,
              };
              markName = 'link';
              attrs = { href, previewEnabled: true };
            }
          }
          if (!candidate || !markName || !attrs) return true;
          const from = blockStart + candidate.from;
          const to = blockStart + candidate.to;
          let hasSemanticMark = false;
          state.doc.nodesBetween(from, to, (node) => {
            if (
              node.marks.some((mark) =>
                ['link', 'contentPhone', 'contentEmail'].includes(
                  mark.type.name,
                ),
              )
            )
              hasSemanticMark = true;
          });
          if (hasExcludedContent(state, from, to) || hasSemanticMark)
            return true;
          if (
            markName !== 'link' &&
            isSuppressed(state, {
              ...candidate,
              from,
              to,
            })
          )
            return true;
          const markType = state.schema.marks[markName];
          if (!markType) return true;
          tr.addMark(from, to, markType.create(attrs));
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    return [
      createSemanticIntegrityPlugin(),
      new Plugin<ContentContactEditorState>({
        key: contentContactEditorKey,
        state: {
          init: () => CLOSED_CONTACT_EDITOR,
          apply: (transaction, previous) => {
            const meta = transaction.getMeta(contentContactEditorKey) as
              | {
                  type: 'open' | 'update' | 'close';
                  state?: ContentContactEditorState;
                }
              | undefined;
            if (meta?.type === 'close') return CLOSED_CONTACT_EDITOR;
            if (meta?.state) return meta.state;
            if (transaction.getMeta('preventUpdate'))
              return CLOSED_CONTACT_EDITOR;
            if (!previous.open) return previous;
            return {
              ...previous,
              from: transaction.mapping.map(previous.from, 1),
              to: transaction.mapping.map(previous.to, -1),
            };
          },
        },
      }),
    ];
  },
});

export const createContentContactSuppressionMeta = (
  entries: SuppressedContact[],
): SuppressionMeta => ({ type: 'suppress', entries });

export const getContentContactTarget = (
  kind: ContentContactKind,
  text: string,
) =>
  kind === 'phone' ? normalizeContentPhone(text) : normalizeContentEmail(text);

const contactConfig = (kind: ContentContactKind) =>
  kind === 'phone'
    ? {
        markName: 'contentPhone' as const,
        attributeName: 'normalizedPhone' as const,
      }
    : {
        markName: 'contentEmail' as const,
        attributeName: 'normalizedEmail' as const,
      };

const selectionHasExcludedContent = (editor: Editor) => {
  const { from, to } = editor.state.selection;
  let excluded = false;
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (
      (node.isInline && !node.isText) ||
      (node.isText &&
        node.marks.some((mark) =>
          ['code', 'link', 'contentPhone', 'contentEmail'].includes(
            mark.type.name,
          ),
        ))
    )
      excluded = true;
  });
  return excluded;
};

export const canToggleContentContact = (
  editor: Editor,
  kind: ContentContactKind,
) => {
  const { markName } = contactConfig(kind);
  if (editor.isActive(markName)) return true;
  const { from, to } = editor.state.selection;
  if (from === to || selectionHasExcludedContent(editor)) return false;
  const text = editor.state.doc.textBetween(from, to, ' ');
  return Boolean(getContentContactTarget(kind, text));
};

export const toggleContentContact = (
  editor: Editor,
  kind: ContentContactKind,
  anchor?: ContentFeatureAnchor,
) => {
  const { markName, attributeName } = contactConfig(kind);
  const markType = editor.state.schema.marks[markName];
  if (!markType) return false;
  const { selection } = editor.state;
  const active = editor.isActive(markName);
  let from = selection.from;
  let to = selection.to;
  if (active && selection.empty) {
    const range = getMarkRange(selection.$from, markType);
    if (!range) return false;
    from = range.from;
    to = range.to;
  }

  if (active) {
    const text = editor.state.doc.textBetween(from, to, ' ');
    const normalized = getContentContactTarget(kind, text);
    const tr = editor.state.tr.removeMark(from, to, markType);
    if (normalized)
      tr.setMeta(
        contentContactSuppressionKey,
        createContentContactSuppressionMeta([
          { kind, from, to, text, normalized },
        ]),
      );
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
    return true;
  }

  if (selection.empty)
    return editor.commands.openContentContactEditor(kind, anchor);
  if (!canToggleContentContact(editor, kind)) return false;
  const text = editor.state.doc.textBetween(from, to, ' ');
  const normalized = getContentContactTarget(kind, text);
  if (!normalized) return false;
  editor.view.dispatch(
    editor.state.tr
      .addMark(from, to, markType.create({ [attributeName]: normalized }))
      .scrollIntoView(),
  );
  editor.view.focus();
  return true;
};
