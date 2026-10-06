import type { JSONContent } from '@tiptap/core';

const TRAILING_PUNCTUATION = /[.,;:!?)}\]]+$/;

export const normalizeContentLinkUrl = (raw: string): string | null => {
  const cleaned = raw.trim().replace(TRAILING_PUNCTUATION, '');
  if (!cleaned || cleaned.length > 2048) return null;
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

export type LinkContentOccurrence = {
  href: string;
  normalizedUrl: string;
  visibleText: string;
  previewEnabled: boolean;
  occurrence: number;
};

export const extractLinkContent = (
  json: JSONContent,
): LinkContentOccurrence[] => {
  const found: LinkContentOccurrence[] = [];
  const visit = (node: JSONContent) => {
    if (node.type === 'text' && node.text) {
      const mark = node.marks?.find((item) => item.type === 'link');
      const href = typeof mark?.attrs?.href === 'string' ? mark.attrs.href : '';
      const normalizedUrl = normalizeContentLinkUrl(href);
      if (normalizedUrl)
        found.push({
          href,
          normalizedUrl,
          visibleText: node.text,
          previewEnabled: mark?.attrs?.previewEnabled !== false,
          occurrence: found.length,
        });
    }
    node.content?.forEach(visit);
  };
  visit(json);
  return found;
};

export const collectPreviewLinkContent = (
  json: JSONContent,
): LinkContentOccurrence[] => {
  const seen = new Set<string>();
  return extractLinkContent(json).filter((item) => {
    if (!item.previewEnabled || seen.has(item.normalizedUrl)) return false;
    seen.add(item.normalizedUrl);
    return true;
  });
};
