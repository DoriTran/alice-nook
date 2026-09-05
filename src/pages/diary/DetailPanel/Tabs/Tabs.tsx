import type { FC } from 'react';

import type { DetailPanelTab } from '../../types';

import styles from './Tabs.module.css';

const TAB_ITEMS: { id: DetailPanelTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'media', label: 'Media' },
  { id: 'settings', label: 'Settings' },
];

export type TabsProps = {
  activeTab: DetailPanelTab;
  onTabChange: (tab: DetailPanelTab) => void;
};

const Tabs: FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.root}>
      <nav className={styles.tabList} aria-label="Detail panel sections">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={activeTab === tab.id}
            data-active={activeTab === tab.id || undefined}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
