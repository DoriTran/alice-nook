import {
  faGripVertical,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type FocusEvent,
} from 'react';

import type { EnterKeyBehavior } from '@/store/settings/type';

import {
  AdCheckbox,
  AdDragDrop,
  AdIcon,
  AdRichText,
  isRichTextEmpty,
  type AdRichTextHandle,
  type ContentFeatureState,
} from '@/packages/base';

import type { DraftTodoItem } from '../../input/composer.types';

import LinkContentPreviews from '../../../LinkPreview/LinkContentPreviews';
import AttachmentCard from '../../attachment/AttachmentTray/AttachmentCard';
import styles from './TodoEditor.module.css';

const TODO_SORTABLE_GROUP = 'todo-composer-rows';

const findScrollParent = (start: HTMLElement | null): HTMLElement | null => {
  let node = start?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
};

export type TodoEditorProps = {
  items: DraftTodoItem[];
  onUpdateItem: (itemId: string, patch: Partial<DraftTodoItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onAddRow: () => string;
  onInsertRowAfter: (itemId: string) => string;
  onAddFiles: (itemId: string, files: FileList | File[]) => void;
  onRemoveAttachment: (itemId: string, attachmentId: string) => void;
  onReorderItem: (current: number, previous: number) => void;
  onSubmit?: () => void;
  enterKeyBehavior?: EnterKeyBehavior;
  onFocus?: () => void;
  onBlur?: () => void;
  onActiveEditorChange: (
    itemId: string | null,
    editor: AdRichTextHandle | null,
  ) => void;
  onContentFeatureStateChange?: (state: ContentFeatureState) => void;
  onContentLinkEditorOpenChange?: (open: boolean) => void;
  contentInspectorTarget?: HTMLElement | null;
  onContentContactEditorOpenChange?: (
    feature: 'phone' | 'email' | null,
  ) => void;
};

export type TodoEditorHandle = {
  insertAtLatestInput: (value: string) => void;
  addFilesAtLatestInput: (files: FileList | File[]) => void;
  finalizeItems: () => DraftTodoItem[];
};

type TodoRowProps = Omit<TodoEditorProps, 'items' | 'onAddRow'> & {
  item: DraftTodoItem;
  canRemove: boolean;
  previousItemId?: string;
  registerEditor: (itemId: string, editor: AdRichTextHandle | null) => void;
  focusItem: (itemId: string, position?: 'start' | 'end') => void;
};

const isCaretAtStart = (): boolean => {
  const selection = window.getSelection();
  return Boolean(selection?.isCollapsed && selection.anchorOffset === 0);
};

const TodoRow: FC<TodoRowProps> = memo((props) => {
  const {
    item,
    canRemove,
    previousItemId,
    enterKeyBehavior = 'shift-enter-sends',
    onUpdateItem,
    onRemoveItem,
    onInsertRowAfter,
    onAddFiles,
    onRemoveAttachment,
    onReorderItem,
    onSubmit,
    onFocus,
    onBlur,
    onActiveEditorChange,
    onContentFeatureStateChange,
    onContentLinkEditorOpenChange,
    contentInspectorTarget,
    onContentContactEditorOpenChange,
    registerEditor,
    focusItem,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AdRichTextHandle | null>(null);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [pickingFiles, setPickingFiles] = useState(false);
  const showAttachments =
    item.attachments.length > 0 || fieldFocused || pickingFiles;

  useEffect(() => {
    if (!pickingFiles) return;
    const handleWindowFocus = () =>
      window.setTimeout(() => setPickingFiles(false), 0);
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [pickingFiles]);

  useEffect(
    () => () => registerEditor(item.id, null),
    [item.id, registerEditor],
  );

  const setEditorRef = useCallback(
    (editor: AdRichTextHandle | null) => {
      editorRef.current = editor;
      registerEditor(item.id, editor);
    },
    [item.id, registerEditor],
  );

  const handleFieldBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setFieldFocused(false);
    onBlur?.();
  };

  return (
    <AdDragDrop
      draggable
      sortable
      itemOf={TODO_SORTABLE_GROUP}
      data={{ kind: 'todo-row', id: item.id }}
      onSortableChange={({ current, previous }) =>
        onReorderItem(current, previous)
      }
    >
      <div className={styles.row} data-test-id={item.id}>
        <span
          className={styles.dragHandle}
          aria-label="Drag to reorder"
          data-handle
        >
          <AdIcon icon={faGripVertical} size={16} />
        </span>
        <AdCheckbox
          className={styles.checkbox}
          checked={item.completed}
          aria-label={
            item.content.preview
              ? `Mark ${item.content.preview} complete`
              : 'Mark todo complete'
          }
          onChange={() => onUpdateItem(item.id, { completed: !item.completed })}
        />
        <div
          className={styles.field}
          onFocus={() => {
            setFieldFocused(true);
            onActiveEditorChange(item.id, editorRef.current);
            onFocus?.();
          }}
          onBlur={handleFieldBlur}
        >
          <AdRichText
            ref={setEditorRef}
            value={item.content}
            placeholder="Todo item..."
            grow
            className={`${styles.input} ${item.completed ? styles.inputDone : ''}`}
            onChange={(content) => onUpdateItem(item.id, { content })}
            onFocus={() => onActiveEditorChange(item.id, editorRef.current)}
            onContentFeatureStateChange={onContentFeatureStateChange}
            onContentLinkEditorOpenChange={onContentLinkEditorOpenChange}
            contentInspectorTarget={contentInspectorTarget}
            onContentContactEditorOpenChange={onContentContactEditorOpenChange}
            onSubmit={onSubmit}
            enterSubmits={enterKeyBehavior === 'enter-sends'}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.altKey && !event.isComposing) {
                event.preventDefault();
                focusItem(onInsertRowAfter(item.id));
                return true;
              }
              if (
                event.key === 'Backspace' &&
                canRemove &&
                isRichTextEmpty(item.content) &&
                isCaretAtStart()
              ) {
                event.preventDefault();
                onRemoveItem(item.id);
                if (previousItemId) focusItem(previousItemId, 'end');
                return true;
              }
              return false;
            }}
          />
          <LinkContentPreviews
            content={item.content}
            composer
            attached
            onDisablePreview={(url) =>
              editorRef.current?.setContentLinkPreviewEnabled(url, false)
            }
          />
          {showAttachments ? (
            <div
              className={`${styles.rowAttachments}${item.completed ? ` ${styles.attachmentsDone}` : ''}`}
            >
              {item.attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  variant="tray"
                  hideName
                  dense
                  onRemove={() => onRemoveAttachment(item.id, attachment.id)}
                />
              ))}
              <button
                type="button"
                className={styles.addAttachmentBtn}
                aria-label="Upload file for row"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setPickingFiles(true);
                  fileInputRef.current?.click();
                }}
              >
                <AdIcon icon={faPlus} size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.hiddenInput}
                multiple
                onChange={(event) => {
                  if (event.target.files?.length) {
                    onAddFiles(item.id, event.target.files);
                    event.target.value = '';
                  }
                  setPickingFiles(false);
                }}
              />
            </div>
          ) : null}
        </div>
        {canRemove ? (
          <button
            type="button"
            className={styles.removeBtn}
            aria-label="Remove row"
            onClick={() => onRemoveItem(item.id)}
          >
            <AdIcon icon={faXmark} size={11} />
          </button>
        ) : null}
      </div>
    </AdDragDrop>
  );
});

TodoRow.displayName = 'TodoRow';

const TodoEditor = forwardRef<TodoEditorHandle, TodoEditorProps>(
  (props, ref) => {
    const {
      items,
      onUpdateItem,
      onRemoveItem,
      onAddRow,
      onInsertRowAfter,
      onAddFiles,
      onRemoveAttachment,
      onReorderItem,
      onSubmit,
      enterKeyBehavior,
      onFocus,
      onBlur,
      onActiveEditorChange,
      onContentFeatureStateChange,
      onContentLinkEditorOpenChange,
      contentInspectorTarget,
      onContentContactEditorOpenChange,
    } = props;
    const addRowBtnRef = useRef<HTMLButtonElement>(null);
    const shouldScrollToBottomRef = useRef(false);
    const editorRefs = useRef(new Map<string, AdRichTextHandle>());
    const latestFocusedItemIdRef = useRef<string | null>(null);

    const registerEditor = useCallback(
      (itemId: string, editor: AdRichTextHandle | null) => {
        if (editor) editorRefs.current.set(itemId, editor);
        else editorRefs.current.delete(itemId);
      },
      [],
    );
    const focusItem = useCallback(
      (itemId: string, position: 'start' | 'end' = 'start') => {
        latestFocusedItemIdRef.current = itemId;
        requestAnimationFrame(() =>
          editorRefs.current.get(itemId)?.focus(position),
        );
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        insertAtLatestInput: (value) => {
          const id = latestFocusedItemIdRef.current ?? items[0]?.id;
          if (id) editorRefs.current.get(id)?.insertAtCursor(value);
        },
        addFilesAtLatestInput: (files) => {
          const id = latestFocusedItemIdRef.current ?? items[0]?.id;
          if (id) onAddFiles(id, files);
        },
        finalizeItems: () =>
          items.map((item) => ({
            ...item,
            content:
              editorRefs.current.get(item.id)?.finalizeContentEntities() ??
              item.content,
          })),
      }),
      [items, onAddFiles],
    );

    useEffect(() => {
      const activeId = latestFocusedItemIdRef.current;
      if (activeId && !items.some((item) => item.id === activeId)) {
        latestFocusedItemIdRef.current = null;
        onActiveEditorChange(null, null);
      }
    }, [items, onActiveEditorChange]);

    const handleActiveEditorChange = useCallback(
      (itemId: string | null, editor: AdRichTextHandle | null) => {
        latestFocusedItemIdRef.current = itemId;
        onActiveEditorChange(itemId, editor);
      },
      [onActiveEditorChange],
    );

    useLayoutEffect(() => {
      if (!shouldScrollToBottomRef.current) return;
      shouldScrollToBottomRef.current = false;
      const scrollParent = findScrollParent(addRowBtnRef.current);
      if (!scrollParent) return;
      const pinBottom = () => {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      };
      pinBottom();
      requestAnimationFrame(pinBottom);
    }, [items.length]);

    return (
      <AdDragDrop
        droppable
        sortable
        group={TODO_SORTABLE_GROUP}
        hostPreview
        dropData={{ id: TODO_SORTABLE_GROUP }}
        onSortableChange={({ current, previous }) =>
          onReorderItem(current, previous)
        }
      >
        <div className={styles.root}>
          <div className={styles.list}>
            {items.map((item, index) => (
              <TodoRow
                key={item.id}
                item={item}
                canRemove={items.length > 1}
                previousItemId={items[index - 1]?.id}
                enterKeyBehavior={enterKeyBehavior}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
                onInsertRowAfter={onInsertRowAfter}
                onAddFiles={onAddFiles}
                onRemoveAttachment={onRemoveAttachment}
                onReorderItem={onReorderItem}
                onSubmit={onSubmit}
                onFocus={onFocus}
                onBlur={onBlur}
                onActiveEditorChange={handleActiveEditorChange}
                onContentFeatureStateChange={onContentFeatureStateChange}
                onContentLinkEditorOpenChange={onContentLinkEditorOpenChange}
                contentInspectorTarget={contentInspectorTarget}
                onContentContactEditorOpenChange={
                  onContentContactEditorOpenChange
                }
                registerEditor={registerEditor}
                focusItem={focusItem}
              />
            ))}
          </div>
          <button
            ref={addRowBtnRef}
            type="button"
            className={styles.addRowBtn}
            onClick={() => {
              shouldScrollToBottomRef.current = true;
              focusItem(onAddRow());
            }}
          >
            <span className={styles.addRowIcon} aria-hidden>
              <AdIcon icon={faPlus} size={10} />
            </span>
            Add new row
          </button>
        </div>
      </AdDragDrop>
    );
  },
);

TodoEditor.displayName = 'TodoEditor';
export default TodoEditor;
