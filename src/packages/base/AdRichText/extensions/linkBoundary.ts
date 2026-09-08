import type { MarkType, Node } from '@tiptap/pm/model';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const LINK_PATTERN = /(?<![\w@])(?:https?:\/\/|www\.)[^\s\uFFFC<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)}\]]+$/;
const pluginKey = new PluginKey('boundary-safe-autolink');

type LinkRange = {
  from: number;
  to: number;
  href: string;
};

const normalizeUrl = (raw: string): string | null => {
  const cleaned = raw.replace(TRAILING_PUNCTUATION, '');
  const candidate = /^www\./i.test(cleaned) ? `https://${cleaned}` : cleaned;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
};

const desiredLinkRanges = (node: Node, position: number): LinkRange[] => {
  // A whitespace leaf separator keeps adjacent URLs distinct. U+FFFC becomes
  // `%EF%BF%BC` when passed through `new URL()` and used to corrupt href marks.
  const text = node.textBetween(0, node.content.size, '\n', '\n');
  const ranges: LinkRange[] = [];

  for (const match of text.matchAll(LINK_PATTERN)) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, '');
    const href = normalizeUrl(raw);
    if (!href) continue;
    const from = position + 1 + (match.index ?? 0);
    ranges.push({ from, to: from + raw.length, href });
  }

  return ranges;
};

const existingLinkRanges = (
  node: Node,
  position: number,
  linkType: MarkType,
): LinkRange[] => {
  const ranges: LinkRange[] = [];

  node.descendants((child, offset) => {
    if (!child.isText) return;
    const link = child.marks.find((mark) => mark.type === linkType);
    if (!link) return;

    const range = {
      from: position + 1 + offset,
      to: position + 1 + offset + child.nodeSize,
      href: String(link.attrs.href),
    };
    const previous = ranges.at(-1);
    if (previous?.to === range.from && previous.href === range.href) {
      previous.to = range.to;
    } else {
      ranges.push(range);
    }
  });

  return ranges;
};

const rangesMatch = (left: LinkRange[], right: LinkRange[]): boolean =>
  left.length === right.length &&
  left.every(
    (range, index) =>
      range.from === right[index].from &&
      range.to === right[index].to &&
      range.href === right[index].href,
  );

export const LinkBoundaryExtension = Extension.create({
  name: 'linkBoundary',

  addProseMirrorPlugins() {
    const linkType = this.editor.schema.marks.link;
    if (!linkType) return [];

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (transactions, _oldState, newState) => {
          const changed = transactions.some(
            (transaction) => transaction.docChanged,
          );
          const alreadyNormalized = transactions.some((transaction) =>
            transaction.getMeta(pluginKey),
          );
          if (!changed || alreadyNormalized) return null;

          const transaction = newState.tr;
          newState.doc.descendants((node, position) => {
            if (!node.isTextblock) return;

            const desired = desiredLinkRanges(node, position);
            const existing = existingLinkRanges(node, position, linkType);
            if (!rangesMatch(desired, existing)) {
              const from = position + 1;
              const to = from + node.content.size;
              transaction.removeMark(from, to, linkType);
              desired.forEach((range) => {
                transaction.addMark(
                  range.from,
                  range.to,
                  linkType.create({ href: range.href }),
                );
              });
            }

            return false;
          });

          if (!transaction.steps.length) return null;
          transaction.setMeta(pluginKey, true);
          return transaction;
        },
      }),
    ];
  },
});
