import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FC } from 'react';

import {
  faBoxArchive,
  faClock,
  faThLarge,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';

import { AdIcon } from '@/packages/base';

import type { DiaryFilterTab } from '../../types';

import styles from './FilterMenu.module.css';

const TABS: {
  id: DiaryFilterTab;
  label: string;
  icon: IconDefinition;
}[] = [
  { id: 'all', label: 'All', icon: faThLarge },
  { id: 'pinned', label: 'Pinned', icon: faThumbtack },
  { id: 'recent', label: 'Recent', icon: faClock },
  { id: 'archived', label: 'Archived', icon: faBoxArchive },
];

export type FilterMenuProps = {
  activeTab: DiaryFilterTab;
  counts: Record<DiaryFilterTab, number>;
  onSelect: (tab: DiaryFilterTab) => void;
};

const FilterMenu: FC<FilterMenuProps> = ({ activeTab, counts, onSelect }) => {
  return (
    <ul className={styles.menuList} role="menu">
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;

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

export const FILTER_TAB_LABELS: Record<DiaryFilterTab, string> = {
  all: 'All',
  pinned: 'Pinned',
  recent: 'Recent',
  archived: 'Archived',
};

export default FilterMenu;
