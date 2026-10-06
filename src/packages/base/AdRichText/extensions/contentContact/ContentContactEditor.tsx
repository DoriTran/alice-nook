import type { Editor } from '@tiptap/core';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react';

import styles from './ContentContactEditor.module.css';
import {
  getContentContactEditorState,
  type ContentContactEditorState,
} from './ContentContactExtension';

type Props = { editor: Editor; state: ContentContactEditorState };

const ContentContactEditor: FC<Props> = ({ editor, state }) => {
  const [value, setValue] = useState(state.value);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.open && state.from === state.to) inputRef.current?.focus();
  }, [state.from, state.open, state.to]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Enter') return;
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target))
        event.preventDefault();
      editor.commands.closeContentContactEditor();
      if (event.key === 'Enter') editor.commands.focus();
    };
    const closeOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || editor.view.dom.contains(target))
        return;
      editor.commands.closeContentContactEditor();
    };
    window.addEventListener('keydown', closeOnEscape, true);
    document.addEventListener('focusin', closeOutside, true);
    document.addEventListener('pointerdown', closeOutside, true);
    return () => {
      window.removeEventListener('keydown', closeOnEscape, true);
      document.removeEventListener('focusin', closeOutside, true);
      document.removeEventListener('pointerdown', closeOutside, true);
    };
  }, [editor]);

  useEffect(() => {
    const closeWhenSelectionLeaves = () => {
      const current = getContentContactEditorState(editor.state);
      if (!current.open) return;
      const selection = editor.state.selection;
      const remainsAtDraftCaret =
        current.from === current.to &&
        selection.empty &&
        selection.from === current.from;
      const remainsInEntity =
        current.from !== current.to &&
        selection.from <= current.to &&
        selection.to >= current.from;
      if (!remainsAtDraftCaret && !remainsInEntity)
        editor.commands.closeContentContactEditor();
    };
    editor.on('selectionUpdate', closeWhenSelectionLeaves);
    return () => {
      editor.off('selectionUpdate', closeWhenSelectionLeaves);
    };
  }, [editor, state.from, state.kind, state.to]);

  if (!state.open) return null;
  const rect = editor.view.coordsAtPos(state.from);
  const popupWidth = state.kind === 'phone' ? 176 : 264;
  const anchorLeft = state.anchor
    ? (state.anchor.left + state.anchor.right) / 2 - popupWidth / 2
    : rect.left;
  const anchorTop = state.anchor?.top ?? rect.top;
  const style: CSSProperties = {
    left: Math.max(8, Math.min(anchorLeft, window.innerWidth - popupWidth - 8)),
    top: Math.max(8, anchorTop - 8),
  };
  const label = state.kind === 'phone' ? 'Phone' : 'Email';

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-kind={state.kind}
      style={style}
      role="dialog"
      aria-label={`Add ${label.toLowerCase()}`}
    >
      <label className={styles.field}>
        <span>{label}</span>
        <input
          ref={inputRef}
          aria-label={label}
          value={value}
          placeholder={state.kind === 'phone' ? '+84 ...' : 'name@example.com'}
          inputMode={state.kind === 'phone' ? 'tel' : 'email'}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            editor.commands.applyContentContact(state.kind, next);
          }}
        />
      </label>
    </div>
  );
};

export default ContentContactEditor;
