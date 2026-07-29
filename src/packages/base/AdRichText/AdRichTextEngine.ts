import Placeholder from '@tiptap/extension-placeholder';
import type { Editor, JSONContent } from '@tiptap/core';
import { useEditor, type EditorOptions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import {
  EmojiConvertExtension,
  EmojiExtension,
} from './extensions/emoji';
import { EMPTY_DOC } from './richtext/createRichTextContent';

export const createAdRichTextExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    code: false,
  }),
  Placeholder.configure({
    placeholder: placeholder ?? '',
    emptyEditorClass: 'is-editor-empty',
    emptyNodeClass: 'is-empty',
  }),
  EmojiExtension,
  EmojiConvertExtension,
];

export type UseAdRichTextEditorOptions = {
  content: JSONContent;
  editable?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onUpdate?: (editor: Editor) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editorProps?: EditorOptions['editorProps'];
};

export const useAdRichTextEditor = ({
  content,
  editable = true,
  placeholder,
  autoFocus = false,
  onUpdate,
  onFocus,
  onBlur,
  editorProps,
}: UseAdRichTextEditorOptions) => {
  const editor = useEditor({
    extensions: createAdRichTextExtensions(placeholder),
    content: content?.type === 'doc' ? content : EMPTY_DOC,
    editable,
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'ad-richtext-prose',
        spellcheck: 'true',
      },
      ...editorProps,
    },
    onUpdate: ({ editor: next }) => {
      onUpdate?.(next);
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const next = content?.type === 'doc' ? content : EMPTY_DOC;
    const current = editor.getJSON();

    // Avoid resetting selection when parent re-renders with equivalent content.
    if (JSON.stringify(current) === JSON.stringify(next)) {
      return;
    }

    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, content]);

  return editor;
};
