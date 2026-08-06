import type { FC } from 'react';

import { faThumbtack } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

import type { Workspace } from '@/store/workspace/type';

import { AdIcon } from '@/packages/base';
import { ColorMainSwatch } from '@/packages/color';
import { normalizeIconId } from '@/packages/icon';

import {
  formatWorkspaceUpdatedLabel,
  WORKSPACE_TYPE_LABELS,
} from '../../workspace.utils';
import styles from './WorkspaceListItem.module.css';

export type WorkspaceListItemProps = {
  workspace: Workspace;
  selected: boolean;
  onSelect: (workspaceId: string) => void;
};

const WorkspaceListItem: FC<WorkspaceListItemProps> = ({
  workspace,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      className={clsx(styles.root, selected && styles.selected)}
      onClick={() => onSelect(workspace.id)}
      aria-current={selected ? 'true' : undefined}
    >
      <ColorMainSwatch
        className={styles.icon}
        colorId={workspace.colorId}
        aria-hidden
      >
        <AdIcon
          icon={normalizeIconId(workspace.icon)}
          source="lucide"
          size={16}
        />
      </ColorMainSwatch>
      <span className={styles.meta}>
        <span className={styles.nameRow}>
          <span className={styles.name}>{workspace.name}</span>
          {workspace.pinned ? (
            <span className={styles.pin} aria-hidden>
              <AdIcon icon={faThumbtack} size={11} />
            </span>
          ) : null}
        </span>
        <span className={styles.subRow}>
          <span className={styles.typePill}>
            {WORKSPACE_TYPE_LABELS[workspace.type]}
          </span>
          <span className={styles.updated}>
            {formatWorkspaceUpdatedLabel(workspace)}
          </span>
        </span>
      </span>
    </button>
  );
};

export default WorkspaceListItem;
