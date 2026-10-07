import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type FC,
} from 'react';

import type { EnterKeyBehavior } from '@/store/settings/type';

import {
  AdIcon,
  AdRichText,
  type AdRichTextHandle,
  type ContentFeatureState,
} from '@/packages/base';

import type { DraftColumnItem } from '../../input/composer.types';

import LinkContentPreviews from '../../../LinkPreview/LinkContentPreviews';
import styles from './ColumnEditor.module.css';

export type ColumnEditorHandle = {
  insertAtLatestInput: (value: string) => void;
  finalizeItems: () => DraftColumnItem[];
};

export type ColumnEditorProps = {
  items: DraftColumnItem[];
  onUpdateItem: (id: string, patch: Partial<DraftColumnItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => string;
  onReorderItem: (current: number, previous: number) => void;
  onSubmit?: () => void;
  enterKeyBehavior?: EnterKeyBehavior;
  onFocus?: () => void;
  onBlur?: () => void;
  onActiveEditorChange: (
    id: string | null,
    editor: AdRichTextHandle | null,
  ) => void;
  onContentFeatureStateChange?: (state: ContentFeatureState) => void;
  onContentLinkEditorOpenChange?: (open: boolean) => void;
  contentInspectorTarget?: HTMLElement | null;
  onContentContactEditorOpenChange?: (
    feature: 'phone' | 'email' | null,
  ) => void;
};

type ColumnItemProps = Omit<ColumnEditorProps, 'items' | 'onAddItem'> & {
  item: DraftColumnItem;
  canRemove: boolean;
  registerEditor: (id: string, editor: AdRichTextHandle | null) => void;
};

const ColumnItem: FC<ColumnItemProps> = memo((props) => {
  const {
    item,
    canRemove,
    onUpdateItem,
    onRemoveItem,
    onSubmit,
    enterKeyBehavior = 'enter-sends',
    onFocus,
    onBlur,
    onActiveEditorChange,
    onContentFeatureStateChange,
    onContentLinkEditorOpenChange,
    contentInspectorTarget,
    onContentContactEditorOpenChange,
    registerEditor,
  } = props;
  const editorRef = useRef<AdRichTextHandle | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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

  const removeButton = (
    <button
      type="button"
      className={styles.removeButton}
      aria-label="Remove column"
      disabled={!canRemove}
      onClick={() => canRemove && onRemoveItem(item.id)}
    >
      <AdIcon icon={faXmark} size={11} />
    </button>
  );

  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      data-column-id={item.id}
      data-dragging={isDragging || undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <span className={styles.grabDots} aria-hidden="true" />
      </button>
      {removeButton}
      <div
        className={styles.editor}
        onFocus={() => {
          onActiveEditorChange(item.id, editorRef.current);
          onFocus?.();
        }}
        onBlur={onBlur}
      >
        <AdRichText
          ref={setEditorRef}
          value={item.content}
          placeholder="Write in this column..."
          grow
          onChange={(content) => onUpdateItem(item.id, { content })}
          onFocus={() => onActiveEditorChange(item.id, editorRef.current)}
          onContentFeatureStateChange={onContentFeatureStateChange}
          onContentLinkEditorOpenChange={onContentLinkEditorOpenChange}
          contentInspectorTarget={contentInspectorTarget}
          onContentContactEditorOpenChange={onContentContactEditorOpenChange}
          onSubmit={onSubmit}
          enterSubmits={enterKeyBehavior === 'enter-sends'}
        />
        <LinkContentPreviews
          content={item.content}
          composer
          attached
          onDisablePreview={(url) =>
            editorRef.current?.setContentLinkPreviewEnabled(url, false)
          }
        />
      </div>
    </section>
  );
});

ColumnItem.displayName = 'ColumnItem';

const ColumnEditor = forwardRef<ColumnEditorHandle, ColumnEditorProps>(
  (props, ref) => {
    const { items, onAddItem, onReorderItem, onActiveEditorChange } = props;
    const editorRefs = useRef(new Map<string, AdRichTextHandle>());
    const activeIdRef = useRef<string | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );

    const registerEditor = useCallback(
      (id: string, editor: AdRichTextHandle | null) => {
        if (editor) editorRefs.current.set(id, editor);
        else editorRefs.current.delete(id);
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        insertAtLatestInput: (value) => {
          const id = activeIdRef.current ?? items[0]?.id;
          if (id) editorRefs.current.get(id)?.insertAtCursor(value);
        },
        finalizeItems: () =>
          items.map((item) => ({
            ...item,
            content:
              editorRefs.current.get(item.id)?.finalizeContentEntities() ??
              item.content,
          })),
      }),
      [items],
    );

    const handleActiveEditorChange = useCallback(
      (id: string | null, editor: AdRichTextHandle | null) => {
        activeIdRef.current = id;
        onActiveEditorChange(id, editor);
      },
      [onActiveEditorChange],
    );

    const handleDragEnd = useCallback(
      ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const previous = items.findIndex((item) => item.id === active.id);
        const current = items.findIndex((item) => item.id === over.id);
        if (previous >= 0 && current >= 0) onReorderItem(current, previous);
      },
      [items, onReorderItem],
    );

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className={styles.grid}>
            {items.map((item) => (
              <ColumnItem
                {...props}
                key={item.id}
                item={item}
                canRemove={items.length > 2}
                registerEditor={registerEditor}
                onActiveEditorChange={handleActiveEditorChange}
              />
            ))}
            <button
              type="button"
              className={styles.addCard}
              aria-label="Add column"
              onClick={() => {
                const id = onAddItem();
                requestAnimationFrame(() =>
                  editorRefs.current.get(id)?.focus('start'),
                );
              }}
            >
              <AdIcon icon={faPlus} size={22} />
            </button>
          </div>
        </SortableContext>
      </DndContext>
    );
  },
);

ColumnEditor.displayName = 'ColumnEditor';

export default ColumnEditor;
