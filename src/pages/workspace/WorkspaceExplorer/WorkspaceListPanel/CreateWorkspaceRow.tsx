import type { FC } from 'react';

import { faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';

import { AdIcon } from '@/packages/base';

import styles from './CreateWorkspaceRow.module.css';

export type CreateWorkspaceRowProps = {
  onClick: () => void;
};

const CreateWorkspaceRow: FC<CreateWorkspaceRowProps> = ({ onClick }) => {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <span className={styles.icon} aria-hidden>
        <AdIcon icon={faPlus} size={16} />
      </span>
      <span className={styles.label}>Create New Workspace</span>
      <span className={styles.chevron} aria-hidden>
        <AdIcon icon={faChevronRight} size={12} />
      </span>
    </button>
  );
};

export default CreateWorkspaceRow;
