import {
  EditorContent,
  NodeViewWrapper,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react';
import { Check, Copy, Eye, EyeClosed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { countGraphemes, serializeVisibleJson } from './contentSecret.utils';
import styles from './SecretNodeView.module.css';
import {
  setActiveSecretEditor,
  setSecretHydration,
  useSecretRuntime,
} from './secretRuntime';

const MASK_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const maskFor = (seed: string, length: number) => {
  if (!length) return '';
  let state = 2166136261;
  for (const char of seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return Array.from({ length }, (_, index) => {
    state = Math.imul(state ^ index, 16777619);
    return MASK_ALPHABET[Math.abs(state) % MASK_ALPHABET.length];
  }).join('');
};

const SecretNodeView = ({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) => {
  const secretId = String(node.attrs.secretId ?? '');
  const fragment = useSecretRuntime((state) => state.hydrations[secretId]);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const available = Boolean(fragment);
  const position = typeof getPos === 'function' ? getPos() : undefined;
  const parent =
    typeof position === 'number'
      ? editor.state.doc.resolve(position).parent
      : null;
  const copyOwnsWholeSecret = Boolean(
    parent?.type.name.startsWith('contentCopy') && parent.childCount === 1,
  );
  const mask = useMemo(
    () =>
      maskFor(
        String(node.attrs.ciphertext ?? secretId),
        Number(node.attrs.displayLength) || 0,
      ),
    [node.attrs.ciphertext, node.attrs.displayLength, secretId],
  );
  const nestedEditor = useEditor({
    // Reuse the non-flattened extension roots. Passing `extensions` here would
    // expand StarterKit a second time and register duplicate keyed plugins
    // such as `history$` in the nested editor.
    extensions: editor.extensionManager.baseExtensions,
    enableCoreExtensions: false,
    content: fragment ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: editor.isEditable && revealed,
    immediatelyRender: false,
    onUpdate: ({ editor: inner }) => {
      const next = inner.getJSON();
      setSecretHydration(secretId, next);
      updateAttributes({
        ciphertext: '',
        iv: '',
        authTag: null,
        displayLength: countGraphemes(serializeVisibleJson(next)),
      });
    },
    onFocus: ({ editor: inner }) => {
      setActiveSecretEditor({ editor: inner, parentEditor: editor, secretId });
    },
    onSelectionUpdate: ({ editor: inner }) => {
      if (useSecretRuntime.getState().activeNestedEditor?.editor === inner)
        setActiveSecretEditor({
          editor: inner,
          parentEditor: editor,
          secretId,
        });
    },
    onTransaction: ({ editor: inner }) => {
      if (useSecretRuntime.getState().activeNestedEditor?.editor === inner)
        setActiveSecretEditor({
          editor: inner,
          parentEditor: editor,
          secretId,
        });
    },
    onBlur: ({ editor: inner }) => {
      if (useSecretRuntime.getState().activeNestedEditor?.editor === inner)
        setActiveSecretEditor(null);
    },
  });

  useEffect(() => {
    nestedEditor?.setEditable(editor.isEditable && revealed);
    if (
      !revealed &&
      useSecretRuntime.getState().activeNestedEditor?.editor === nestedEditor
    )
      setActiveSecretEditor(null);
  }, [editor.isEditable, nestedEditor, revealed]);

  useEffect(() => {
    if (!nestedEditor || !fragment) return;
    if (JSON.stringify(nestedEditor.getJSON()) !== JSON.stringify(fragment))
      nestedEditor.commands.setContent(fragment, { emitUpdate: false });
  }, [fragment, nestedEditor]);

  useEffect(
    () => () => {
      if (
        useSecretRuntime.getState().activeNestedEditor?.editor === nestedEditor
      )
        setActiveSecretEditor(null);
    },
    [nestedEditor],
  );
  const copy = async () => {
    if (!fragment) return;
    try {
      await navigator.clipboard.writeText(serializeVisibleJson(fragment));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const title = available ? undefined : 'Secret content unavailable';
  return (
    <NodeViewWrapper
      as={node.type.name === 'secretContentBlock' ? 'div' : 'span'}
      className={`${styles.secret} ${selected ? styles.selected : ''}`}
      data-secret-content=""
      data-secret-block={node.type.name === 'secretContentBlock' || undefined}
    >
      <button
        type="button"
        className={styles.action}
        disabled={!available}
        title={title}
        aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
        contentEditable={false}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setRevealed((value) => !value)}
      >
        {revealed ? <Eye size={15} /> : <EyeClosed size={15} />}
      </button>
      <span className={styles.body}>
        {revealed && fragment && nestedEditor ? (
          <span className={styles.revealed} contentEditable={false}>
            <EditorContent editor={nestedEditor} />
          </span>
        ) : (
          <span className={styles.mask} aria-label="Hidden secret">
            {mask}
          </span>
        )}
      </span>
      {!copyOwnsWholeSecret && (
        <button
          type="button"
          className={styles.action}
          disabled={!available}
          title={title}
          aria-label={copied ? 'Copied' : 'Copy secret'}
          contentEditable={false}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void copy()}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      )}
    </NodeViewWrapper>
  );
};

export default SecretNodeView;
