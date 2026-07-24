import { faCheck, faPen, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Combobox, useCombobox } from '@mantine/core';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

import type { ColorId } from '@/packages/color';
import type { Tag } from '@/store/diary/type';

import { AdChip, AdIcon, AdInput } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import { useDiaryStore } from '@/store';

import PalettePicker from '../PalettePicker/PalettePicker';
import styles from './TagSelect.module.css';

const TAG_SHADES: Array<'strong' | 'soft'> = ['strong', 'soft'];

export type TagSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  /** Force PalettePicker create panel stacked (browse-first). */
  stackedPalette?: boolean;
  /** Render dropdown in a portal (avoids clipping inside modals). */
  withinPortal?: boolean;
};

type EditDraft = {
  label: string;
  colorId: ColorId;
};

const stopRow = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const isEditableFieldTarget = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest('input, textarea'));

/** Keep combobox open without blocking text selection in inputs. */
const handleFormRowMouseDown = (event: MouseEvent) => {
  event.stopPropagation();
  if (!isEditableFieldTarget(event.target)) {
    event.preventDefault();
  }
};

const isInsideTagSelectUi = (node: Element | null) =>
  Boolean(
    node?.closest('[data-tag-select-root]') ||
      node?.closest('.mantine-Combobox-dropdown') ||
      node?.closest('.mantine-Popover-dropdown'),
  );

const TagSelect: FC<TagSelectProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Search or create tags...',
  emptyLabel = 'No tags found',
  disabled,
  stackedPalette = false,
  withinPortal = false,
}) => {
  const tags = useDiaryStore('tags');
  const createTag = useDiaryStore('createTag');
  const updateTag = useDiaryStore('updateTag');

  const [searchValue, setSearchValue] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [createColorId, setCreateColorId] = useState<ColorId>(DEFAULT_COLOR_ID);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editPaletteOpen, setEditPaletteOpen] = useState(false);
  const [createPaletteOpen, setCreatePaletteOpen] = useState(false);
  const suppressCreateClickRef = useRef(false);

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearchValue('');
      setEditingTagId(null);
      setEditDraft(null);
      setEditError(null);
      setCreateError(null);
      setEditPaletteOpen(false);
      setCreatePaletteOpen(false);
    },
  });

  const trimmedSearch = searchValue.trim();

  const closeIfFocusLeft = useCallback(() => {
    window.setTimeout(() => {
      if (isInsideTagSelectUi(document.activeElement)) {
        return;
      }

      combobox.closeDropdown();
    }, 0);
  }, [combobox]);

  const tagList = useMemo(() => Object.values(tags) as Tag[], [tags]);

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const tag of tagList) {
      map.set(tag.id, tag);
    }
    return map;
  }, [tagList]);

  const filteredTags = useMemo(() => {
    const normalized = trimmedSearch.toLowerCase();

    return tagList.filter((tag) => {
      if (value.includes(tag.id)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return tag.label.toLowerCase().includes(normalized);
    });
  }, [tagList, trimmedSearch, value]);

  const hasExactLabelMatch = useMemo(() => {
    if (!trimmedSearch) {
      return false;
    }

    const normalized = trimmedSearch.toLowerCase();
    return tagList.some((tag) => tag.label.toLowerCase() === normalized);
  }, [tagList, trimmedSearch]);

  const shouldShowCreate = Boolean(trimmedSearch) && !hasExactLabelMatch;

  useEffect(() => {
    if (!shouldShowCreate) {
      setCreateError(null);
    }
  }, [shouldShowCreate]);

  useEffect(() => {
    if (!combobox.dropdownOpened) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (isInsideTagSelectUi(target)) {
        return;
      }

      combobox.closeDropdown();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [combobox, combobox.dropdownOpened]);

  const isDuplicateLabel = useCallback(
    (nextLabel: string, excludeTagId?: string) => {
      const normalized = nextLabel.trim().toLowerCase();
      if (!normalized) {
        return false;
      }

      return tagList.some(
        (tag) =>
          tag.id !== excludeTagId && tag.label.toLowerCase() === normalized,
      );
    },
    [tagList],
  );

  const handleSelect = useCallback(
    (tagId: string) => {
      if (editingTagId) {
        return;
      }

      if (!value.includes(tagId)) {
        onChange([...value, tagId]);
      }

      setSearchValue('');
    },
    [editingTagId, onChange, value],
  );

  const handleRemove = useCallback(
    (tagId: string) => {
      onChange(value.filter((id) => id !== tagId));
    },
    [onChange, value],
  );

  const startEdit = useCallback(
    (event: MouseEvent, tag: Tag) => {
      stopRow(event);
      setEditingTagId(tag.id);
      setEditDraft({ label: tag.label, colorId: tag.colorId });
      setEditError(null);
      setCreateError(null);
      combobox.openDropdown();
    },
    [combobox],
  );

  const cancelEdit = useCallback((event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    setEditingTagId(null);
    setEditDraft(null);
    setEditError(null);
    setEditPaletteOpen(false);
  }, []);

  const exitEditOnMainFocus = useCallback(() => {
    combobox.openDropdown();
    setEditingTagId(null);
    setEditDraft(null);
    setEditError(null);
    setEditPaletteOpen(false);
  }, [combobox]);

  const saveEdit = useCallback(
    (event?: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

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
      setEditingTagId(null);
      setEditDraft(null);
      setEditError(null);
      setEditPaletteOpen(false);
    },
    [editDraft, editingTagId, isDuplicateLabel, updateTag],
  );

  const saveCreate = useCallback(
    (event?: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      if (suppressCreateClickRef.current) {
        return;
      }

      if (!trimmedSearch) {
        return;
      }

      if (isDuplicateLabel(trimmedSearch)) {
        setCreateError('A tag with this name already exists');
        return;
      }

      const id = createTag({
        label: trimmedSearch,
        colorId: createColorId,
      });
      onChange([...value, id]);
      setSearchValue('');
      setCreateColorId(DEFAULT_COLOR_ID);
      setCreateError(null);
      setCreatePaletteOpen(false);
    },
    [
      createColorId,
      createTag,
      isDuplicateLabel,
      onChange,
      trimmedSearch,
      value,
    ],
  );

  const armCreateClickSuppression = useCallback(() => {
    suppressCreateClickRef.current = true;
    window.setTimeout(() => {
      suppressCreateClickRef.current = false;
    }, 400);
  }, []);

  const handleCreatePaletteOpenChange = useCallback((opened: boolean) => {
    setCreatePaletteOpen(opened);
  }, []);

  const handleCreateColorChange = useCallback(
    (colorId: ColorId) => {
      // Portaled palette click can fall through onto the create controls.
      armCreateClickSuppression();
      setCreateColorId(colorId);
    },
    [armCreateClickSuppression],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && !searchValue && value.length > 0) {
        onChange(value.slice(0, -1));
        return;
      }

      if (event.key === 'Enter' && shouldShowCreate && !editingTagId) {
        event.preventDefault();
        saveCreate();
      }
    },
    [
      editingTagId,
      onChange,
      saveCreate,
      searchValue,
      shouldShowCreate,
      value,
    ],
  );

  const handleEditInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveEdit();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, saveEdit],
  );

  const closeEditPaletteUnlessPicker = useCallback((event: MouseEvent) => {
    handleFormRowMouseDown(event);
    const target = event.target;
    if (target instanceof Element && target.closest('[data-palette-picker]')) {
      return;
    }
    setEditPaletteOpen(false);
  }, []);

  // Keep combobox from treating create-row presses as outside clicks.
  // Do not preventDefault — that cancels the button click that adds the tag.
  const handleCreateRowMouseDown = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const showEmpty =
    filteredTags.length === 0 && !shouldShowCreate && trimmedSearch.length > 0;

  const emptyMessage = hasExactLabelMatch ? 'Already selected' : emptyLabel;

  return (
    <div className={styles.root} data-tag-select-root>
      {label ? <span className={styles.label}>{label}</span> : null}
      <Combobox
        store={combobox}
        withinPortal={withinPortal}
        offset={4}
        disabled={disabled}
      >
        <Combobox.DropdownTarget>
          <div
            className={styles.control}
            onClick={() => combobox.openDropdown()}
            onKeyDown={() => undefined}
            role="presentation"
          >
            <div className={styles.pillsRow}>
              {value.map((tagId) => {
                const tag = tagsById.get(tagId);
                if (!tag) {
                  return null;
                }

                return (
                  <span key={tagId} className={styles.pillWrap}>
                    <AdChip
                      label={tag.label}
                      colorId={tag.colorId}
                      size="medium"
                      onRemove={
                        disabled ? undefined : () => handleRemove(tagId)
                      }
                    />
                  </span>
                );
              })}
              <Combobox.EventsTarget>
                <input
                  className={styles.multiInput}
                  value={searchValue}
                  onChange={(event) => {
                    combobox.openDropdown();
                    setSearchValue(event.currentTarget.value);
                    setCreateError(null);
                  }}
                  onFocus={exitEditOnMainFocus}
                  onBlur={closeIfFocusLeft}
                  onKeyDown={handleKeyDown}
                  placeholder={value.length === 0 ? placeholder : undefined}
                  disabled={disabled}
                  aria-autocomplete="list"
                />
              </Combobox.EventsTarget>
            </div>
          </div>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown className={styles.dropdown}>
          <div className={styles.list}>
            {filteredTags.map((tag) => {
              if (editingTagId === tag.id && editDraft) {
                return (
                  <div key={tag.id}>
                    <div
                      className={styles.formRow}
                      onMouseDown={closeEditPaletteUnlessPicker}
                      role="presentation"
                    >
                      <div className={styles.pickerSlot}>
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
                          stacked={stackedPalette}
                          opened={editPaletteOpen}
                          onOpenChange={setEditPaletteOpen}
                          swatchSize={18}
                        />
                      </div>
                      <AdInput
                        className={clsx(
                          styles.labelInput,
                          editError && styles.labelInputInvalid,
                        )}
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
                        onKeyDown={handleEditInputKeyDown}
                        aria-label="Tag name"
                        autoFocus
                      />
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Save tag"
                          onMouseDown={stopRow}
                          onClick={saveEdit}
                        >
                          <AdIcon icon={faCheck} size={11} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Cancel editing"
                          onMouseDown={stopRow}
                          onClick={cancelEdit}
                        >
                          <AdIcon icon={faXmark} size={11} />
                        </button>
                      </div>
                    </div>
                    {editError ? (
                      <p className={styles.error}>{editError}</p>
                    ) : null}
                  </div>
                );
              }

              return (
                <div
                  key={tag.id}
                  className={styles.row}
                  role="option"
                  tabIndex={0}
                  aria-selected={false}
                  onClick={() => handleSelect(tag.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect(tag.id);
                    }
                  }}
                >
                  <span className={styles.rowChip}>
                    <AdChip
                      label={tag.label}
                      colorId={tag.colorId}
                      size="large"
                    />
                  </span>
                  <span className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Edit ${tag.label}`}
                      onMouseDown={stopRow}
                      onClick={(event) => startEdit(event, tag)}
                    >
                      <AdIcon icon={faPen} size={11} />
                    </button>
                  </span>
                </div>
              );
            })}

            {shouldShowCreate ? (
              <div>
                <div
                  className={clsx(styles.formRow, styles.createRow)}
                  onMouseDown={handleCreateRowMouseDown}
                >
                  <div
                    className={styles.pickerSlot}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <PalettePicker
                      value={createColorId}
                      onChange={handleCreateColorChange}
                      label=""
                      variant="compact"
                      shades={TAG_SHADES}
                      offset={8}
                      stacked={stackedPalette}
                      opened={createPaletteOpen}
                      onOpenChange={handleCreatePaletteOpenChange}
                      swatchSize={18}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.createHit}
                    aria-label={`Create tag ${trimmedSearch}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      saveCreate(event);
                    }}
                  >
                    <AdChip
                      label={trimmedSearch}
                      colorId={createColorId}
                      size="large"
                    />
                  </button>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Create tag"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveCreate(event);
                      }}
                    >
                      <AdIcon icon={faPlus} size={11} />
                    </button>
                  </div>
                </div>
                {createError ? (
                  <p className={styles.error}>{createError}</p>
                ) : null}
              </div>
            ) : null}

            {showEmpty ? (
              <div className={styles.empty}>{emptyMessage}</div>
            ) : null}
          </div>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
};

export default TagSelect;
