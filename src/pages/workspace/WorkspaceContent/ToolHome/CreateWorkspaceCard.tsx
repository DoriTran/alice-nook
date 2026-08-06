import type { FC } from 'react';

import { faPlus } from '@fortawesome/free-solid-svg-icons';

import type { WorkspaceType } from '@/store/workspace/type';

import { AdIcon } from '@/packages/base';

import { WORKSPACE_TYPE_LABELS } from '../../workspace.utils';
import styles from './WorkspaceCard.module.css';

export type CreateWorkspaceCardProps = {
  type: WorkspaceType;
  onClick: () => void;
};

const CreateWorkspaceCard: FC<CreateWorkspaceCardProps> = ({
  type,
  onClick,
}) => {
  return (
    <button type="button" className={styles.createRoot} onClick={onClick}>
      <span className={styles.createIcon} aria-hidden>
        <AdIcon icon={faPlus} size={20} />
      </span>
      <span className={styles.createLabel}>
        Create New {WORKSPACE_TYPE_LABELS[type]} Workspace
      </span>
    </button>
  );
};

export default CreateWorkspaceCard;
