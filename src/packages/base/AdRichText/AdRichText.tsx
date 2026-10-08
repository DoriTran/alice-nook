import { splitBlock } from '@tiptap/pm/commands';
import { NodeSelection } from '@tiptap/pm/state';
import { EditorContent } from '@tiptap/react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import type { ContentFeatureState } from './content';
import type { AdRichTextHandle, RichTextContent } from './types';

import { useLatestRef } from '../AdDragDrop/useLatestRef';
import styles from './AdRichText.module.css';
import { useAdRichTextEditor } from './AdRichTextEngine';
import { getContentFeatureState, runContentFeature } from './content';
import {
  getContentContactEditorState,
  type ContentContactEditorState,
} from './extensions/contentContact';
import ContentContactEditor from './extensions/contentContact/ContentContactEditor';
import {
  getContentLinkEditorState,
  type ContentLinkEditorState,
} from './extensions/contentLink';
import ContentLinkEditor from './extensions/contentLink/ContentLinkEditor';
import { useSecretRuntime } from './extensions/contentSecret';
import {
  getContentEntitySuggestionState,
  type ContentEntitySuggestionState,
} from './extensions/contentTag';
import ContentTagSuggestion from './extensions/contentTag/ContentTagSuggestion';
import { createRichTextContent } from './richtext/createRichTextContent';
import { isEmojiToken } from './richtext/splitPlainTextToInlineNodes';

const CLOSED_TAG_SUGGESTION: ContentEntitySuggestionState = {
  open: false,
  kind: 'tag',
  from: 0,
  to: 0,
  query: '',
};
const CLOSED_LINK_EDITOR: ContentLinkEditorState = {
  open: false,
  from: 0,
  to: 0,
  href: '',
  label: '',
  previewEnabled: true,
  existing: false,
};
const CLOSED_CONTACT_EDITOR: ContentContactEditorState = {
  open: false,
  kind: 'phone',
  from: 0,
  to: 0,
  value: '',
};

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
  onContentFeatureStateChange?: (state: ContentFeatureState) => void;
  onContentLinkEditorOpenChange?: (open: boolean) => void;
  contentInspectorTarget?: HTMLElement | null;
  onContentContactEditorOpenChange?: (
    feature: 'phone' | 'email' | null,
  ) => void;
  /** Called when Enter should submit (caller decides Shift/Enter policy). */
  onSubmit?: () => void;
  /** When true, Enter submits (Shift+Enter newline). When false, Shift+Enter submits. */
  enterSubmits?: boolean;
  /** Variant-level keyboard handling. Return true when the event was handled. */
  onKeyDown?: (event: globalThis.KeyboardEvent) => boolean;
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
      onContentFeatureStateChange,
      onContentLinkEditorOpenChange,
      contentInspectorTarget,
      onContentContactEditorOpenChange,
      onSubmit,
      enterSubmits = true,
      onKeyDown,
    },
    ref,
  ) => {
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);
    const onFocusRef = useRef(onFocus);
    const onBlurRef = useRef(onBlur);
    const onContentFeatureStateChangeRef = useRef(onContentFeatureStateChange);
    const onContentLinkEditorOpenChangeRef = useRef(
      onContentLinkEditorOpenChange,
    );
    const onContentContactEditorOpenChangeRef = useRef(
      onContentContactEditorOpenChange,
    );
    const enterSubmitsRef = useRef(enterSubmits);
    const onKeyDownRef = useRef(onKeyDown);
    /** Preserve selection when emoji picker steals focus on mousedown. */
    const selectionRef = useRef<{ from: number; to: number } | null>(null);
    const [tagSuggestion, setTagSuggestion] = useState(CLOSED_TAG_SUGGESTION);
    const [linkEditor, setLinkEditor] = useState(CLOSED_LINK_EDITOR);
    const [contactEditor, setContactEditor] = useState(CLOSED_CONTACT_EDITOR);

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
      onContentFeatureStateChangeRef.current = onContentFeatureStateChange;
    }, [onContentFeatureStateChange]);

    useEffect(() => {
      onContentLinkEditorOpenChangeRef.current = onContentLinkEditorOpenChange;
    }, [onContentLinkEditorOpenChange]);

    useEffect(() => {
      onContentContactEditorOpenChangeRef.current =
        onContentContactEditorOpenChange;
    }, [onContentContactEditorOpenChange]);

    useEffect(() => {
      enterSubmitsRef.current = enterSubmits;
    }, [enterSubmits]);

    useEffect(() => {
      onKeyDownRef.current = onKeyDown;
    }, [onKeyDown]);

    const editor = useAdRichTextEditor({
      content: value.json,
      editable,
      placeholder,
      autoFocus,
      onUpdate: (next) => {
        onChangeRef.current(createRichTextContent(next.getJSON()));
        onContentFeatureStateChangeRef.current?.(getContentFeatureState(next));
      },
      onSelectionUpdate: (next) => {
        selectionRef.current = {
          from: next.state.selection.from,
          to: next.state.selection.to,
        };
        onContentFeatureStateChangeRef.current?.(getContentFeatureState(next));
      },
      onFocus: () => {
        onFocusRef.current?.();
      },
      onBlur: () => {
        onBlurRef.current?.();
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          if (onKeyDownRef.current?.(event)) {
            return true;
          }
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

          // In an enter-to-send composer, Shift+Enter is the newline action.
          // Create a real paragraph block instead of a hardBreak so block
          // formatting such as Alignment can target each visual line.
          if (event.shiftKey) {
            event.preventDefault();
            return splitBlock(view.state, view.dispatch);
          }

          return false;
        },
      },
    });
    const activeSecretEditor = useSecretRuntime(
      (state) => state.activeNestedEditor,
    );
    const contentEditor =
      activeSecretEditor?.parentEditor === editor
        ? activeSecretEditor.editor
        : editor;
    const resolveContentState = () => {
      if (!contentEditor || contentEditor.isDestroyed) return {};
      const state = getContentFeatureState(contentEditor);
      if (activeSecretEditor?.parentEditor === editor)
        state.secret = { enabled: true, active: true };
      return state;
    };

    useEffect(() => {
      if (!contentEditor || contentEditor.isDestroyed) return;
      onContentFeatureStateChangeRef.current?.(resolveContentState());
      if (contentEditor !== editor) {
        setTagSuggestion({
          ...getContentEntitySuggestionState(contentEditor.state),
        });
        const nextLinkEditor = getContentLinkEditorState(contentEditor.state);
        setLinkEditor({ ...nextLinkEditor });
        const nextContactEditor = getContentContactEditorState(
          contentEditor.state,
        );
        setContactEditor({ ...nextContactEditor });
        onContentContactEditorOpenChangeRef.current?.(
          nextContactEditor.open ? nextContactEditor.kind : null,
        );
        onContentLinkEditorOpenChangeRef.current?.(nextLinkEditor.open);
      }
    }, [activeSecretEditor, contentEditor]);

    const editorRef = useLatestRef(editor);

    useEffect(() => {
      if (editor && !editor.isDestroyed) {
        onContentFeatureStateChangeRef.current?.(
          getContentFeatureState(editor),
        );
      }
    }, [editor]);

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

    useEffect(() => {
      if (!editor) return;
      const syncSuggestion = () => {
        onContentFeatureStateChangeRef.current?.(
          getContentFeatureState(editor),
        );
        setTagSuggestion({ ...getContentEntitySuggestionState(editor.state) });
        const nextLinkEditor = getContentLinkEditorState(editor.state);
        setLinkEditor({ ...nextLinkEditor });
        const nextContactEditor = getContentContactEditorState(editor.state);
        setContactEditor({ ...nextContactEditor });
        onContentContactEditorOpenChangeRef.current?.(
          nextContactEditor.open ? nextContactEditor.kind : null,
        );
        onContentLinkEditorOpenChangeRef.current?.(nextLinkEditor.open);
      };
      syncSuggestion();
      editor.on('transaction', syncSuggestion);
      return () => {
        editor.off('transaction', syncSuggestion);
      };
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        focus: (position) => {
          editor?.commands.focus(position);
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
        runContentFeature: (id, invocation) => {
          if (!editor || editor.isDestroyed || !contentEditor) {
            return false;
          }

          if (id === 'secret' && activeSecretEditor?.parentEditor === editor) {
            let secretPosition: number | null = null;
            editor.state.doc.descendants((node, pos) => {
              if (
                secretPosition === null &&
                node.type.name.startsWith('secretContent') &&
                node.attrs.secretId === activeSecretEditor.secretId
              ) {
                secretPosition = pos;
                return false;
              }
            });
            if (secretPosition === null) return false;
            editor.view.dispatch(
              editor.state.tr.setSelection(
                NodeSelection.create(editor.state.doc, secretPosition),
              ),
            );
            const applied = runContentFeature(editor, id, invocation);
            onContentFeatureStateChangeRef.current?.(
              getContentFeatureState(editor),
            );
            return applied;
          }

          const selection = selectionRef.current;
          if (contentEditor === editor && selection && !editor.isFocused) {
            editor.commands.setTextSelection(selection);
          }

          if (id === 'link') contentEditor.commands.closeContentContactEditor();
          if (id === 'phone' || id === 'email')
            contentEditor.commands.closeContentLinkEditor();

          const applied = runContentFeature(contentEditor, id, invocation);
          if (contentEditor === editor) saveSelection();
          onContentFeatureStateChangeRef.current?.(resolveContentState());
          return applied;
        },
        getContentFeatureState: () => resolveContentState(),
        setContentLinkPreviewEnabled: (url, enabled) =>
          editor && !editor.isDestroyed
            ? editor.commands.setContentLinkPreviewEnabled(url, enabled)
            : false,
        finalizeContentEntities: () => {
          if (!editor || editor.isDestroyed) return value;
          editor.commands.finalizeContentEntities();
          return createRichTextContent(editor.getJSON());
        },
      }),
      [contentEditor, editor],
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
        onClick={(event) => {
          const anchor =
            event.target instanceof Element
              ? event.target.closest('a[href]')
              : null;
          if (!anchor || !contentEditor?.isEditable) return;
          if (event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          if (
            anchor.hasAttribute('data-content-phone') ||
            anchor.hasAttribute('data-content-email')
          )
            return;
          contentEditor.commands.openContentLinkEditor();
        }}
      >
        <EditorContent editor={editor} />
        {contentEditor && tagSuggestion.open ? (
          <ContentTagSuggestion editor={contentEditor} state={tagSuggestion} />
        ) : null}
        {contentEditor && linkEditor.open && contentInspectorTarget !== null ? (
          <ContentLinkEditor
            key={linkEditor.from}
            editor={contentEditor}
            state={linkEditor}
            inspectorTarget={contentInspectorTarget}
          />
        ) : null}
        {contentEditor && contactEditor.open ? (
          <ContentContactEditor
            key={`${contactEditor.kind}:${contactEditor.from}`}
            editor={contentEditor}
            state={contactEditor}
          />
        ) : null}
      </div>
    );
  },
);

AdRichText.displayName = 'AdRichText';

export default AdRichText;
