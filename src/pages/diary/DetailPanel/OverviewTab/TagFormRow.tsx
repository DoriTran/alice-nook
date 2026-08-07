import {
  useEffect,
  useRef,
  useState,
  type FC,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import type { ColorId } from '@/packages/color';

import { AdIcon, AdInput } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import PalettePicker from '@/packages/ui/PalettePicker/PalettePicker';
import { useDiaryStore } from '@/store';

import styles from './OverviewTab.module.css';

const TAG_SHADES: Array<'strong' | 'soft'> = ['strong', 'soft'];

export type TagFormRowProps = {
  onCreated: (tag: { tagId: string; label: string; colorId: ColorId }) => void;
};

const TagFormRow: FC<TagFormRowProps> = ({ onCreated }) => {
  const tags = useDiaryStore('tags');
  const createTag = useDiaryStore('createTag');

  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState('');
  const [colorId, setColorId] = useState<ColorId>(DEFAULT_COLOR_ID);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    labelInputRef.current?.focus();
  }, [expanded]);

  const reset = () => {
    setLabel('');
    setColorId(DEFAULT_COLOR_ID);
    setError(null);
    setPaletteOpen(false);
    setExpanded(false);
  };

  const submit = () => {
    const nextLabel = label.trim().replace(/^#/, '');

    if (!nextLabel) {
      setError('Name is required');
      return;
    }

    const duplicate = Object.values(tags).some(
      (tag) => tag.label.trim().toLowerCase() === nextLabel.toLowerCase(),
    );

    if (duplicate) {
      setError('A tag with this name already exists');
      return;
    }

    const tagId = createTag({
      label: nextLabel,
      colorId,
    });

    onCreated({
      tagId,
      label: nextLabel,
      colorId,
    });

    reset();
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

    if (event.key === 'Escape') {
      event.preventDefault();
      reset();
    }
  };

  if (!expanded) {
    return (
      <li className={styles.tagFormItem}>
        <button
          type="button"
          className={styles.newTagButton}
          onClick={() => setExpanded(true)}
        >
          + New Tag
        </button>
      </li>
    );
  }

  return (
    <li className={styles.tagFormItem}>
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
          ref={labelInputRef}
          className={styles.tagFormInput}
          value={label}
          onChange={(event) => {
            setError(null);
            setLabel(event.currentTarget.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="New tag"
          aria-label="New tag name"
        />
        <div className={styles.tagFormActions}>
          <button
            type="submit"
            className={styles.tagFormActionBtn}
            aria-label="Create tag"
          >
            <AdIcon icon="Check" source="lucide" size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.tagFormActionBtn}
            aria-label="Cancel creating tag"
            onClick={reset}
          >
            <AdIcon icon="X" source="lucide" size={13} strokeWidth={2} />
          </button>
        </div>
      </form>
      {error ? <p className={styles.tagFormError}>{error}</p> : null}
    </li>
  );
};

export default TagFormRow;
