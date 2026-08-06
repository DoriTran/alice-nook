import { useEffect, useRef, useState, type FC, type FormEvent } from 'react';

import type { ColorId } from '@/packages/color';
import type { WorkspaceType } from '@/store/workspace/type';

import {
  AdField,
  AdIconPicker,
  AdInput,
  AdModal,
  AdSelect,
  AdTextarea,
} from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import { DEFAULT_ICON_ID, type IconId } from '@/packages/icon';
import { PalettePicker } from '@/packages/ui';
import { useWorkspaceStore } from '@/store';

import { WORKSPACE_TYPE_LABELS } from '../../workspace.utils';
import styles from './CreateWorkspaceModal.module.css';

const TYPE_OPTIONS = (
  Object.entries(WORKSPACE_TYPE_LABELS) as [WorkspaceType, string][]
).map(([value, label]) => ({ value, label }));

export type CreateWorkspaceModalProps = {
  opened: boolean;
  initialType?: WorkspaceType;
  onClose: () => void;
};

const CreateWorkspaceModal: FC<CreateWorkspaceModalProps> = ({
  opened,
  initialType = 'custom',
  onClose,
}) => {
  const createWorkspace = useWorkspaceStore('createWorkspace');
  const selectWorkspace = useWorkspaceStore('selectWorkspace');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkspaceType>(initialType);
  const [icon, setIcon] = useState<IconId>(DEFAULT_ICON_ID);
  const [colorId, setColorId] = useState<ColorId>(DEFAULT_COLOR_ID);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (opened) {
      setType(initialType);
      nameInputRef.current?.focus();
    }
  }, [initialType, opened]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setType(initialType);
    setIcon(DEFAULT_ICON_ID);
    setColorId(DEFAULT_COLOR_ID);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const workspaceId = createWorkspace({
      name: trimmedName,
      description: description.trim(),
      type,
      icon,
      colorId,
    });

    selectWorkspace(workspaceId);
    handleClose();
  };

  return (
    <AdModal
      opened={opened}
      onClose={handleClose}
      title="Create Workspace"
      size="md"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <AdField label="Name" htmlFor="create-workspace-name">
          <AdInput
            ref={nameInputRef}
            id="create-workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My workspace"
          />
        </AdField>

        <AdField label="Description" htmlFor="create-workspace-description">
          <AdTextarea
            id="create-workspace-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this workspace for?"
            rows={3}
          />
        </AdField>

        <AdField label="Tool Type">
          <AdSelect
            value={type}
            onChange={(value) => {
              if (value) {
                setType(value as WorkspaceType);
              }
            }}
            data={TYPE_OPTIONS}
          />
        </AdField>

        <div className={styles.pickers}>
          <AdIconPicker
            value={icon}
            onChange={setIcon}
            variant="compact"
            label="Icon"
          />
          <PalettePicker
            value={colorId}
            onChange={setColorId}
            variant="compact"
            label="Color"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button type="submit" className={styles.primary}>
            Create
          </button>
        </div>
      </form>
    </AdModal>
  );
};

export default CreateWorkspaceModal;
