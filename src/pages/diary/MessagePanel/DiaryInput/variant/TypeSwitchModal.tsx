import type { FC } from 'react';

import { Group, Text } from '@mantine/core';

import type { MessageVariant } from '@/store/diary/type';

import { AdModal } from '@/packages/base';

import formStyles from '../../../ChatboxSidebar/Create/CreateForm.module.css';
import styles from './TypeSwitchModal.module.css';

export type TypeSwitchModalProps = {
  nextVariant: MessageVariant | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const TypeSwitchModal: FC<TypeSwitchModalProps> = ({
  nextVariant,
  onConfirm,
  onCancel,
}) => {
  return (
    <AdModal
      opened={nextVariant !== null}
      onClose={onCancel}
      title="Switch type?"
      size="sm"
    >
      <Text size="sm">
        Current content will be converted if possible. Continue?
      </Text>
      <Group justify="flex-end" mt="md">
        <button
          type="button"
          className={formStyles.btnSecondary}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${formStyles.btnPrimary} ${styles.confirmButton}`}
          onClick={onConfirm}
        >
          Switch Type
        </button>
      </Group>
    </AdModal>
  );
};

export default TypeSwitchModal;
