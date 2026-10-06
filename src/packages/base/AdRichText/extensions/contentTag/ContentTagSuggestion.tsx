import type { Editor } from '@tiptap/core';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
} from 'react';

import { DEFAULT_COLOR_ID } from '@/packages/color/presets';

import type { ContentEntitySuggestionState } from './ContentTagExtension';

import ContentTagChip from './ContentTagChip';
import {
  useContentTagRuntime,
  type ContentReferenceRecord,
} from './ContentTagRuntime';
import styles from './ContentTagSuggestion.module.css';

type Item = ContentReferenceRecord & { targetType: 'chatbox' | 'message' };
export type ContentTagSuggestionProps = {
  editor: Editor;
  state: ContentEntitySuggestionState;
};

const ContentTagSuggestion: FC<ContentTagSuggestionProps> = ({
  editor,
  state,
}) => {
  const { tags, createTag, resolveTagStyle, references } =
    useContentTagRuntime();
  const [activeIndex, setActiveIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const query = state.query.trim();
  const normalized = query.toLocaleLowerCase();
  const tagMatches = useMemo(
    () =>
      Object.values(tags)
        .filter((tag) => tag.label.toLocaleLowerCase().includes(normalized))
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, 8),
    [normalized, tags],
  );
  const groups = useMemo(() => {
    const matches = (record: ContentReferenceRecord) =>
      `${record.label} ${record.context ?? ''} ${record.description ?? ''}`
        .toLocaleLowerCase()
        .includes(normalized);
    return [
      {
        label: 'Chatboxes',
        items: Object.values(references.chatbox)
          .filter(matches)
          .sort((a, b) => a.label.localeCompare(b.label))
          .slice(0, 6)
          .map((item): Item => ({ ...item, targetType: 'chatbox' })),
      },
      {
        label: 'Messages',
        items: Object.values(references.message)
          .filter(matches)
          .slice(0, 8)
          .map((item): Item => ({ ...item, targetType: 'message' })),
      },
    ].filter((group) => group.items.length);
  }, [normalized, references]);
  const referenceItems = groups.flatMap((group) => group.items);
  const exactMatch = Object.values(tags).some(
    (tag) => tag.label.toLocaleLowerCase() === normalized,
  );
  const canCreate = state.kind === 'tag' && Boolean(query) && !exactMatch;
  const itemCount =
    state.kind === 'tag'
      ? tagMatches.length + (canCreate ? 1 : 0)
      : referenceItems.length;
  useEffect(() => {
    setActiveIndex(0);
    setError('');
  }, [query, state.kind]);

  const selectIndex = async (index: number) => {
    if (creating) return;
    if (state.kind === 'reference') {
      const item = referenceItems[index];
      if (item)
        editor.commands.insertContentReference({
          targetType: item.targetType,
          targetId: item.id,
          fallbackLabel: item.label,
          fallbackChatboxId: item.chatboxId,
        });
      return;
    }
    const tag = tagMatches[index];
    if (tag) {
      editor.commands.insertContentTag({
        tagId: tag.id,
        label: tag.label,
        colorId: tag.colorId,
      });
      return;
    }
    if (!canCreate || index !== tagMatches.length) return;
    setCreating(true);
    setError('');
    try {
      const id = await createTag({ label: query, colorId: DEFAULT_COLOR_ID });
      editor.commands.insertContentTag({
        tagId: id,
        label: query,
        colorId: DEFAULT_COLOR_ID,
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not create tag',
      );
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!state.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        editor.commands.closeContentEntityPicker();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        if (itemCount)
          setActiveIndex(
            (value) =>
              (value + (event.key === 'ArrowDown' ? 1 : -1) + itemCount) %
              itemCount,
          );
        return;
      }
      if (event.key === 'Enter' && itemCount) {
        event.preventDefault();
        event.stopPropagation();
        void selectIndex(activeIndex);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  if (!state.open) return null;
  const caretRect = editor.view.coordsAtPos(state.from);
  const style: CSSProperties = {
    left: Math.max(8, caretRect.left),
    top: Math.max(8, caretRect.top - 6),
  };
  let flatIndex = 0;
  return (
    <div
      className={styles.popup}
      style={style}
      role="listbox"
      aria-label={state.kind === 'tag' ? 'Tags' : 'References'}
    >
      {state.kind === 'tag'
        ? tagMatches.map((tag, index) => (
            <button
              key={tag.id}
              type="button"
              className={styles.option}
              data-active={activeIndex === index || undefined}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => void selectIndex(index)}
            >
              <ContentTagChip
                label={tag.label}
                style={resolveTagStyle(tag.colorId)}
              />
            </button>
          ))
        : groups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => {
                const index = flatIndex++;
                return (
                  <button
                    key={`${item.targetType}:${item.id}`}
                    type="button"
                    className={styles.option}
                    data-active={activeIndex === index || undefined}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void selectIndex(index)}
                  >
                    <span className={styles.referenceText}>
                      <strong>@{item.label}</strong>
                      {item.context ? <small>{item.context}</small> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
      {canCreate ? (
        <button
          type="button"
          className={styles.create}
          data-active={activeIndex === tagMatches.length || undefined}
          role="option"
          aria-selected={activeIndex === tagMatches.length}
          disabled={creating}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(tagMatches.length)}
          onClick={() => void selectIndex(tagMatches.length)}
        >
          {creating ? 'Creating…' : `Create #${query}`}
        </button>
      ) : null}
      {itemCount === 0 ? (
        <span className={styles.empty}>
          {state.kind === 'tag'
            ? 'Type to find or create a tag'
            : 'No matching references'}
        </span>
      ) : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
};
export default ContentTagSuggestion;
