import {
  faCheck,
  faPen,
  faPlus,
  faTags,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import type { ColorId } from '@/packages/color';
import type { Tag } from '@/store/diary/type';

import { AdChip, AdConfirmDialog, AdIcon, AdInput } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import PalettePicker from '@/packages/ui/PalettePicker/PalettePicker';
import { useDiaryStore } from '@/store';
import { computeTagStatistics } from '@/store/diary/tag.utils';

import { ActionButton, SettingCard, SettingRow } from '../components';
import styles from './TagsSection.module.css';

const TAG_SHADES: Array<'strong' | 'soft'> = ['strong', 'soft'];

type EditDraft = {
  label: string;
  colorId: ColorId;
};

const TagsSection: FC = () => {
  const tags = useDiaryStore('tags');
  const messages = useDiaryStore('messages');
  const chatboxes = useDiaryStore('chatboxes');
  const createTag = useDiaryStore('createTag');
  const updateTag = useDiaryStore('updateTag');
  const deleteTag = useDiaryStore('deleteTag');

  const [createLabel, setCreateLabel] = useState('');
  const [createColorId, setCreateColorId] = useState<ColorId>(DEFAULT_COLOR_ID);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPaletteOpen, setCreatePaletteOpen] = useState(false);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPaletteOpen, setEditPaletteOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingTagId) {
      return;
    }

    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingTagId]);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const statistics = useMemo(
    () => computeTagStatistics(tags, messages, chatboxes),
    [tags, messages, chatboxes],
  );

  const tagList = useMemo(
    () =>
      Object.values(tags).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      ),
    [tags],
  );

  const pendingDeleteTag = pendingDeleteId
    ? (tags[pendingDeleteId] ?? null)
    : null;

  const isDuplicateLabel = (label: string, excludeId?: string) => {
    const normalized = label.trim().toLowerCase();

    return Object.values(tags).some(
      (tag) =>
        tag.id !== excludeId && tag.label.trim().toLowerCase() === normalized,
    );
  };

  const handleCreate = () => {
    const nextLabel = createLabel.trim();

    if (!nextLabel) {
      setCreateError('Name is required');
      return;
    }

    if (isDuplicateLabel(nextLabel)) {
      setCreateError('A tag with this name already exists');
      return;
    }

    createTag({
      label: nextLabel,
      colorId: createColorId,
    });
    setCreateLabel('');
    setCreateColorId(DEFAULT_COLOR_ID);
    setCreateError(null);
    setCreatePaletteOpen(false);
  };

  const startEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditDraft({
      label: tag.label,
      colorId: tag.colorId,
    });
    setEditError(null);
    setEditPaletteOpen(false);
  };

  const cancelEdit = () => {
    setEditingTagId(null);
    setEditDraft(null);
    setEditError(null);
    setEditPaletteOpen(false);
  };

  const saveEdit = () => {
    if (!editingTagId || !editDraft) {
      return;
    }

    const nextLabel = editDraft.label.trim();

    if (!nextLabel) {
      setEditError('Name is required');
      return;
    }

    if (isDuplicateLabel(nextLabel, editingTagId)) {
      setEditError('A tag with this name already exists');
      return;
    }

    updateTag(editingTagId, {
      label: nextLabel,
      colorId: editDraft.colorId,
    });
    cancelEdit();
  };

  return (
    <>
      <SettingCard
        id="manage"
        icon={faTags}
        title="Manage Tags"
        description="Create and manage tags used across your diary."
      >
        <SettingRow
          title="Create tag"
          description="Add a new tag to the global library."
          stacked
          control={
            <div className={styles.createRow}>
              <PalettePicker
                value={createColorId}
                onChange={setCreateColorId}
                label=""
                variant="compact"
                shades={TAG_SHADES}
                offset={8}
                stacked
                opened={createPaletteOpen}
                onOpenChange={setCreatePaletteOpen}
                swatchSize={18}
              />
              <AdInput
                value={createLabel}
                onChange={(event) => {
                  setCreateError(null);
                  setCreateLabel(event.currentTarget.value);
                }}
                placeholder="Tag name"
                aria-label="New tag name"
              />
              <ActionButton onClick={handleCreate}>
                <AdIcon icon={faPlus} size={12} />
                <span>Create</span>
              </ActionButton>
              {createError ? (
                <p className={styles.error}>{createError}</p>
              ) : null}
            </div>
          }
        />

        <div className={styles.tagList}>
          {tagList.length === 0 ? (
            <p className={styles.empty}>No tags yet. Create one above.</p>
          ) : (
            tagList.map((tag) => {
              const stats = statistics[tag.id];
              const chatCount = stats?.chatboxCount ?? 0;
              const messageCount = stats?.messageCount ?? 0;

              if (editingTagId === tag.id && editDraft) {
                return (
                  <div key={tag.id} className={styles.tagRow}>
                    <div className={styles.editRow}>
                      <PalettePicker
                        value={editDraft.colorId}
                        onChange={(colorId) =>
                          setEditDraft((current) =>
                            current ? { ...current, colorId } : current,
                          )
                        }
                        label=""
                        variant="compact"
                        shades={TAG_SHADES}
                        offset={8}
                        stacked
                        opened={editPaletteOpen}
                        onOpenChange={setEditPaletteOpen}
                        swatchSize={18}
                      />
                      <AdInput
                        ref={editInputRef}
                        value={editDraft.label}
                        onChange={(event) => {
                          const nextLabel = event.currentTarget.value;
                          setEditError(null);
                          setEditDraft((current) =>
                            current
                              ? { ...current, label: nextLabel }
                              : current,
                          );
                        }}
                        aria-label="Tag name"
                      />
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Save tag"
                        onClick={saveEdit}
                      >
                        <AdIcon icon={faCheck} size={12} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Cancel editing"
                        onClick={cancelEdit}
                      >
                        <AdIcon icon={faXmark} size={12} />
                      </button>
                    </div>
                    {editError ? (
                      <p className={styles.error}>{editError}</p>
                    ) : null}
                  </div>
                );
              }

              return (
                <div key={tag.id} className={styles.tagRow}>
                  <AdChip
                    label={tag.label}
                    colorId={tag.colorId}
                    size="large"
                  />
                  <span className={styles.stats}>
                    {chatCount} chat{chatCount === 1 ? '' : 's'} ·{' '}
                    {messageCount} message{messageCount === 1 ? '' : 's'}
                  </span>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Edit ${tag.label}`}
                      onClick={() => startEdit(tag)}
                    >
                      <AdIcon icon={faPen} size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Delete ${tag.label}`}
                      onClick={() => setPendingDeleteId(tag.id)}
                    >
                      <AdIcon icon={faTrash} size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SettingCard>

      <AdConfirmDialog
        opened={pendingDeleteTag !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteTag(pendingDeleteId);
          }

          setPendingDeleteId(null);
        }}
        title="Delete tag?"
        message={
          pendingDeleteTag
            ? `“#${pendingDeleteTag.label}” will be removed from every message in every chat. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
};

export default TagsSection;
