import type { JSONContent } from '@tiptap/core';

import type { LinkPreviewState, Message } from '@/store/diary/type';

import type { ComposerDraft } from '../DiaryInput/input/composer.types';

const URL_PATTERN = /(?<![\w@])(?:https?:\/\/|www\.)[^\s\uFFFC<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)}\]]+$/;
const BROKEN_INLINE_SEPARATOR =
  /(?:%EF%BF%BC|\uFFFC)(?=(?:https?:\/\/|www\.))/gi;

const repairBrokenUrlSeparators = (text: string): string =>
  text.replace(BROKEN_INLINE_SEPARATOR, '\n');

export type DetectedUrl = {
  raw: string;
  normalized: string;
};

export const normalizeLinkPreviewUrl = (raw: string): string | null => {
  const cleaned = raw.replace(TRAILING_PUNCTUATION, '');
  if (!cleaned || cleaned.length > 2048) return null;
  const candidate = /^www\./i.test(cleaned) ? `https://${cleaned}` : cleaned;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
};

export const extractPreviewUrls = (text: string): DetectedUrl[] => {
  const found: DetectedUrl[] = [];
  const seen = new Set<string>();
  const repairedText = repairBrokenUrlSeparators(text);

  for (const match of repairedText.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, '');
    const normalized = normalizeLinkPreviewUrl(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    found.push({ raw, normalized });
  }

  return found;
};

export const collectDraftUrls = (draft: ComposerDraft): DetectedUrl[] =>
  extractPreviewUrls(
    draft.variant === 'todo'
      ? draft.todoItems.map((item) => item.text).join('\n')
      : draft.content.preview,
  );

export const collectMessageUrls = (message: Message): DetectedUrl[] =>
  extractPreviewUrls(
    message.variant === 'todo'
      ? message.content.items.map((item) => item.content.preview).join('\n')
      : message.content.preview,
  );

export const syncLinkPreviewState = (
  current: LinkPreviewState | null,
  urls: DetectedUrl[],
): LinkPreviewState | null => {
  const first = urls[0];
  if (!first) return null;
  if (!current) {
    return {
      enabled: true,
      primaryUrl: first.raw,
      normalizedUrl: first.normalized,
    };
  }
  if (current.normalizedUrl === first.normalized) return current;
  return {
    enabled: current.enabled,
    primaryUrl: first.raw,
    normalizedUrl: first.normalized,
  };
};

export const isLinkOnlyText = (text: string): boolean => {
  let found = false;
  const remainder = repairBrokenUrlSeparators(text).replace(
    URL_PATTERN,
    (match) => {
      const raw = match.replace(TRAILING_PUNCTUATION, '');
      if (!normalizeLinkPreviewUrl(raw)) return match;
      found = true;
      return match.slice(raw.length);
    },
  );
  if (!found) return false;
  return !remainder.replace(/[\s.,;:!?()[\]{}|-]+/g, '');
};

const linkifyTextNode = (node: JSONContent): JSONContent[] => {
  if (node.type !== 'text' || !node.text) return [node];

  const repairedText = repairBrokenUrlSeparators(node.text);
  const matches = [...repairedText.matchAll(URL_PATTERN)];
  if (!matches.length) return [node];

  // Rebuild URL marks from the visible text. Older documents may contain one
  // inclusive link mark spanning adjacent URLs, which makes every anchor point
  // to the first URL even though their labels differ.
  const nonLinkMarks = node.marks?.filter((mark) => mark.type !== 'link') ?? [];
  const unlinkedNode = { ...node, marks: nonLinkMarks };

  const parts: JSONContent[] = [];
  let cursor = 0;
  for (const match of matches) {
    const index = match.index ?? 0;
    const raw = match[0].replace(TRAILING_PUNCTUATION, '');
    const href = normalizeLinkPreviewUrl(raw);
    if (!href) continue;
    if (index > cursor) {
      parts.push({ ...unlinkedNode, text: repairedText.slice(cursor, index) });
    }
    parts.push({
      ...unlinkedNode,
      text: raw,
      marks: [...nonLinkMarks, { type: 'link', attrs: { href } }],
    });
    cursor = index + raw.length;
  }
  if (cursor < repairedText.length) {
    parts.push({ ...unlinkedNode, text: repairedText.slice(cursor) });
  }
  return parts.length ? parts : [node];
};

export const linkifyRichTextDocument = (node: JSONContent): JSONContent => ({
  ...node,
  ...(node.content
    ? {
        content: node.content.flatMap((child) =>
          child.type === 'text'
            ? linkifyTextNode(child)
            : [linkifyRichTextDocument(child)],
        ),
      }
    : {}),
});
