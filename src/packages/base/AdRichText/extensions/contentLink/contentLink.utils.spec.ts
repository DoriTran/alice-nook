import { describe, expect, it } from 'vitest';

import {
  collectPreviewLinkContent,
  extractLinkContent,
  normalizeContentLinkUrl,
} from './contentLink.utils';

const doc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Alice',
          marks: [
            {
              type: 'link',
              attrs: { href: 'https://alice.test', previewEnabled: true },
            },
          ],
        },
        {
          type: 'text',
          text: ' hidden',
          marks: [
            {
              type: 'link',
              attrs: { href: 'https://hidden.test', previewEnabled: false },
            },
          ],
        },
        {
          type: 'text',
          text: ' duplicate',
          marks: [
            {
              type: 'link',
              attrs: { href: 'https://alice.test/', previewEnabled: true },
            },
          ],
        },
      ],
    },
  ],
};

describe('Link Content extraction', () => {
  it('normalizes supported URLs and rejects unsafe values', () => {
    expect(normalizeContentLinkUrl('www.alicenook.me')).toBe(
      'https://www.alicenook.me/',
    );
    expect(normalizeContentLinkUrl('mailto:alice@example.com')).toBeNull();
    expect(normalizeContentLinkUrl('https://user:pass@example.com')).toBeNull();
  });
  it('retains occurrence state while preview cards dedupe enabled URLs', () => {
    expect(extractLinkContent(doc)).toHaveLength(3);
    expect(collectPreviewLinkContent(doc)).toEqual([
      expect.objectContaining({
        normalizedUrl: 'https://alice.test/',
        visibleText: 'Alice',
        previewEnabled: true,
      }),
    ]);
  });
  it('does not treat persisted raw URL text as Link Content', () => {
    expect(
      extractLinkContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'https://alice.test' }],
          },
        ],
      }),
    ).toEqual([]);
  });
});
