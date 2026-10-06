// @vitest-environment jsdom

import { Editor, generateHTML, type Content } from '@tiptap/core';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import AdRichText from '../AdRichText';
import { createAdRichTextExtensions } from '../AdRichTextEngine';
import {
  clearSecretHydrations,
  setSecretHydration,
} from '../extensions/contentSecret';

const editors: Editor[] = [];
const roots: Root[] = [];
const createEditor = (content: Content) => {
  const editor = new Editor({
    extensions: createAdRichTextExtensions(),
    content,
  });
  editors.push(editor);
  return editor;
};

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  editors.splice(0).forEach((editor) => editor.destroy());
  clearSecretHydrations();
});

describe('Content rendering language', () => {
  it.each([
    {
      mark: 'contentPhone',
      attrs: { normalizedPhone: '0909123456' },
      attribute: 'data-content-phone',
      href: 'tel:0909123456',
    },
    {
      mark: 'contentEmail',
      attrs: { normalizedEmail: 'alice@example.com' },
      attribute: 'data-content-email',
      href: 'mailto:alice@example.com',
    },
  ])('renders $mark as semantic inline text with an icon', (sample) => {
    const content: Content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'visible',
              marks: [{ type: sample.mark, attrs: sample.attrs }],
            },
          ],
        },
      ],
    };
    const extensions = createAdRichTextExtensions();
    const html = generateHTML(content, extensions);
    expect(html).toContain(sample.attribute);
    expect(html).toContain(`href="${sample.href}"`);
    const extension = extensions.find((item) => item.name === sample.mark);
    const config = extension?.config as { addMarkView?: unknown } | undefined;
    expect(config?.addMarkView).toBeTypeOf('function');
  });

  it('keeps legacy code parseable without exposing an authoring command', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'legacy', marks: [{ type: 'code' }] },
          ],
        },
      ],
    });
    expect(editor.getJSON().content?.[0]?.content?.[0]?.marks).toEqual([
      { type: 'code' },
    ]);
    expect('toggleCode' in editor.commands).toBe(false);
  });

  it('mounts a hydrated Secret nested editor without duplicate keyed plugins', async () => {
    setSecretHydration('secret:test', {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hidden' }] },
      ],
    });
    const element = document.createElement('div');
    document.body.appendChild(element);
    const root = createRoot(element);
    roots.push(root);

    await act(async () => {
      root.render(
        createElement(AdRichText, {
          value: {
            json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'secretContentInline',
                      attrs: {
                        secretId: 'secret:test',
                        version: 1,
                        keyVersion: 1,
                        ciphertext: 'ciphertext',
                        iv: 'iv',
                        authTag: 'tag',
                        displayLength: 6,
                      },
                    },
                  ],
                },
              ],
            },
            preview: '[Secret]',
          },
          onChange: () => undefined,
        }),
      );
      await Promise.resolve();
    });

    expect(element.querySelector('[data-secret-content]')).not.toBeNull();
    element.remove();
  });
});
