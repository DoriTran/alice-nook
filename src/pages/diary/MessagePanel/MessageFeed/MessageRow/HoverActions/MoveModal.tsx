import { useMemo, useState, type FC } from 'react';

import { AdModal, AdSelect } from '@/packages/base';
import { useDiaryStore } from '@/store';

import styles from './MoveModal.module.css';

export type MoveModalProps = {
  sourceMessageId: string | null;
  currentChatboxId: string;
  onClone: (targetChatboxId: string) => void;
  onMove: (targetChatboxId: string) => void;
  onClose: () => void;
};

const MoveModal: FC<MoveModalProps> = ({
  sourceMessageId,
  currentChatboxId,
  onClone,
  onMove,
  onClose,
}) => {
  const chatboxes = useDiaryStore('chatboxes');
  const [targetChatboxId, setTargetChatboxId] = useState('');

  const options = useMemo(
    () =>
      Object.values(chatboxes)
        .filter((chatbox) => chatbox.id !== currentChatboxId)
        .map((chatbox) => ({ value: chatbox.id, label: chatbox.name })),
    [chatboxes, currentChatboxId],
  );

  const handleClose = () => {
    setTargetChatboxId('');
    onClose();
  };

  const complete = (action: (targetChatboxId: string) => void) => {
    if (!targetChatboxId) {
      return;
    }

    action(targetChatboxId);
    setTargetChatboxId('');
  };

  return (
    <AdModal
      opened={Boolean(sourceMessageId)}
      onClose={handleClose}
      title="Move message"
      size="sm"
    >
      <AdSelect
        label="Target chatbox"
        placeholder="Select chatbox..."
        data={options}
        value={targetChatboxId || null}
        onChange={(value) => setTargetChatboxId(value ?? '')}
        searchable
        emptyLabel="No chatboxes found"
      />
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.clone}
          disabled={!targetChatboxId}
          onClick={() => complete(onClone)}
        >
          Clone
        </button>
        <button
          type="button"
          className={styles.move}
          disabled={!targetChatboxId}
          onClick={() => complete(onMove)}
        >
          Move
        </button>
      </div>
    </AdModal>
  );
};

export default MoveModal;
