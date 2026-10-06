// @vitest-environment jsdom

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { RichTextContent } from '@/packages/base';

import LinkContentPreviews, {
  getLinkPreviewLayout,
} from './LinkContentPreviews';

const createContent = (
  links: Array<{ href: string; previewEnabled?: boolean }>,
): RichTextContent => ({
  preview: links.map((link) => link.href).join(' '),
  json: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: links.map((link) => ({
          type: 'text',
          text: link.href,
          marks: [
            {
              type: 'link',
              attrs: {
                href: link.href,
                previewEnabled: link.previewEnabled ?? true,
              },
            },
          ],
        })),
      },
    ],
  },
});

describe('Link Content preview layout', () => {
  it.each([
    [0, 'full'],
    [1, 'full'],
    [2, 'full'],
    [3, 'tray'],
    [8, 'tray'],
  ] as const)('chooses %s previews as %s', (count, layout) => {
    expect(getLinkPreviewLayout(count)).toBe(layout);
  });

  it('uses full cards for two enabled unique URLs', () => {
    const markup = renderToStaticMarkup(
      <LinkContentPreviews
        content={createContent([
          { href: 'https://one.test' },
          { href: 'https://two.test' },
          { href: 'https://hidden.test', previewEnabled: false },
          { href: 'https://one.test/' },
        ])}
      />,
    );

    expect(markup).not.toContain('link previews');
    expect(markup.match(/target="_blank"/g)).toHaveLength(2);
  });

  it('uses the compact tray for three enabled unique URLs', () => {
    const markup = renderToStaticMarkup(
      <LinkContentPreviews
        content={createContent([
          { href: 'https://one.test' },
          { href: 'https://two.test' },
          { href: 'https://three.test' },
          { href: 'https://one.test/' },
        ])}
        composer
      />,
    );

    expect(markup).toContain('aria-label="3 link previews"');
    expect(markup).toContain('data-composer="true"');
    expect(markup.match(/target="_blank"/g)).toHaveLength(3);
    expect(markup).not.toContain('description');
  });

  it('only renders per-link preview dismiss actions in the composer', () => {
    const content = createContent([
      { href: 'https://one.test' },
      { href: 'https://two.test' },
      { href: 'https://three.test' },
    ]);
    const composerMarkup = renderToStaticMarkup(
      <LinkContentPreviews
        content={content}
        composer
        onDisablePreview={() => undefined}
      />,
    );
    const sentMarkup = renderToStaticMarkup(
      <LinkContentPreviews content={content} />,
    );

    expect(
      composerMarkup.match(/aria-label="Hide link preview"/g),
    ).toHaveLength(3);
    expect(sentMarkup).not.toContain('aria-label="Hide link preview"');
  });
});
