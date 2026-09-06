import { useSyncExternalStore, useState, type FC, type FormEvent } from 'react';

import type { ColorId } from '@/packages/color';
import type { IconId } from '@/packages/icon';

import { AdField, AdIconPicker, AdInput } from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import { DEFAULT_ICON_ID } from '@/packages/icon';
import { PalettePicker } from '@/packages/ui';
import { useAppStore, useDiaryStore } from '@/store';

import { resolveCreateIconId } from './create.constants';
import formStyles from './CreateForm.module.css';

const PICKER_OFFSET_VH = 25;

const useNegativeVhOffset = (vh: number) =>
  useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('resize', onStoreChange);
      return () => window.removeEventListener('resize', onStoreChange);
    },
    () => -window.innerHeight * (vh / 100),
    () => -800 * (vh / 100),
  );

export type CreateGroupFormProps = {
  groupId?: string;
  onCancel: () => void;
  onSaved: () => void;
};

const CreateGroupForm: FC<CreateGroupFormProps> = ({
  groupId,
  onCancel,
  onSaved,
}) => {
  const isEdit = Boolean(groupId);
  const createGroup = useDiaryStore('createGroup');
  const updateGroup = useDiaryStore('updateGroup');
  const expandGroup = useAppStore('expandGroup');
  const groups = useDiaryStore('groups');

  const existing = groupId ? groups[groupId] : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<IconId>(
    resolveCreateIconId(existing?.icon ?? DEFAULT_ICON_ID),
  );
  const [colorId, setColorId] = useState<ColorId>(
    existing?.colorId ?? DEFAULT_COLOR_ID,
  );

  const pickerOffset = useNegativeVhOffset(PICKER_OFFSET_VH);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    if (isEdit && groupId) {
      updateGroup(groupId, {
        name: trimmedName,
        icon,
        colorId,
      });
      onSaved();
      return;
    }

    const newId = createGroup({
      name: trimmedName,
      icon,
      colorId,
    });

    expandGroup(newId);
    onSaved();
  };

  return (
    <form
      className={formStyles.form}
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <div className={formStyles.identityRow}>
        <div className={formStyles.identityPickers}>
          <AdIconPicker
            value={icon}
            onChange={setIcon}
            variant="compact"
            label="Icon"
            offset={pickerOffset}
          />
          <PalettePicker
            value={colorId}
            onChange={setColorId}
            variant="compact"
            label="Color"
            offset={pickerOffset}
          />
        </div>
        <AdField label="Name" htmlFor="create-group-name">
          <AdInput
            id="create-group-name"
            name="group-name"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My group"
            required
          />
        </AdField>
      </div>

      <div className={formStyles.actions}>
        <button
          type="button"
          className={formStyles.btnSecondary}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={formStyles.btnPrimary}
          disabled={!name.trim()}
        >
          {isEdit ? 'Save changes' : 'Create group'}
        </button>
      </div>
    </form>
  );
};

export default CreateGroupForm;
