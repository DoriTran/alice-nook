import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { Extension, getMarkRange, markInputRule } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Mapping } from '@tiptap/pm/transform';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import type { ContentFeatureAnchor } from '../../types';

import { normalizeContentLinkUrl } from './contentLink.utils';

export type ContentLinkEditorState = {
  open: boolean;
  from: number;
  to: number;
  href: string;
  label: string;
  previewEnabled: boolean;
  existing: boolean;
  anchor?: ContentFeatureAnchor;
};
const CLOSED: ContentLinkEditorState = {
  open: false,
  from: 0,
  to: 0,
  href: '',
  label: '',
  previewEnabled: true,
  existing: false,
};
export const contentLinkEditorKey = new PluginKey<ContentLinkEditorState>(
  'contentLinkEditor',
);

type ExistingLinkRange = {
  from: number;
  to: number;
  text: string;
  attrs: Record<string, unknown>;
};

const collectLinkRanges = (doc: ProseMirrorNode): ExistingLinkRange[] => {
  const ranges: ExistingLinkRange[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const mark = node.marks.find((item) => item.type.name === 'link');
    if (!mark) return;
    const previous = ranges.at(-1);
    if (
      previous?.to === pos &&
      JSON.stringify(previous.attrs) === JSON.stringify(mark.attrs)
    ) {
      previous.to = pos + node.nodeSize;
      previous.text += node.text;
    } else {
      ranges.push({
        from: pos,
        to: pos + node.nodeSize,
        text: node.text,
        attrs: { ...mark.attrs },
      });
    }
  });
  return ranges;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentLink: {
      openContentLinkEditor: (anchor?: ContentFeatureAnchor) => ReturnType;
      closeContentLinkEditor: () => ReturnType;
      applyContentLink: (data: {
        href: string;
        label: string;
        previewEnabled: boolean;
        preserveSelection?: boolean;
        closeEditor?: boolean;
      }) => ReturnType;
      removeContentLink: () => ReturnType;
      setContentLinkPreviewEnabled: (
        url: string,
        enabled: boolean,
      ) => ReturnType;
    };
  }
}

export const ContentLinkExtension = Link.extend({
  inclusive: false,
  addAttributes() {
    return {
      ...this.parent?.(),
      previewEnabled: {
        default: true,
        parseHTML: (element) =>
          element.getAttribute('data-preview-enabled') !== 'false',
        renderHTML: (attrs) => ({
          'data-preview-enabled':
            attrs.previewEnabled === false ? 'false' : 'true',
        }),
      },
    };
  },
  addInputRules() {
    return [
      markInputRule({
        find: /((?:https?:\/\/|www\.)[^\s]+)\s$/i,
        type: this.type,
        getAttributes: (match) => ({
          href: normalizeContentLinkUrl(match[1]),
          previewEnabled: true,
        }),
      }),
    ];
  },
}).configure({
  autolink: false,
  linkOnPaste: true,
  defaultProtocol: 'https',
  shouldAutoLink: (url) => {
    if (/^mailto:/i.test(url) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url))
      return false;
    const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
    const hasMaybeProtocol = /^[a-z][a-z0-9+.-]*:/i.test(url);
    if (hasProtocol || (hasMaybeProtocol && !url.includes('@'))) return true;
    const hostname = (url.includes('@') ? url.split('@').pop() : url)?.split(
      /[/?#:]/,
    )[0];
    return Boolean(
      hostname &&
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) &&
      hostname.includes('.'),
    );
  },
  // Composer navigation is explicitly gated by Ctrl/Cmd-click in AdRichText.
  // Viewers remain normal anchors and do not need this editor plugin handler.
  openOnClick: false,
  HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
});

export const ContentLinkControlsExtension = Extension.create({
  name: 'contentLinkControls',
  addCommands() {
    return {
      openContentLinkEditor:
        (anchor) =>
        ({ editor, state, tr }) => {
          const { from, to } = state.selection;
          const linkType = state.schema.marks.link;
          const attrs = editor.getAttributes('link') as {
            href?: string;
            previewEnabled?: boolean;
          };
          const existing = editor.isActive('link');
          const linkRange =
            existing && linkType
              ? getMarkRange(state.doc.resolve(from), linkType)
              : undefined;
          const editorFrom = linkRange?.from ?? from;
          const editorTo = linkRange?.to ?? to;
          const label = state.doc.textBetween(editorFrom, editorTo, ' ');
          const selectedUrl =
            !existing && from !== to ? normalizeContentLinkUrl(label) : null;
          if (selectedUrl) {
            const mark = state.schema.marks.link?.create({
              href: selectedUrl,
              previewEnabled: true,
            });
            if (!mark) return false;
            tr.addMark(from, to, mark);
            return true;
          }
          tr.setMeta(contentLinkEditorKey, {
            type: 'open',
            state: {
              open: true,
              from: editorFrom,
              to: editorTo,
              href: attrs.href ?? '',
              label,
              previewEnabled: attrs.previewEnabled !== false,
              existing,
              anchor,
            },
          });
          return true;
        },
      closeContentLinkEditor:
        () =>
        ({ tr }) => {
          tr.setMeta(contentLinkEditorKey, { type: 'close' });
          return true;
        },
      applyContentLink:
        ({
          href,
          label,
          previewEnabled,
          preserveSelection = false,
          closeEditor = true,
        }) =>
        ({ state, tr }) => {
          const popup = contentLinkEditorKey.getState(state) ?? CLOSED;
          const normalized = normalizeContentLinkUrl(href);
          const linkType = state.schema.marks.link;
          if (!popup.open || !linkType) return false;

          const currentText = state.doc.textBetween(popup.from, popup.to, ' ');
          const nextText = label.trim() || href.trim();
          const marks = state.doc
            .resolve(popup.from)
            .marks()
            .filter(
              (item) =>
                item.type !== linkType &&
                item.type.name !== 'contentPhone' &&
                item.type.name !== 'contentEmail' &&
                !['bold', 'italic', 'underline', 'strike', 'code'].includes(
                  item.type.name,
                ),
            );
          const nextMarks = normalized
            ? [...marks, linkType.create({ href: normalized, previewEnabled })]
            : marks;

          if (!nextText) {
            if (popup.from !== popup.to) tr.delete(popup.from, popup.to);
          } else if (popup.from !== popup.to && nextText === currentText) {
            tr.removeMark(popup.from, popup.to, linkType);
            const phoneType = state.schema.marks.contentPhone;
            const emailType = state.schema.marks.contentEmail;
            if (phoneType) tr.removeMark(popup.from, popup.to, phoneType);
            if (emailType) tr.removeMark(popup.from, popup.to, emailType);
            if (normalized) {
              tr.addMark(
                popup.from,
                popup.to,
                linkType.create({ href: normalized, previewEnabled }),
              );
            }
          } else if (popup.from !== popup.to) {
            tr.replaceWith(
              popup.from,
              popup.to,
              state.schema.text(nextText, nextMarks),
            );
          } else {
            tr.insert(popup.from, state.schema.text(nextText, nextMarks));
          }

          if (!preserveSelection) {
            const caret = Math.min(
              popup.from + nextText.length,
              tr.doc.content.size,
            );
            tr.setSelection(TextSelection.near(tr.doc.resolve(caret)));
          }
          tr.setMeta(
            contentLinkEditorKey,
            closeEditor
              ? { type: 'close' }
              : {
                  type: 'update',
                  state: {
                    open: true,
                    from: popup.from,
                    to: popup.from + nextText.length,
                    href,
                    label: nextText,
                    previewEnabled,
                    existing: nextText.length > 0,
                    anchor: popup.anchor,
                  },
                },
          );
          return true;
        },
      removeContentLink:
        () =>
        ({ state, tr }) => {
          const popup = contentLinkEditorKey.getState(state) ?? CLOSED;
          const linkType = state.schema.marks.link;
          if (!popup.existing || popup.from === popup.to || !linkType) {
            return false;
          }

          tr.removeMark(popup.from, popup.to, linkType)
            .setSelection(
              TextSelection.near(
                tr.doc.resolve(Math.min(popup.to, tr.doc.content.size)),
              ),
            )
            .setMeta('preventAutolink', true)
            .setMeta(contentLinkEditorKey, { type: 'close' });
          return true;
        },
      setContentLinkPreviewEnabled:
        (url, enabled) =>
        ({ state, tr }) => {
          const normalized = normalizeContentLinkUrl(url);
          const linkType = state.schema.marks.link;
          if (!normalized || !linkType) return false;

          let changed = false;
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const mark = node.marks.find(
              (item) =>
                item.type === linkType &&
                normalizeContentLinkUrl(String(item.attrs.href ?? '')) ===
                  normalized,
            );
            if (!mark || mark.attrs.previewEnabled === enabled) return;

            tr.removeMark(pos, pos + node.nodeSize, linkType).addMark(
              pos,
              pos + node.nodeSize,
              linkType.create({ ...mark.attrs, previewEnabled: enabled }),
            );
            changed = true;
          });
          return changed;
        },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<ContentLinkEditorState>({
        key: contentLinkEditorKey,
        props: {
          decorations: (state) => {
            const popup = contentLinkEditorKey.getState(state) ?? CLOSED;
            if (!popup.open || popup.from >= popup.to) return null;
            const draft = !normalizeContentLinkUrl(popup.href);
            return DecorationSet.create(state.doc, [
              Decoration.inline(popup.from, popup.to, {
                class: draft
                  ? 'ad-content-link-selected ad-content-link-draft'
                  : 'ad-content-link-selected',
              }),
            ]);
          },
        },
        state: {
          init: () => CLOSED,
          apply: (tr, previous, _oldState, nextState) => {
            const meta = tr.getMeta(contentLinkEditorKey) as
              | { type?: string; state?: ContentLinkEditorState }
              | undefined;
            if (meta?.type === 'close') return CLOSED;
            if (
              (meta?.type === 'open' || meta?.type === 'update') &&
              meta.state
            )
              return meta.state;
            if (previous.open && tr.docChanged) {
              const from = tr.mapping.map(previous.from, -1);
              const to = tr.mapping.map(previous.to, 1);
              return {
                ...previous,
                from,
                to,
                label: nextState.doc.textBetween(from, to, ' '),
              };
            }
            return previous;
          },
        },
        appendTransaction: (transactions, oldState, newState) => {
          const previous = contentLinkEditorKey.getState(oldState) ?? CLOSED;
          const next = contentLinkEditorKey.getState(newState) ?? CLOSED;
          if (previous.open && next.open && previous.existing) {
            const previousLabelUrl = normalizeContentLinkUrl(previous.label);
            const previousHrefUrl = normalizeContentLinkUrl(previous.href);
            const wasRawLink =
              previousLabelUrl !== null && previousLabelUrl === previousHrefUrl;
            const nextHref = wasRawLink
              ? normalizeContentLinkUrl(next.label)
              : null;
            if (!nextHref) return null;

            const linkType = newState.schema.marks.link;
            const linkRange = linkType
              ? getMarkRange(newState.doc.resolve(next.from), linkType)
              : undefined;
            if (!linkType || !linkRange) return null;

            const currentMark = linkType.isInSet(
              newState.doc
                .resolve(Math.min(linkRange.from + 1, linkRange.to))
                .marks(),
            );
            if (currentMark?.attrs.href === nextHref) return null;

            return newState.tr
              .removeMark(linkRange.from, linkRange.to, linkType)
              .addMark(
                linkRange.from,
                linkRange.to,
                linkType.create({
                  href: nextHref,
                  previewEnabled: next.previewEnabled,
                }),
              )
              .setMeta(contentLinkEditorKey, {
                type: 'update',
                state: {
                  ...next,
                  from: linkRange.from,
                  to: linkRange.to,
                  href: next.label,
                },
              });
          }

          if (
            !transactions.some((transaction) => transaction.docChanged) ||
            transactions.some(
              (transaction) =>
                transaction.getMeta('preventUpdate') ||
                transaction.getMeta('normalizeRawLinks'),
            )
          )
            return null;
          const ranges = collectLinkRanges(oldState.doc);
          if (ranges.length === 0) return null;
          const mapping = new Mapping();
          transactions.forEach((transaction) =>
            mapping.appendMapping(transaction.mapping),
          );
          const linkType = newState.schema.marks.link;
          if (!linkType) return null;
          const tr = newState.tr;
          for (const range of ranges) {
            const oldHref = normalizeContentLinkUrl(
              typeof range.attrs.href === 'string' ? range.attrs.href : '',
            );
            if (!oldHref || normalizeContentLinkUrl(range.text) !== oldHref)
              continue;
            const from = mapping.map(range.from, 1);
            const to = mapping.map(range.to, -1);
            if (from >= to || to > newState.doc.content.size) continue;
            const text = newState.doc.textBetween(from, to, '\n', '\ufffc');
            if (text === range.text) continue;
            tr.removeMark(from, to, linkType);
            const gainedSeparator =
              (text.match(/\s/g)?.length ?? 0) >
              (range.text.match(/\s/g)?.length ?? 0);
            if (!gainedSeparator) {
              const href = normalizeContentLinkUrl(text);
              if (href)
                tr.addMark(from, to, linkType.create({ ...range.attrs, href }));
              continue;
            }
            newState.doc.nodesBetween(from, to, (node, pos) => {
              if (!node.isText || !node.text) return;
              const partFrom = Math.max(from, pos);
              const partTo = Math.min(to, pos + node.nodeSize);
              const raw = node.text.slice(partFrom - pos, partTo - pos);
              for (const match of raw.matchAll(/\S+/g)) {
                const visible = match[0];
                const href = normalizeContentLinkUrl(visible);
                if (!href) continue;
                const tokenFrom = partFrom + (match.index ?? 0);
                tr.addMark(
                  tokenFrom,
                  tokenFrom + visible.length,
                  linkType.create({ ...range.attrs, href }),
                );
              }
            });
          }
          if (!tr.steps.length) return null;
          tr.setMeta('normalizeRawLinks', true);
          return tr;
        },
      }),
    ];
  },
});

export const getContentLinkEditorState = (
  state: Parameters<typeof contentLinkEditorKey.getState>[0],
) => contentLinkEditorKey.getState(state) ?? CLOSED;
