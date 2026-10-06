import { getMarkRange, type Editor } from '@tiptap/core';
import { Image, ImageOff, Link2Off } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react';
import { createPortal } from 'react-dom';

import type { ContentLinkEditorState } from './ContentLinkExtension';

import AdIcon from '../../../AdIcon/AdIcon';
import AdTooltip from '../../../AdTooltip/AdTooltip';
import { normalizeContentLinkUrl } from './contentLink.utils';
import styles from './ContentLinkEditor.module.css';

type Props = {
  editor: Editor;
  state: ContentLinkEditorState;
  inspectorTarget?: HTMLElement | null;
};

const getEditableTitle = (state: ContentLinkEditorState) => {
  const labelUrl = normalizeContentLinkUrl(state.label);
  const hrefUrl = normalizeContentLinkUrl(state.href);
  return labelUrl && hrefUrl && labelUrl === hrefUrl ? '' : state.label;
};

const ContentLinkEditor: FC<Props> = ({ editor, state, inspectorTarget }) => {
  const [href, setHref] = useState(state.href);
  const [title, setTitle] = useState(() => getEditableTitle(state));
  const [previewEnabled, setPreviewEnabled] = useState(state.previewEnabled);
  const rootRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);
  const valuesRef = useRef({ href, title, previewEnabled });

  useEffect(() => {
    if (state.open && !state.existing && state.from === state.to)
      urlInputRef.current?.focus();
  }, [state.existing, state.from, state.open, state.to]);

  useEffect(() => {
    valuesRef.current = { href, title, previewEnabled };
  }, [href, previewEnabled, title]);

  const commit = (
    values: { href: string; title: string; previewEnabled: boolean },
    closeEditor: boolean,
    preserveSelection = true,
  ) => {
    if (committingRef.current) return false;
    committingRef.current = true;
    const applied = editor.commands.applyContentLink({
      href: values.href,
      label: values.title,
      previewEnabled: values.previewEnabled,
      preserveSelection,
      closeEditor,
    });
    committingRef.current = false;
    return applied;
  };

  const closeAndCommit = () => {
    if (!commit(valuesRef.current, true)) {
      editor.commands.closeContentLinkEditor();
    }
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Enter') return;
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target))
        event.preventDefault();
      closeAndCommit();
      if (event.key === 'Enter') editor.commands.focus();
    };
    window.addEventListener('keydown', closeOnEscape, true);
    return () => window.removeEventListener('keydown', closeOnEscape, true);
  });

  useEffect(() => {
    if (!state.existing) return;

    const applyWhenSelectionLeavesLink = () => {
      if (committingRef.current) return;
      const linkType = editor.state.schema.marks.link;
      const selection = editor.state.selection;
      const range = linkType
        ? getMarkRange(editor.state.doc.resolve(selection.from), linkType)
        : undefined;
      const remainsInLink =
        range !== undefined && range.from <= state.to && range.to >= state.from;
      if (!remainsInLink) closeAndCommit();
    };

    editor.on('selectionUpdate', applyWhenSelectionLeavesLink);
    return () => {
      editor.off('selectionUpdate', applyWhenSelectionLeavesLink);
    };
  });

  useEffect(() => {
    const applyWhenFocusLeaves = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        rootRef.current?.contains(target) ||
        editor.view.dom.contains(target) ||
        (target instanceof Element && target.closest('[data-content-shelf]'))
      ) {
        return;
      }
      closeAndCommit();
    };
    const applyWhenWindowBlurs = () => closeAndCommit();

    document.addEventListener('focusin', applyWhenFocusLeaves, true);
    document.addEventListener('pointerdown', applyWhenFocusLeaves, true);
    window.addEventListener('blur', applyWhenWindowBlurs);
    return () => {
      document.removeEventListener('focusin', applyWhenFocusLeaves, true);
      document.removeEventListener('pointerdown', applyWhenFocusLeaves, true);
      window.removeEventListener('blur', applyWhenWindowBlurs);
    };
  });

  if (!state.open) return null;
  const rect = editor.view.coordsAtPos(state.from);
  const anchorLeft = state.anchor
    ? (state.anchor.left + state.anchor.right) / 2 - 176
    : rect.left;
  const anchorTop = state.anchor?.top ?? rect.top;
  const style: CSSProperties = {
    left: Math.max(8, Math.min(anchorLeft, window.innerWidth - 360)),
    top: Math.max(8, anchorTop - 8),
  };

  const updateRealtime = (next: {
    href: string;
    title: string;
    previewEnabled: boolean;
  }) => {
    valuesRef.current = next;
    commit(next, false);
  };

  const removeLink = () => {
    committingRef.current = true;
    if (editor.commands.removeContentLink()) {
      editor.commands.focus();
    } else {
      committingRef.current = false;
    }
  };

  const content = (
    <div
      ref={rootRef}
      className={styles.root}
      data-docked={inspectorTarget ? '' : undefined}
      style={inspectorTarget ? undefined : style}
      role="dialog"
      aria-label={state.existing ? 'Edit link' : 'Add link'}
    >
      <div className={styles.field}>
        <span>Title</span>
        <span className={styles.inputRow}>
          <input
            aria-label="Link title"
            value={title}
            placeholder={href || 'Link title (optional)'}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              updateRealtime({ href, title: next, previewEnabled });
            }}
          />
          <AdTooltip
            label={previewEnabled ? 'Hide preview' : 'Show preview'}
            position="top"
            withArrow={false}
          >
            <button
              type="button"
              className={styles.previewToggle}
              data-active={previewEnabled || undefined}
              aria-label={previewEnabled ? 'Hide preview' : 'Show preview'}
              aria-pressed={previewEnabled}
              onClick={() => {
                const next = !previewEnabled;
                setPreviewEnabled(next);
                updateRealtime({ href, title, previewEnabled: next });
              }}
            >
              <AdIcon
                icon={previewEnabled ? Image : ImageOff}
                source="lucide"
                size={17}
              />
            </button>
          </AdTooltip>
        </span>
      </div>

      <div className={styles.field}>
        <span>URL</span>
        <span className={styles.inputRow}>
          <input
            ref={urlInputRef}
            aria-label="Link URL"
            value={href}
            placeholder="https://..."
            inputMode="url"
            onChange={(event) => {
              const next = event.target.value;
              setHref(next);
              updateRealtime({ href: next, title, previewEnabled });
            }}
          />
          {state.existing ? (
            <AdTooltip label="Remove link" position="top" withArrow={false}>
              <button
                type="button"
                className={styles.remove}
                aria-label="Remove link"
                onClick={removeLink}
              >
                <AdIcon icon={Link2Off} source="lucide" size={17} />
              </button>
            </AdTooltip>
          ) : null}
        </span>
      </div>
    </div>
  );

  return inspectorTarget ? createPortal(content, inspectorTarget) : content;
};

export default ContentLinkEditor;
