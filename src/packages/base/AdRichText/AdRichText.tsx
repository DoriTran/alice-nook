import { EditorContent } from '@tiptap/react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
} from 'react';

import type { AdRichTextHandle, RichTextContent } from './types';

import { useLatestRef } from '../AdDragDrop/useLatestRef';
import styles from './AdRichText.module.css';
import { useAdRichTextEditor } from './AdRichTextEngine';
import { createRichTextContent } from './richtext/createRichTextContent';
import { isEmojiToken } from './richtext/splitPlainTextToInlineNodes';

export type AdRichTextProps = {
  value: RichTextContent;
  onChange: (content: RichTextContent) => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
  className?: string;
  grow?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Called when Enter should submit (caller decides Shift/Enter policy). */
  onSubmit?: () => void;
  /** When true, Enter submits (Shift+Enter newline). When false, Shift+Enter submits. */
  enterSubmits?: boolean;
};

const AdRichText = forwardRef<AdRichTextHandle, AdRichTextProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Write something...',
      editable = true,
      autoFocus = false,
      className,
      grow = false,
      onFocus,
      onBlur,
      onSubmit,
      enterSubmits = true,
    },
    ref,
  ) => {
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);
    const onFocusRef = useRef(onFocus);
    const onBlurRef = useRef(onBlur);
    const enterSubmitsRef = useRef(enterSubmits);
    /** Preserve selection when emoji picker steals focus on mousedown. */
    const selectionRef = useRef<{ from: number; to: number } | null>(null);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    useEffect(() => {
      onFocusRef.current = onFocus;
    }, [onFocus]);

    useEffect(() => {
      onBlurRef.current = onBlur;
    }, [onBlur]);

    useEffect(() => {
      enterSubmitsRef.current = enterSubmits;
    }, [enterSubmits]);

    const editor = useAdRichTextEditor({
      content: value.json,
      editable,
      placeholder,
      autoFocus,
      onUpdate: (next) => {
        onChangeRef.current(createRichTextContent(next.getJSON()));
      },
      onFocus: () => {
        onFocusRef.current?.();
      },
      onBlur: () => {
        onBlurRef.current?.();
      },
      editorProps: {
        handleKeyDown: (_view, event) => {
          if (
            !onSubmitRef.current ||
            event.key !== 'Enter' ||
            event.isComposing
          ) {
            return false;
          }

          const shouldSend = enterSubmitsRef.current
            ? !event.shiftKey
            : event.shiftKey;

          if (shouldSend) {
            event.preventDefault();
            onSubmitRef.current();
            return true;
          }

          return false;
        },
      },
    });

    const editorRef = useLatestRef(editor);

    const saveSelection = () => {
      const current = editorRef.current;
      if (!current || current.isDestroyed) {
        return;
      }

      selectionRef.current = {
        from: current.state.selection.from,
        to: current.state.selection.to,
      };
    };

    useEffect(() => {
      if (!editor) {
        return;
      }

      const onBlurSave = () => {
        saveSelection();
      };

      editor.on('blur', onBlurSave);
      return () => {
        editor.off('blur', onBlurSave);
      };
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editor?.commands.focus();
        },
        insertAtCursor: (insertValue: string) => {
          if (!editor || editor.isDestroyed || !insertValue) {
            return;
          }

          const sel = selectionRef.current;
          if (sel && !editor.isFocused) {
            editor.commands.setTextSelection(sel);
          }

          if (isEmojiToken(insertValue)) {
            editor.chain().focus().insertEmoji(insertValue).run();
          } else {
            editor.chain().focus().insertContent(insertValue).run();
          }

          selectionRef.current = {
            from: editor.state.selection.from,
            to: editor.state.selection.to,
          };
        },
      }),
      [editor],
    );

    const handleMouseUp = () => {
      saveSelection();
    };

    const handleKeyUp = (_event: KeyboardEvent) => {
      saveSelection();
    };

    const rootClass = [
      styles.composer,
      grow ? styles.composerGrow : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      // Caret snapshot for emoji-picker focus steal — not a user-facing control.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mouse/key up only
      <div
        className={rootClass}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
      >
        <EditorContent editor={editor} />
      </div>
    );
  },
);

AdRichText.displayName = 'AdRichText';

export default AdRichText;
