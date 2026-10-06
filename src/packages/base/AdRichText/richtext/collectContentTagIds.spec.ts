import { describe, expect, it } from 'vitest';

import { collectContentTagIds } from './collectContentTagIds';
import { createRichTextContent } from './createRichTextContent';

const json = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Study ' },
        {
          type: 'contentTag',
          attrs: { tagId: 'tag:one', label: 'Japanese', colorId: 'blush' },
        },
        {
          type: 'contentTag',
          attrs: { tagId: 'tag:one', label: 'Japanese', colorId: 'blush' },
        },
      ],
    },
  ],
};

describe('Content Tag rich text helpers', () => {
  it('deduplicates tag ids while preserving duplicate inline nodes', () => {
    expect(collectContentTagIds(json)).toEqual(['tag:one']);
    expect(json.content[0].content).toHaveLength(3);
  });

  it('uses the fallback label in preview and never exposes the id', () => {
    const content = createRichTextContent(json);
    expect(content.preview).toBe('Study #Japanese#Japanese');
    expect(content.preview).not.toContain('tag:one');
  });
});
