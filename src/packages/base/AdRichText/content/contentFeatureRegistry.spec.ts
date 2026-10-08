// @vitest-environment jsdom

import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAdRichTextExtensions } from '../AdRichTextEngine';
import {
  contentContactSuppressionKey,
  getContentContactEditorState,
} from '../extensions/contentContact';
import { getContentLinkEditorState } from '../extensions/contentLink';
import { useSecretRuntime } from '../extensions/contentSecret';
import { getContentTagSuggestionState } from '../extensions/contentTag';
import { createRichTextContent } from '../richtext/createRichTextContent';
import {
  CONTENT_FEATURES,
  getContentFeatureState,
  runContentFeature,
  type ContentFeatureId,
} from './contentFeatureRegistry';

const editors: Editor[] = [];
type TestMark = { type: string; attrs?: { copyId?: unknown } };
type TestJsonNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TestMark[];
  content?: TestJsonNode[];
};
const getTestJsonNodes = (editor: Editor) =>
  (editor.getJSON() as unknown as TestJsonNode).content?.[0]?.content ?? [];
const getParagraphAlignments = (nodes?: TestJsonNode[]) =>
  nodes?.map((node) => node.attrs?.['textAlign'] ?? null);

const createEditor = () => {
  const editor = new Editor({
    extensions: createAdRichTextExtensions(),
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    },
  });
  editors.push(editor);
  editor.commands.setTextSelection({ from: 1, to: 6 });
  return editor;
};

const typeText = (editor: Editor, text: string) => {
  for (const character of text) {
    const { from, to } = editor.state.selection;
    let handled = false;
    editor.view.someProp('handleTextInput', (handler) => {
      if (
        handler(editor.view, from, to, character, () =>
          editor.state.tr.insertText(character, from, to),
        )
      ) {
        handled = true;
        return true;
      }
      return undefined;
    });
    if (!handled) editor.commands.insertContent(character);
  }
};

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
  vi.unstubAllGlobals();
});

describe('Content feature registry', () => {
  it('has unique ids and the planned Phase 1 grouping', () => {
    const ids = CONTENT_FEATURES.map((feature) => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      CONTENT_FEATURES.filter((feature) => feature.status === 'enabled').map(
        (feature) => feature.id,
      ),
    ).toEqual([
      'bold',
      'italic',
      'underline',
      'strike',
      'alignment',
      'tag',
      'reference',
      'link',
      'phone',
      'email',
      'secret',
      'copy',
      'clear-content',
    ]);
    expect(
      CONTENT_FEATURES.filter((feature) => feature.scope === 'block').map(
        (feature) => feature.id,
      ),
    ).toEqual(['alignment']);
    expect(
      CONTENT_FEATURES.filter((feature) => feature.group === 'entities').map(
        (feature) => feature.id,
      ),
    ).toEqual(['tag', 'reference', 'link', 'phone', 'email']);
    expect(
      CONTENT_FEATURES.filter((feature) => feature.group === 'special').map(
        (feature) => feature.id,
      ),
    ).toEqual(['secret', 'copy']);
  });

  it.each([
    'bold',
    'italic',
    'underline',
    'strike',
  ] satisfies ContentFeatureId[])(
    'serializes and rehydrates the %s mark without changing preview',
    (featureId) => {
      const editor = createEditor();
      expect(runContentFeature(editor, featureId)).toBe(true);
      expect(getContentFeatureState(editor)[featureId]).toMatchObject({
        active: true,
        enabled: true,
      });

      const content = createRichTextContent(editor.getJSON());
      expect(content.preview).toBe('hello');
      expect(
        content.json.content?.[0]?.content?.[0]?.marks?.some(
          (mark) => mark.type === featureId,
        ),
      ).toBe(true);

      const rehydrated = new Editor({
        extensions: createAdRichTextExtensions(),
        content: content.json,
      });
      editors.push(rehydrated);
      expect(rehydrated.getJSON()).toEqual(content.json);
      expect(createRichTextContent(rehydrated.getJSON()).preview).toBe('hello');
    },
  );

  it('aligns the current paragraph at a collapsed caret', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ],
    });
    editor.commands.setTextSelection(7);

    expect(runContentFeature(editor, 'alignment', { value: 'center' })).toBe(
      true,
    );
    expect(
      getParagraphAlignments((editor.getJSON() as TestJsonNode).content),
    ).toEqual([null, 'center']);
  });

  it('aligns a whole paragraph from a partial text selection', () => {
    const editor = createEditor();
    editor.commands.setTextSelection({ from: 2, to: 4 });

    expect(runContentFeature(editor, 'alignment', { value: 'right' })).toBe(
      true,
    );
    expect(editor.getJSON().content?.[0]?.attrs?.textAlign).toBe('right');
    expect(
      (editor.getJSON() as TestJsonNode).content?.[0]?.content?.[0]?.text,
    ).toBe('hello');
  });

  it('aligns every paragraph intersected by a selection and reports mixed state', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [{ type: 'text', text: 'one' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'right' },
          content: [{ type: 'text', text: 'two' }],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'three' }] },
      ],
    });
    editor.commands.setTextSelection({ from: 2, to: 10 });
    expect(getContentFeatureState(editor).alignment).toEqual({
      enabled: true,
      active: true,
      value: 'mixed',
    });

    expect(runContentFeature(editor, 'alignment', { value: 'center' })).toBe(
      true,
    );
    expect(
      getParagraphAlignments((editor.getJSON() as TestJsonNode).content),
    ).toEqual(['center', 'center', null]);
  });

  it.each(['left', 'center', 'right'] as const)(
    'persists %s alignment through JSON rehydration without changing preview',
    (alignment) => {
      const editor = createEditor();
      expect(runContentFeature(editor, 'alignment', { value: alignment })).toBe(
        true,
      );
      const content = createRichTextContent(editor.getJSON());
      expect(content.json.content?.[0]?.attrs?.textAlign).toBe(alignment);
      expect(content.preview).toBe('hello');

      const rehydrated = new Editor({
        extensions: createAdRichTextExtensions(),
        content: content.json,
      });
      editors.push(rehydrated);
      expect(rehydrated.getJSON()).toEqual(content.json);
      expect(rehydrated.getHTML()).toContain(`text-align: ${alignment}`);
    },
  );

  it('preserves an Entity node and its attributes while aligning its paragraph', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Call ' },
            {
              type: 'contentTag',
              attrs: { tagId: 'tag:1', label: 'Alice', colorId: 'blush' },
            },
            { type: 'text', text: ' today' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 3, to: 8 });
    const entityBefore = editor.getJSON().content?.[0]?.content?.[1];

    expect(runContentFeature(editor, 'alignment', { value: 'center' })).toBe(
      true,
    );
    expect(editor.getJSON().content?.[0]?.content?.[1]).toEqual(entityBefore);
  });

  it('preserves Copy and Secret wrappers with aligned paragraph content', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'contentCopyBlock',
          attrs: { copyId: 'copy:1' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'one' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'two' }],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 2, to: 10 });
    expect(runContentFeature(editor, 'alignment', { value: 'right' })).toBe(
      true,
    );
    const copy = editor.getJSON().content?.[0];
    expect(copy?.type).toBe('contentCopyBlock');
    expect(copy?.attrs?.copyId).toBe('copy:1');
    expect(getParagraphAlignments(copy?.content)).toEqual(['right', 'right']);

    editor.commands.setTextSelection({ from: 2, to: 10 });
    expect(runContentFeature(editor, 'secret')).toBe(true);
    const secret = (editor.getJSON() as TestJsonNode).content?.[0];
    expect(secret?.type).toBe('contentCopyBlock');
    const secretNode: TestJsonNode | undefined = secret?.content?.[0];
    expect(secretNode?.type).toBe('secretContentBlock');
    const secretId = secretNode?.attrs?.['secretId'];
    expect(typeof secretId).toBe('string');
    const hydration =
      useSecretRuntime.getState().hydrations[
        typeof secretId === 'string' ? secretId : ''
      ];
    expect(
      getParagraphAlignments(hydration?.content as TestJsonNode[] | undefined),
    ).toEqual(['right', 'right']);
  });

  it('applies Secret Content to a selected range with a safe preview', () => {
    const editor = createEditor();
    expect(runContentFeature(editor, 'secret')).toBe(true);
    const json = editor.getJSON();
    expect(JSON.stringify(json)).toContain('secretContentInline');
    expect(JSON.stringify(json)).not.toContain('"text":"hello"');
    expect(createRichTextContent(json).preview).toBe('[Secret]');
  });

  it('applies a Copy wrapper to selected text and preserves its plain preview', () => {
    const editor = createEditor();
    expect(getContentFeatureState(editor).copy).toEqual({
      active: false,
      enabled: true,
    });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    expect(getContentFeatureState(editor).copy).toEqual({
      active: true,
      enabled: true,
    });
    const content = createRichTextContent(editor.getJSON());
    expect(content.preview).toBe('hello');
    expect(JSON.stringify(content.json)).toMatch(
      /"type":"contentCopyInline","attrs":\{"copyId":"[^"]+"\}/,
    );
  });

  it('keeps Copy disabled at a collapsed caret and whitespace selection', () => {
    const editor = createEditor();
    editor.commands.setTextSelection(3);
    expect(getContentFeatureState(editor).copy).toEqual({
      active: false,
      enabled: false,
    });
    expect(runContentFeature(editor, 'copy')).toBe(false);
    editor.commands.setContent('<p>   </p>');
    editor.commands.setTextSelection({ from: 1, to: 4 });
    expect(getContentFeatureState(editor).copy?.enabled).toBe(false);
    expect(runContentFeature(editor, 'copy')).toBe(false);
  });

  it('wraps mixed formatting and complete atomic entities in one Copy range', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Use ', marks: [{ type: 'bold' }] },
            {
              type: 'contentTag',
              attrs: { tagId: 'tag:1', label: 'Japanese', colorId: 'blush' },
            },
            { type: 'text', text: ' and ' },
            {
              type: 'contentReference',
              attrs: {
                targetType: 'chatbox',
                targetId: 'cb:1',
                fallbackLabel: 'Study Notes',
                fallbackChatboxId: null,
              },
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({
      from: 1,
      to: editor.state.doc.content.size - 1,
    });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    const wrapper = editor.getJSON().content?.[0]?.content?.[0] as
      | TestJsonNode
      | undefined;
    expect(wrapper?.type).toBe('contentCopyInline');
    expect(wrapper?.attrs?.['copyId']).toEqual(expect.any(String));
    expect(wrapper?.content).toHaveLength(4);
    expect(createRichTextContent(editor.getJSON()).preview).toBe(
      'Use #Japanese and @Study Notes',
    );
  });

  it('Clear removes only the Copy wrapper and preserves inner semantics', () => {
    const editor = createEditor();
    editor.commands.setContent({
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
                  text: 'Alice',
                  marks: [
                    { type: 'bold' },
                    { type: 'link', attrs: { href: 'https://alice.test' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    expect(runContentFeature(editor, 'clear-content')).toBe(true);
    const marks = (editor.getJSON().content?.[0]?.content?.[0]?.marks ??
      []) as unknown as TestMark[];
    expect(marks.some((mark) => mark.type === 'bold')).toBe(true);
    expect(marks.some((mark) => mark.type === 'link')).toBe(true);
  });

  it('preserves Link, Phone and Email marks inside Copy Content', () => {
    const editor = createEditor();
    editor.commands.setContent({
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
                  attrs: {
                    href: 'https://alice.test/',
                    previewEnabled: true,
                  },
                },
              ],
            },
            { type: 'text', text: ' ' },
            {
              type: 'text',
              text: '0909 123 456',
              marks: [
                {
                  type: 'contentPhone',
                  attrs: { normalizedPhone: '0909123456' },
                },
              ],
            },
            { type: 'text', text: ' ' },
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
      ],
    });
    editor.commands.setTextSelection({
      from: 1,
      to: editor.state.doc.content.size - 1,
    });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    const serialized = JSON.stringify(editor.getJSON());
    expect(serialized).toContain('"type":"link"');
    expect(serialized).toContain('"type":"contentPhone"');
    expect(serialized).toContain('"type":"contentEmail"');
    expect(serialized.match(/"type":"contentCopyInline"/g)).toHaveLength(1);
  });

  it('keeps editing inside Copy and leaves typing after its boundary plain', () => {
    const editor = createEditor();
    expect(runContentFeature(editor, 'copy')).toBe(true);
    editor.commands.setTextSelection(3);
    editor.commands.insertContent('X');
    expect(JSON.stringify(editor.getJSON())).toContain('hXello');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent('!');
    const lastNode = editor.state.doc.lastChild?.lastChild;
    expect(lastNode?.text).toBe('!');
    expect(lastNode?.marks).toHaveLength(0);
  });

  it('merges overlapping Copy ranges without nesting wrappers', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:a' },
              content: [{ type: 'text', text: 'first' }],
            },
            { type: 'text', text: ' middle ' },
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:b' },
              content: [{ type: 'text', text: 'second' }],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 4, to: 17 });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    const copies = (editor.getJSON().content?.[0]?.content ?? []).filter(
      (node) => node.type === 'contentCopyInline',
    );
    expect(copies).toHaveLength(1);
    expect(JSON.stringify(copies[0])).not.toMatch(
      /contentCopyInline.*contentCopyInline/,
    );
  });

  it('treats applying Copy inside one existing range as an idempotent no-op', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'contentCopyInline',
              attrs: { copyId: 'copy:stable' },
              content: [{ type: 'text', text: 'copy me' }],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 2, to: 5 });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    expect(JSON.stringify(editor.getJSON())).toContain('copy:stable');
  });

  it('toggles the whole Copy range off when the caret is inside it', () => {
    const editor = createEditor();
    expect(runContentFeature(editor, 'copy')).toBe(true);
    editor.commands.setTextSelection(3);
    expect(getContentFeatureState(editor).copy).toEqual({
      active: true,
      enabled: true,
    });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentCopy');
    expect(editor.getText()).toBe('hello');
  });

  it('treats the start of Copy as outside and the end as inside', () => {
    const editor = createEditor();
    editor.commands.setContent('before copied after');
    editor.commands.setTextSelection({ from: 8, to: 14 });
    expect(runContentFeature(editor, 'copy')).toBe(true);

    editor.commands.setTextSelection(8);
    expect(getContentFeatureState(editor).copy).toEqual({
      active: false,
      enabled: false,
    });

    editor.commands.setTextSelection(14);
    expect(getContentFeatureState(editor).copy).toEqual({
      active: true,
      enabled: true,
    });
  });

  it('copies a whole semantic entity when only its caret or substring is targeted', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'x ' },
            {
              type: 'text',
              text: 'Alice',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://alice.test/',
                    previewEnabled: true,
                  },
                },
              ],
            },
            { type: 'text', text: ' y ' },
            {
              type: 'text',
              text: '0909 123 456',
              marks: [
                {
                  type: 'contentPhone',
                  attrs: { normalizedPhone: '0909123456' },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(5);
    expect(getContentFeatureState(editor).copy?.enabled).toBe(true);
    expect(runContentFeature(editor, 'copy')).toBe(true);
    let nodes = getTestJsonNodes(editor);
    expect(nodes[1]?.type).toBe('contentCopyInline');
    expect(nodes[1]?.content?.[0]?.text).toBe('Alice');
    expect(JSON.stringify(nodes[0])).not.toContain('contentCopy');

    editor.commands.setTextSelection({ from: 14, to: 16 });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    nodes = getTestJsonNodes(editor);
    const phoneCopy = nodes.find(
      (node) =>
        node.type === 'contentCopyInline' &&
        node.content?.[0]?.text === '0909 123 456',
    );
    expect(phoneCopy).toBeDefined();
  });

  it('copies only an ordinary text selection and removes blank Copy remnants', () => {
    const editor = createEditor();
    editor.commands.setTextSelection({ from: 2, to: 4 });
    expect(runContentFeature(editor, 'copy')).toBe(true);
    const nodes = getTestJsonNodes(editor);
    const copied = nodes.find(
      (node) =>
        node.type === 'contentCopyInline' && node.content?.[0]?.text === 'el',
    );
    expect(copied).toBeDefined();
    expect(
      nodes.filter((node) => node.type === 'contentCopyInline'),
    ).toHaveLength(1);

    let copiedFrom = -1;
    let copiedTo = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'contentCopyInline') {
        copiedFrom = pos + 1;
        copiedTo = pos + node.content.size + 1;
        return false;
      }
    });
    editor.commands.setTextSelection({ from: copiedFrom, to: copiedTo });
    editor.commands.insertContent(' ');
    expect(editor.getText()).toBe('h lo');
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentCopy');
    expect(
      editor.state.storedMarks?.some(
        (mark) => mark.type.name === 'contentCopy',
      ) ?? false,
    ).toBe(false);
  });

  it('removes Copy state after deleting its text from the middle with Backspace and Delete', () => {
    const editor = createEditor();
    editor.commands.setContent('leftCOPYright');
    editor.commands.setTextSelection({ from: 5, to: 9 });
    expect(runContentFeature(editor, 'copy')).toBe(true);

    let copyFrom = -1;
    let copyLength = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'contentCopyInline') {
        copyFrom = pos + 1;
        copyLength = node.content.size;
        return false;
      }
    });
    for (let index = 0; index < copyLength; index += 1)
      editor.view.dispatch(editor.state.tr.delete(copyFrom, copyFrom + 1));

    expect(editor.getText()).toBe('leftright');
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentCopy');
    expect(getContentFeatureState(editor).copy).toEqual({
      active: false,
      enabled: false,
    });
  });

  it.each([
    {
      mark: 'link',
      attrs: { href: 'https://alice.test/', previewEnabled: true },
    },
    { mark: 'contentPhone', attrs: { normalizedPhone: '0909123456' } },
    {
      mark: 'contentEmail',
      attrs: { normalizedEmail: 'alice@example.com' },
    },
  ])('does not leave an empty $mark entity after deleting all text', (item) => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'entity',
              marks: [{ type: item.mark, attrs: item.attrs }],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: 7 });
    editor.commands.deleteSelection();
    expect(editor.getText()).toBe('');
    expect(JSON.stringify(editor.getJSON())).not.toContain(item.mark);
  });

  it('inserts a Tag node with stable fallback attrs and preview text', () => {
    const editor = createEditor();
    editor.commands.setTextSelection(6);
    expect(runContentFeature(editor, 'tag')).toBe(true);
    expect(
      editor.commands.insertContentTag({
        tagId: 'tag:japanese',
        label: 'Japanese',
        colorId: 'blush',
      }),
    ).toBe(true);

    const content = createRichTextContent(editor.getJSON());
    expect(content.preview).toBe('hello#Japanese ');
    expect(content.json.content?.[0]?.content?.[1]).toMatchObject({
      type: 'contentTag',
      attrs: {
        tagId: 'tag:japanese',
        label: 'Japanese',
        colorId: 'blush',
      },
    });
  });

  it('inserts and round-trips a Message Reference without exposing its id in preview', () => {
    const editor = createEditor();
    editor.commands.setTextSelection(6);
    expect(runContentFeature(editor, 'reference')).toBe(true);
    expect(
      editor.commands.insertContentReference({
        targetType: 'message',
        targetId: 'message:secret-id',
        fallbackLabel: 'Morning note',
        fallbackChatboxId: 'chatbox:journal',
      }),
    ).toBe(true);
    const content = createRichTextContent(editor.getJSON());
    expect(content.preview).toBe('hello@Morning note ');
    expect(content.preview).not.toContain('secret-id');
    expect(content.json.content?.[0]?.content?.[1]).toMatchObject({
      type: 'contentReference',
      attrs: {
        targetType: 'message',
        targetId: 'message:secret-id',
        fallbackLabel: 'Morning note',
        fallbackChatboxId: 'chatbox:journal',
      },
    });
  });

  it('clears marks and semantic nodes to their visible plain text', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hi ', marks: [{ type: 'bold' }] },
            {
              type: 'contentTag',
              attrs: { tagId: 'tag:one', label: 'One', colorId: 'blush' },
            },
            { type: 'text', text: ' and ' },
            {
              type: 'contentReference',
              attrs: {
                targetType: 'chatbox',
                targetId: 'chatbox:one',
                fallbackLabel: 'Journal',
              },
            },
          ],
        },
      ],
    });
    editor.commands.selectAll();
    expect(runContentFeature(editor, 'clear-content')).toBe(true);
    const content = createRichTextContent(editor.getJSON());
    expect(content.preview).toBe('Hi #One and @Journal');
    expect(JSON.stringify(content.json)).not.toContain('contentTag');
    expect(JSON.stringify(content.json)).not.toContain('contentReference');
    expect(JSON.stringify(content.json)).not.toContain('bold');
  });

  it('turns a selected URL into Link Content and Clear keeps plain text', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'https://alicenook.me' }],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: 21 });
    expect(editor.state.selection.empty).toBe(false);
    expect(runContentFeature(editor, 'link')).toBe(true);
    expect(editor.getAttributes('link')).toMatchObject({
      href: 'https://alicenook.me/',
      previewEnabled: true,
    });
    editor.commands.setTextSelection({ from: 1, to: 21 });
    expect(runContentFeature(editor, 'clear-content')).toBe(true);
    expect(editor.getJSON().content?.[0]?.content?.[0]).toEqual({
      type: 'text',
      text: 'https://alicenook.me',
    });
  });

  it('toggles an active Link entity to plain text through the shared action', () => {
    const editor = createEditor();
    editor.commands.setContent({
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
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    expect(getContentFeatureState(editor).link).toEqual({
      active: true,
      enabled: true,
    });
    expect(runContentFeature(editor, 'link')).toBe(true);
    expect(editor.getText()).toBe('Alice');
    expect(JSON.stringify(editor.getJSON())).not.toContain('"type":"link"');
  });

  it('creates a named Link Content and preserves the visible preview label', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'hello',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://www.alicenook.me/docs',
                    previewEnabled: false,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    const content = createRichTextContent(editor.getJSON());
    expect(content.preview).toBe('hello');
    expect(content.json.content?.[0]?.content?.[0]?.marks?.[0]).toMatchObject({
      type: 'link',
      attrs: {
        href: 'https://www.alicenook.me/docs',
        previewEnabled: false,
      },
    });
  });

  it('opens and removes the complete existing Link range through the editor command', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Before ' },
            {
              type: 'text',
              text: 'Entity ',
              marks: [
                { type: 'bold' },
                {
                  type: 'link',
                  attrs: {
                    href: 'https://modrinth.com/mod/entityculling',
                    previewEnabled: false,
                  },
                },
              ],
            },
            {
              type: 'text',
              text: 'Culling',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://modrinth.com/mod/entityculling',
                    previewEnabled: false,
                  },
                },
              ],
            },
            { type: 'text', text: ' after' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(10);

    expect(editor.commands.openContentLinkEditor()).toBe(true);
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      from: 8,
      to: 22,
      label: 'Entity Culling',
      href: 'https://modrinth.com/mod/entityculling',
      previewEnabled: false,
      existing: true,
    });
    expect(
      Array.from(editor.view.dom.querySelectorAll('.ad-content-link-selected'))
        .map((fragment) => fragment.textContent)
        .join(''),
    ).toBe('Entity Culling');

    expect(editor.commands.removeContentLink()).toBe(true);
    expect(getContentLinkEditorState(editor.state).open).toBe(false);
    expect(editor.getText()).toBe('Before Entity Culling after');
    const serialized = JSON.stringify(editor.getJSON());
    expect(serialized).not.toContain('"type":"link"');
    expect(serialized).toContain('"type":"bold"');
  });

  it('applies Link edits without pulling an outside selection back to the Link', () => {
    const editor = createEditor();
    editor.commands.setContent({
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
                  attrs: {
                    href: 'https://old.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
            { type: 'text', text: ' moved here' },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    expect(editor.commands.openContentLinkEditor()).toBe(true);
    editor.commands.setTextSelection(12);

    expect(
      editor.commands.applyContentLink({
        href: 'https://new.test',
        label: 'Alice',
        previewEnabled: false,
        preserveSelection: true,
      }),
    ).toBe(true);
    expect(editor.state.selection.from).toBe(12);
    expect(
      editor.getJSON().content?.[0]?.content?.[0]?.marks?.[0],
    ).toMatchObject({
      type: 'link',
      attrs: {
        href: 'https://new.test/',
        previewEnabled: false,
      },
    });
  });

  it('keeps the Link editor open while applying realtime title fallback changes', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Named link',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://old.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    expect(editor.commands.openContentLinkEditor()).toBe(true);

    expect(
      editor.commands.applyContentLink({
        href: 'https://new.test',
        label: '',
        previewEnabled: false,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getText()).toBe('https://new.test');
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      from: 1,
      to: 17,
      href: 'https://new.test',
      label: 'https://new.test',
      previewEnabled: false,
      existing: true,
    });

    const rawLink = 'https://new.test';
    const insertAt = rawLink.indexOf('.test');
    editor.commands.setTextSelection(insertAt + 1);
    expect(editor.commands.insertContent('1')).toBe(true);
    expect(editor.getText()).toBe('https://new1.test');
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      href: 'https://new1.test',
      label: 'https://new1.test',
    });
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [{ marks: [{ attrs: { href: 'https://new1.test/' } }] }],
        },
      ],
    });
  });

  it('syncs a new Link draft to the document before the URL is valid', () => {
    const editor = createEditor();
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    const anchor = { left: 120, right: 140, top: 80, bottom: 100 };
    expect(editor.commands.openContentLinkEditor(anchor)).toBe(true);

    expect(
      editor.commands.applyContentLink({
        href: 'h',
        label: '',
        previewEnabled: true,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getText()).toBe('h');
    expect(JSON.stringify(editor.getJSON())).not.toContain('"type":"link"');
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      from: 1,
      to: 2,
      href: 'h',
      label: 'h',
      existing: true,
      anchor,
    });
    expect(
      editor.view.dom.querySelector('.ad-content-link-draft')?.textContent,
    ).toBe('h');

    expect(
      editor.commands.applyContentLink({
        href: 'https://alice.test',
        label: '',
        previewEnabled: true,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getText()).toBe('https://alice.test');
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            {
              text: 'https://alice.test',
              marks: [{ type: 'link', attrs: { href: 'https://alice.test/' } }],
            },
          ],
        },
      ],
    });
    expect(editor.view.dom.querySelector('.ad-content-link-draft')).toBeNull();
  });

  it('syncs a titled Link draft and removes an emptied draft range', () => {
    const editor = createEditor();
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    expect(runContentFeature(editor, 'link')).toBe(true);

    expect(
      editor.commands.applyContentLink({
        href: 'not-yet-valid',
        label: 'Alice',
        previewEnabled: true,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getText()).toBe('Alice');
    expect(JSON.stringify(editor.getJSON())).not.toContain('"type":"link"');

    expect(
      editor.commands.applyContentLink({
        href: 'https://alice.test',
        label: 'Alice',
        previewEnabled: true,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            {
              text: 'Alice',
              marks: [{ type: 'link', attrs: { href: 'https://alice.test/' } }],
            },
          ],
        },
      ],
    });

    expect(
      editor.commands.applyContentLink({
        href: '',
        label: '',
        previewEnabled: true,
        preserveSelection: true,
        closeEditor: false,
      }),
    ).toBe(true);
    expect(editor.getText()).toBe('');
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      from: 1,
      to: 1,
      href: '',
      label: '',
      existing: false,
    });
  });

  it('keeps the caret and Link editor range aligned while typing inside a Link', () => {
    const editor = createEditor();
    const text = 'https://arcaea.lowiro.com/en';
    const insertAt = text.indexOf('iro');
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
              marks: [
                {
                  type: 'link',
                  attrs: { href: text, previewEnabled: true },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(insertAt + 1);
    expect(editor.commands.openContentLinkEditor()).toBe(true);

    expect(editor.commands.insertContent('1')).toBe(true);

    const expected = `${text.slice(0, insertAt)}1${text.slice(insertAt)}`;
    expect(editor.getText()).toBe(expected);
    expect(editor.state.selection.from).toBe(insertAt + 2);
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      from: 1,
      to: expected.length + 1,
      href: expected,
      label: expected,
    });
    expect(editor.getJSON()).toMatchObject({
      content: [{ content: [{ marks: [{ attrs: { href: expected } }] }] }],
    });
  });

  it('edits only the visible title when typing inside a named Link', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Alice Nook',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://alice.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(7);
    expect(editor.commands.openContentLinkEditor()).toBe(true);

    expect(editor.commands.insertContent(' cozy')).toBe(true);

    expect(editor.getText()).toBe('Alice  cozyNook');
    expect(getContentLinkEditorState(editor.state)).toMatchObject({
      open: true,
      href: 'https://alice.test',
      label: 'Alice  cozyNook',
    });
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [{ marks: [{ attrs: { href: 'https://alice.test' } }] }],
        },
      ],
    });
  });

  it('disables every occurrence of only the requested preview URL', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'One',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://one.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
            { type: 'text', text: ' ' },
            {
              type: 'text',
              text: 'Again',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://one.test/',
                    previewEnabled: true,
                  },
                },
              ],
            },
            { type: 'text', text: ' ' },
            {
              type: 'text',
              text: 'Two',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://two.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(
      editor.commands.setContentLinkPreviewEnabled('https://one.test', false),
    ).toBe(true);

    const json = JSON.stringify(editor.getJSON());
    expect(json.match(/"previewEnabled":false/g)).toHaveLength(2);
    expect(json.match(/"previewEnabled":true/g)).toHaveLength(1);
  });

  it.each([
    {
      feature: 'phone' as const,
      text: '0909 123 456',
      mark: 'contentPhone',
      attribute: 'normalizedPhone',
      normalized: '0909123456',
    },
    {
      feature: 'email' as const,
      text: 'Alice@EXAMPLE.COM',
      mark: 'contentEmail',
      attribute: 'normalizedEmail',
      normalized: 'Alice@example.com',
    },
  ])(
    'converts and clears selected $feature Content without changing preview',
    ({ feature, text, mark, attribute, normalized }) => {
      const editor = createEditor();
      editor.commands.setContent({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      });
      editor.commands.setTextSelection({ from: 1, to: text.length + 1 });

      expect(getContentFeatureState(editor)[feature]).toMatchObject({
        active: false,
        enabled: true,
      });
      expect(runContentFeature(editor, feature)).toBe(true);
      expect(editor.getJSON()).toMatchObject({
        content: [
          {
            content: [
              {
                text,
                marks: [
                  {
                    type: mark,
                    attrs: { [attribute]: normalized },
                  },
                ],
              },
            ],
          },
        ],
      });
      expect(createRichTextContent(editor.getJSON()).preview).toBe(text);

      editor.commands.setTextSelection(2);
      expect(runContentFeature(editor, feature)).toBe(true);
      expect(JSON.stringify(editor.getJSON())).not.toContain(`"${mark}"`);
      expect(createRichTextContent(editor.getJSON()).preview).toBe(text);
      expect(contentContactSuppressionKey.getState(editor.state)).toMatchObject(
        [{ kind: feature, from: 1, to: text.length + 1, text }],
      );
    },
  );

  it.each([
    {
      text: '0909 123 456',
      mark: 'contentPhone',
      attribute: 'normalizedPhone',
      normalized: '0909123456',
    },
    {
      text: 'alice@example.com',
      mark: 'contentEmail',
      attribute: 'normalizedEmail',
      normalized: 'alice@example.com',
    },
  ])(
    'auto-converts newly typed $mark text without scanning hydrated content',
    ({ text, mark, attribute, normalized }) => {
      const editor = createEditor();
      editor.commands.clearContent();
      typeText(editor, `${text} `);
      expect(editor.getJSON()).toMatchObject({
        content: [
          {
            content: [
              {
                text,
                marks: [{ type: mark, attrs: { [attribute]: normalized } }],
              },
              { type: 'text', text: ' ' },
            ],
          },
        ],
      });

      const hydrated = createEditor();
      hydrated.commands.setContent({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      });
      expect(JSON.stringify(hydrated.getJSON())).not.toContain(`"${mark}"`);
    },
  );

  it.each([
    {
      text: '0909 123 456',
      mark: 'contentPhone',
      href: 'tel:0909123456',
    },
    {
      text: 'Alice@EXAMPLE.COM',
      mark: 'contentEmail',
      href: 'mailto:Alice@example.com',
    },
  ])(
    'renders $mark as a semantic anchor while preserving visible text',
    ({ text, mark, href }) => {
      const editor = createEditor();
      editor.commands.setContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text,
                marks: [
                  {
                    type: mark,
                    attrs:
                      mark === 'contentPhone'
                        ? { normalizedPhone: href.slice(4) }
                        : { normalizedEmail: href.slice(7) },
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(editor.getHTML()).toContain(`href="${href}"`);
      expect(editor.getText()).toBe(text);
      expect(createRichTextContent(editor.getJSON()).preview).toBe(text);
    },
  );

  it('keeps cleared contact text plain when a boundary is typed immediately after it', () => {
    const text = 'alice@example.com';
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
              marks: [
                {
                  type: 'contentEmail',
                  attrs: { normalizedEmail: text },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection({ from: 1, to: text.length + 1 });

    expect(runContentFeature(editor, 'clear-content')).toBe(true);
    editor.commands.setTextSelection(text.length + 1);
    typeText(editor, ' ');

    expect(editor.getText()).toBe(`${text} `);
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentEmail');
    expect(contentContactSuppressionKey.getState(editor.state)).toHaveLength(1);
  });

  it.each([
    ['0909 123 456', 'contentPhone'],
    ['alice@example.com', 'contentEmail'],
  ])('auto-converts pasted %s content', async (text, mark) => {
    vi.stubGlobal(
      'DataTransfer',
      class {
        setData() {}
        getData() {
          return '';
        }
      },
    );
    vi.stubGlobal(
      'ClipboardEvent',
      class extends Event {
        clipboardData = { setData: () => undefined };
      },
    );
    const editor = createEditor();
    editor.commands.clearContent();
    editor.commands.insertContent(text, { applyPasteRules: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(editor.getText()).toBe(text);
    expect(JSON.stringify(editor.getJSON())).toContain(`"${mark}"`);
  });

  it('exposes separate enabled and active states for exclusive semantic marks', () => {
    const editor = createEditor();
    editor.commands.setTextSelection(2);
    expect(getContentFeatureState(editor)).toMatchObject({
      link: { enabled: true, active: false },
      phone: { enabled: true, active: false },
      email: { enabled: true, active: false },
    });

    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '0909',
              marks: [
                {
                  type: 'contentPhone',
                  attrs: { normalizedPhone: '0909' },
                },
              ],
            },
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
      ],
    });
    editor.commands.setTextSelection(2);
    expect(getContentFeatureState(editor)).toMatchObject({
      link: { enabled: false, active: false },
      phone: { enabled: true, active: true },
      email: { enabled: false, active: false },
    });
    editor.commands.setTextSelection({
      from: 1,
      to: editor.getText().length + 1,
    });
    expect(getContentFeatureState(editor)).toMatchObject({
      link: { enabled: false, active: false },
      phone: { enabled: false, active: false },
      email: { enabled: false, active: false },
    });
  });

  it('opens a realtime contact popout at a plain caret and removes an emptied draft entity', () => {
    const editor = createEditor();
    editor.commands.setTextSelection(3);
    expect(runContentFeature(editor, 'phone')).toBe(true);
    expect(getContentContactEditorState(editor.state)).toMatchObject({
      open: true,
      kind: 'phone',
      from: 3,
      to: 3,
    });

    expect(editor.commands.applyContentContact('phone', 'abc 123')).toBe(true);
    expect(editor.getText()).toBe('heabc 123llo');
    expect(JSON.stringify(editor.getJSON())).toContain('contentPhone');
    expect(editor.commands.applyContentContact('phone', '')).toBe(true);
    expect(editor.getText()).toBe('hello');
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentPhone');
  });

  it('breaks the entire Phone mark when whitespace is inserted inside it', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '0909123456',
              marks: [
                {
                  type: 'contentPhone',
                  attrs: { normalizedPhone: '0909123456' },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(5);
    editor.commands.insertContent(' ');

    expect(editor.getText()).toBe('0909 123456');
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentPhone');
  });

  it('breaks the entire Phone mark when a block is split inside it', () => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '0909123456',
              marks: [
                {
                  type: 'contentPhone',
                  attrs: { normalizedPhone: '0909123456' },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(5);
    editor.commands.splitBlock();

    expect(editor.getText({ blockSeparator: '\n' })).toBe('0909\n123456');
    expect(JSON.stringify(editor.getJSON())).not.toContain('contentPhone');
  });

  it('keeps only a still-valid Email fragment after splitting it', () => {
    const editor = createEditor();
    const text = 'xxalice@example.com';
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
              marks: [
                {
                  type: 'contentEmail',
                  attrs: { normalizedEmail: text },
                },
              ],
            },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(3);
    editor.commands.insertContent(' ');

    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            { type: 'text', text: 'xx ' },
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
      ],
    });
  });

  it('revalidates a split raw Link but preserves a split named Link', () => {
    const raw = createEditor();
    raw.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'https://one.test/path',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://one.test/path',
                    previewEnabled: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    raw.commands.setTextSelection('https://one.test'.length + 1);
    raw.commands.insertContent(' ');
    const rawJson = JSON.stringify(raw.getJSON());
    expect(rawJson).toContain('https://one.test/');
    expect(rawJson).not.toContain('https://one.test/path');

    const named = createEditor();
    named.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Alice Nook',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://alice.test',
                    previewEnabled: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    named.commands.setTextSelection(6);
    named.commands.insertContent(' ');
    expect(JSON.stringify(named.getJSON())).toContain('https://alice.test');
  });

  it.each([
    ['alice@example.com', 'contentEmail'],
    ['0909 123 456', 'contentPhone'],
    ['https://alice.test/path', 'link'],
  ])('finalizes trailing %s Content before send', (text, mark) => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });

    expect(editor.commands.finalizeContentEntities()).toBe(true);
    expect(JSON.stringify(editor.getJSON())).toContain(`"${mark}"`);
    expect(createRichTextContent(editor.getJSON()).preview).toBe(text);
  });

  it.each([
    ['#ja', true, 'ja'],
    ['hello #ja', true, 'ja'],
    ['hello(#ja', true, 'ja'],
    ['hello#ja', false, ''],
    ['alice@example#ja', false, ''],
    ['https://alice.test/#ja', false, ''],
  ])('detects valid Tag trigger context for %s', (text, open, query) => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    editor.commands.setTextSelection(text.length + 1);
    expect(getContentTagSuggestionState(editor.state)).toMatchObject({
      open,
      query,
    });
  });

  it.each([
    ['@stu', true, 'reference'],
    ['hello (@stu', true, 'reference'],
    ['alice@example.com', false, 'tag'],
    ['https://alice.test/@stu', false, 'tag'],
  ])('detects shared Reference trigger boundary for %s', (text, open, kind) => {
    const editor = createEditor();
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    editor.commands.setTextSelection(text.length + 1);
    expect(getContentTagSuggestionState(editor.state)).toMatchObject({
      open,
      kind,
    });
  });
});
