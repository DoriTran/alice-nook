import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FC } from 'react';

import {
  faBoxArchive,
  faClock,
  faThLarge,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';

import { AdIcon } from '@/packages/base';

import type { WorkspaceFilterTab } from '../../workspaceListFilter.utils';

import { WORKSPACE_FILTER_TAB_LABELS } from '../../workspaceListFilter.utils';
import styles from './WorkspaceFilterMenu.module.css';

const TABS: {
  id: WorkspaceFilterTab;
  label: string;
  icon: IconDefinition;
}[] = [
  { id: 'all', label: WORKSPACE_FILTER_TAB_LABELS.all, icon: faThLarge },
  {
    id: 'pinned',
    label: WORKSPACE_FILTER_TAB_LABELS.pinned,
    icon: faThumbtack,
  },
  { id: 'recent', label: WORKSPACE_FILTER_TAB_LABELS.recent, icon: faClock },
  {
    id: 'archived',
    label: WORKSPACE_FILTER_TAB_LABELS.archived,
    icon: faBoxArchive,
  },
];

export type WorkspaceFilterMenuProps = {
  activeTab: WorkspaceFilterTab;
  counts: Record<WorkspaceFilterTab, number>;
  onSelect: (tab: WorkspaceFilterTab) => void;
};

const WorkspaceFilterMenu: FC<WorkspaceFilterMenuProps> = ({
  activeTab,
  counts,
  onSelect,
}) => {
  return (
    <ul className={styles.menuList} role="menu">
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;

        return (
          <li key={tab.id} role="none">
            <button
              type="button"
              role="menuitemradio"
              className={styles.menuItem}
              data-active={selected || undefined}
              aria-checked={selected}
              onClick={() => onSelect(tab.id)}
            >
              <span className={styles.icon} aria-hidden>
                <AdIcon icon={tab.icon} size={13} />
              </span>
              <span className={styles.label}>{tab.label}</span>
              <span
                className={styles.count}
                data-active={selected || undefined}
              >
                {counts[tab.id]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default WorkspaceFilterMenu;
