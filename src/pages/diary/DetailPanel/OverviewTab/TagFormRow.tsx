import {
  useEffect,
  useState,
  type FC,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import type { ColorId } from '@/packages/color';

import { AdConfirmDialog, AdIcon, AdInput } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import PalettePicker from '@/packages/ui/PalettePicker/PalettePicker';
import { useDiaryStore } from '@/store';

import styles from './OverviewTab.module.css';

const TAG_SHADES: Array<'strong' | 'soft'> = ['strong', 'soft'];

export type TagFormRowProps =
  | {
      mode: 'create';
      onCreated: (tag: {
        tagId: string;
        label: string;
        colorId: ColorId;
      }) => void;
    }
  | {
      mode: 'edit';
      tagId: string;
      initialLabel: string;
      initialColorId: ColorId;
      onCancel: () => void;
      onSaved: () => void;
    };

const TagFormRow: FC<TagFormRowProps> = (props) => {
  const tags = useDiaryStore('tags');
  const createTag = useDiaryStore('createTag');
  const updateTag = useDiaryStore('updateTag');

  const isEdit = props.mode === 'edit';

  const [label, setLabel] = useState(isEdit ? props.initialLabel : '');
  const [colorId, setColorId] = useState<ColorId>(
    isEdit ? props.initialColorId : DEFAULT_COLOR_ID,
  );
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const editTagId = isEdit ? props.tagId : null;
  const editInitialLabel = isEdit ? props.initialLabel : '';
  const editInitialColorId = isEdit ? props.initialColorId : DEFAULT_COLOR_ID;

  useEffect(() => {
    if (!editTagId) {
      return;
    }

    setLabel(editInitialLabel);
    setColorId(editInitialColorId);
    setError(null);
    setPaletteOpen(false);
    setConfirmOpen(false);
    setPendingLabel(null);
  }, [editInitialColorId, editInitialLabel, editTagId]);

  const applyEdit = (nextLabel: string, nextColorId: ColorId) => {
    if (!isEdit) {
      return;
    }

    updateTag(props.tagId, {
      label: nextLabel,
      colorId: nextColorId,
    });
    setConfirmOpen(false);
    setPendingLabel(null);
    props.onSaved();
  };

  const submit = () => {
    const nextLabel = label.trim().replace(/^#/, '');

    if (!nextLabel) {
      setError('Name is required');
      return;
    }

    const excludeId = isEdit ? props.tagId : undefined;
    const duplicate = Object.values(tags).some(
      (tag) =>
        tag.id !== excludeId &&
        tag.label.trim().toLowerCase() === nextLabel.toLowerCase(),
    );

    if (duplicate) {
      setError('A tag with this name already exists');
      return;
    }

    if (isEdit) {
      const unchanged =
        nextLabel === props.initialLabel.trim() &&
        colorId === props.initialColorId;

      if (unchanged) {
        props.onSaved();
        return;
      }

      setPendingLabel(nextLabel);
      setConfirmOpen(true);
      return;
    }

    const tagId = createTag({
      label: nextLabel,
      colorId,
    });

    props.onCreated({
      tagId,
      label: nextLabel,
      colorId,
    });

    setLabel('');
    setColorId(DEFAULT_COLOR_ID);
    setError(null);
    setPaletteOpen(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }

    if (event.key === 'Escape' && isEdit) {
      event.preventDefault();
      props.onCancel();
    }
  };

  const confirmLabel = pendingLabel ?? label.trim().replace(/^#/, '');

  return (
    <li className={styles.tagRow}>
      <form className={styles.tagForm} onSubmit={handleSubmit}>
        <PalettePicker
          value={colorId}
          onChange={setColorId}
          label=""
          variant="compact"
          shades={TAG_SHADES}
          offset={8}
          stacked
          opened={paletteOpen}
          onOpenChange={setPaletteOpen}
          swatchSize={16}
        />
        <AdInput
          className={styles.tagFormInput}
          value={label}
          onChange={(event) => {
            setError(null);
            setLabel(event.currentTarget.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isEdit ? 'Tag name' : 'New tag'}
          aria-label={isEdit ? 'Edit tag name' : 'New tag name'}
          autoFocus={isEdit}
        />
        {isEdit ? (
          <div className={styles.tagActions}>
            <button
              type="submit"
              className={styles.tagActionBtn}
              aria-label="Save tag"
            >
              <AdIcon icon="Check" source="lucide" size={13} strokeWidth={2} />
            </button>
            <button
              type="button"
              className={styles.tagActionBtn}
              aria-label="Cancel editing"
              onClick={props.onCancel}
            >
              <AdIcon icon="X" source="lucide" size={13} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className={styles.tagActionBtn}
            aria-label="Create tag"
          >
            <AdIcon icon="Plus" source="lucide" size={13} strokeWidth={2} />
          </button>
        )}
      </form>
      {error ? <p className={styles.tagFormError}>{error}</p> : null}

      {isEdit ? (
        <AdConfirmDialog
          opened={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setPendingLabel(null);
            props.onCancel();
          }}
          onConfirm={() => applyEdit(confirmLabel, colorId)}
          title="Edit tag everywhere?"
          message={`Changes to “#${confirmLabel}” will update this tag across the whole app — every chat and message that uses it.`}
          confirmLabel="Save changes"
        />
      ) : null}
    </li>
  );
};

export default TagFormRow;
