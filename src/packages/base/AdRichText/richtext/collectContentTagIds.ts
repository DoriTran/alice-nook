import type { JSONContent } from '@tiptap/core';

export const collectContentTagIds = (
  json: JSONContent | null | undefined,
): string[] => {
  const ids = new Set<string>();
  const visit = (node: JSONContent | null | undefined) => {
    if (!node) return;
    if (node.type === 'contentTag' && typeof node.attrs?.tagId === 'string') {
      const id = node.attrs.tagId.trim();
      if (id) ids.add(id);
    }
    node.content?.forEach(visit);
  };
  visit(json);
  return [...ids];
};
