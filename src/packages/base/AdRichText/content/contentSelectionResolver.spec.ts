// @vitest-environment jsdom

import { Editor, type Content } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { afterEach, describe, expect, it } from 'vitest';

import { createAdRichTextExtensions } from '../AdRichTextEngine';
import {
  normalizeSpecialSelection,
  resolveContentSelection,
} from './contentSelectionResolver';

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

describe('resolveContentSelection', () => {
  it('uses strict caret containment for marked entities', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'x' },
            {
              type: 'text',
              text: 'alice@example.com',
              marks: [
                {
                  type: 'contentEmail',
                  attrs: { normalizedEmail: 'alice@example.com' },
                },
              ],
            },
            { type: 'text', text: 'z' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(2);
    expect(resolveContentSelection(editor.state).entities).toHaveLength(0);
    editor.commands.setTextSelection(3);
    expect(resolveContentSelection(editor.state).entities[0]?.kind).toBe(
      'email',
    );
    editor.commands.setTextSelection(19);
    expect(resolveContentSelection(editor.state).entities).toHaveLength(0);
  });

  it('requires NodeSelection for an atomic entity to be exact', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'contentTag',
              attrs: { tagId: '1', label: 'Alice', colorId: 'blush' },
            },
          ],
        },
      ],
    });
    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 1)),
    );
    const resolved = resolveContentSelection(editor.state);
    expect(resolved.mode).toBe('entity-selection');
    expect(resolved.exactEntity?.kind).toBe('tag');
  });

  it('expands partial entities and crossing Copy wrappers to a fixed point', () => {
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
              content: [
                {
                  type: 'text',
                  text: 'alice@example.com',
                  marks: [
                    {
                      type: 'contentEmail',
                      attrs: { normalizedEmail: 'alice@example.com' },
                    },
                  ],
                },
              ],
            },
            { type: 'text', text: 'z' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 5, to: 10 });
    const normalized = normalizeSpecialSelection(editor.state);
    expect(normalized.from).toBe(3);
    expect(normalized.to).toBe(20);
  });
});
