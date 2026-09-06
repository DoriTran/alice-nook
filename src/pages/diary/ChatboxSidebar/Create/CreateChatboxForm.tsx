import { useMemo, useState, type FC, type FormEvent } from 'react';

import type { ColorId } from '@/packages/color';
import type { IconId } from '@/packages/icon';

import {
  AD_SELECT_NONE_VALUE,
  AdField,
  AdIconPicker,
  AdInput,
  AdSelect,
  AdTextarea,
} from '@/packages/base';
import { DEFAULT_COLOR_ID } from '@/packages/color';
import { DEFAULT_ICON_ID, normalizeIconId } from '@/packages/icon';
import { PalettePicker, TagSelect } from '@/packages/ui';
import { useAppStore, useDiaryStore } from '@/store';

import { resolveCreateIconId } from './create.constants';
import formStyles from './CreateForm.module.css';

export type CreateChatboxFormProps = {
  chatboxId?: string;
  onCancel: () => void;
  onSaved: () => void;
};

const CreateChatboxForm: FC<CreateChatboxFormProps> = ({
  chatboxId,
  onCancel,
  onSaved,
}) => {
  const isEdit = Boolean(chatboxId);
  const createChatbox = useDiaryStore('createChatbox');
  const updateChatbox = useDiaryStore('updateChatbox');
  const moveChatboxToGroup = useDiaryStore('moveChatboxToGroup');
  const selectChatbox = useAppStore('selectChatbox');
  const groups = useDiaryStore('groups');
  const chatboxes = useDiaryStore('chatboxes');
  const rootOrders = useDiaryStore('orders').rootOrders;

  const existing = chatboxId ? chatboxes[chatboxId] : null;

  const groupOptions = useMemo(
    () =>
      rootOrders
        .map((id) => groups[id])
        .filter((group): group is NonNullable<typeof group> => Boolean(group)),
    [groups, rootOrders],
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [icon, setIcon] = useState<IconId>(
    resolveCreateIconId(existing?.icon ?? DEFAULT_ICON_ID),
  );
  const [colorId, setColorId] = useState<ColorId>(
    existing?.colorId ?? DEFAULT_COLOR_ID,
  );
  const [groupId, setGroupId] = useState(existing?.groupId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(
    existing?.tags.map((stat) => stat.tagId) ?? [],
  );

  const groupSelectOptions = useMemo(
    () => [
      { value: AD_SELECT_NONE_VALUE, label: 'No group' },
      ...groupOptions.map((group) => ({
        value: group.id,
        label: group.name,
        iconId: normalizeIconId(group.icon),
        colorId: group.colorId,
      })),
    ],
    [groupOptions],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    if (isEdit && chatboxId && existing) {
      const countByTagId = new Map(
        existing.tags.map((stat) => [stat.tagId, stat.count]),
      );
      const nextTags = tagIds.map((tagId) => ({
        tagId,
        count: countByTagId.get(tagId) ?? 0,
      }));

      updateChatbox(chatboxId, {
        name: trimmedName,
        description: description.trim(),
        icon,
        colorId,
        tags: nextTags,
      });

      const nextGroupId = groupId || null;

      if (nextGroupId !== existing.groupId) {
        moveChatboxToGroup(chatboxId, nextGroupId);
      }

      onSaved();
      return;
    }

    const newId = createChatbox({
      name: trimmedName,
      description: description.trim(),
      icon,
      colorId,
      groupId: groupId || null,
      tags: tagIds.map((tagId) => ({ tagId, count: 0 })),
    });

    selectChatbox(newId);
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
          />
          <PalettePicker
            value={colorId}
            onChange={setColorId}
            variant="compact"
            label="Color"
          />
        </div>
        <AdField label="Name" htmlFor="create-chatbox-name">
          <AdInput
            id="create-chatbox-name"
            name="chatbox-name"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My chatbox"
            required
          />
        </AdField>
      </div>

      <AdField
        label="Description (optional)"
        htmlFor="create-chatbox-description"
      >
        <AdTextarea
          id="create-chatbox-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this chatbox about?"
        />
      </AdField>

      <TagSelect
        label="Tags (optional)"
        placeholder="Search or create tags..."
        emptyLabel="No tags found"
        value={tagIds}
        onChange={setTagIds}
        withinPortal
      />

      <AdSelect
        label="Group (optional)"
        placeholder="No group"
        data={groupSelectOptions}
        value={groupId || AD_SELECT_NONE_VALUE}
        onChange={(value) =>
          setGroupId(value === AD_SELECT_NONE_VALUE ? '' : (value ?? ''))
        }
      />

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
          {isEdit ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default CreateChatboxForm;
