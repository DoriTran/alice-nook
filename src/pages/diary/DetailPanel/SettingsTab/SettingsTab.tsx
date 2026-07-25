import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState, type FC } from 'react';

import { AdConfirmDialog, AdIcon } from '@/packages/base';

import styles from './SettingsTab.module.css';

export type SettingsTabProps = {
  chatboxName: string;
  onDeleteChatbox: () => void;
};

const SettingsTab: FC<SettingsTabProps> = ({
  chatboxName,
  onDeleteChatbox,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h3 className={styles.heading}>Danger zone</h3>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => setConfirmOpen(true)}
        >
          <AdIcon icon={faTrash} size={13} />
          <span>Delete this chat</span>
        </button>
      </section>

      <AdConfirmDialog
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDeleteChatbox();
        }}
        title="Delete this chat?"
        message={`“${chatboxName}” and all of its messages will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
};

export default SettingsTab;
