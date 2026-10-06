// @vitest-environment jsdom

import { Editor, type Content } from '@tiptap/core';
import { afterEach, describe, expect, it } from 'vitest';

import { createAdRichTextExtensions } from '../../AdRichTextEngine';
import { serializeContentCopyNode } from './contentCopy.utils';

const editors: Editor[] = [];
const createEditor = (content: Content) => {
  const editor = new Editor({
    extensions: createAdRichTextExtensions(),
    content,
  });
  editors.push(editor);
  return editor;
};

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()));

describe('Copy Content wrappers', () => {
  it('serializes visible content without semantic targets', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:1' },
              content: [
                {
                  type: 'text',
                  text: 'Alice ',
                  marks: [
                    { type: 'link', attrs: { href: 'https://hidden.test' } },
                  ],
                },
                {
                  type: 'contentTag',
                  attrs: { tagId: 'tag:1', label: 'Study', colorId: 'blush' },
                },
              ],
            },
          ],
        },
      ],
    });
    const wrapper = editor.state.doc.firstChild?.firstChild;
    expect(wrapper && serializeContentCopyNode(wrapper)).toBe('Alice #Study');
  });

  it('unwraps when the caret is strictly inside', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:1' },
              content: [{ type: 'text', text: 'copy' }],
            },
            { type: 'text', text: 'z' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(4);
    expect(editor.commands.applyContentCopy()).toBe(true);
    expect(
      editor
        .getJSON()
        .content?.[0]?.content?.some(
          (node) => node.type === 'contentCopyInline',
        ),
    ).toBe(false);
  });

  it('treats both visible content boundaries as outside', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a' },
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:1' },
              content: [{ type: 'text', text: 'copy' }],
            },
            { type: 'text', text: 'z' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    expect(editor.commands.applyContentCopy()).toBe(false);
    editor.commands.setTextSelection(7);
    expect(editor.commands.applyContentCopy()).toBe(false);
  });

  it('uses a block wrapper for a multiline selection', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: 9 });
    expect(editor.commands.applyContentCopy()).toBe(true);
    expect(editor.getJSON().content?.[0]?.type).toBe('contentCopyBlock');
  });
});
