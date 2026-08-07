import {
  faChevronDown,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useState, type ChangeEvent, type FC } from 'react';

import { AdIcon, AdPopover } from '@/packages/base';

import type { DiaryFilterTab } from '../../types';

import FilterMenu, { FILTER_TAB_LABELS } from '../Filter/FilterMenu';
import styles from './Search.module.css';

export type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  filterTab: DiaryFilterTab;
  onFilterChange: (tab: DiaryFilterTab) => void;
  filterCounts: Record<DiaryFilterTab, number>;
};

const Search: FC<SearchProps> = ({
  value,
  onChange,
  filterTab,
  onFilterChange,
  filterCounts,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasQuery = value.length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleSelect = (tab: DiaryFilterTab) => {
    onFilterChange(tab);
    setMenuOpen(false);
  };

  return (
    <div className={styles.root}>
      <span className={styles.leadingIcon} aria-hidden>
        <AdIcon icon={faMagnifyingGlass} size={14} />
      </span>
      <input
        className={styles.input}
        type="text"
        placeholder="Search chatboxes..."
        value={value}
        onChange={handleChange}
        aria-label="Search chatboxes"
      />
      {hasQuery ? (
        <button
          className={styles.clearBtn}
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <AdIcon icon={faXmark} size={11} />
        </button>
      ) : null}
      <AdPopover
        classNames={{ dropdown: styles.filterMenu }}
        offset={6}
        onChange={setMenuOpen}
        opened={menuOpen}
        position="bottom-end"
        width={180}
        anchor={
          <button
            className={styles.filterTrigger}
            type="button"
            aria-label="Filter chatboxes"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.filterLabel}>
              {FILTER_TAB_LABELS[filterTab]}
            </span>
            <AdIcon icon={faChevronDown} size={10} />
          </button>
        }
      >
        <FilterMenu
          activeTab={filterTab}
          counts={filterCounts}
          onSelect={handleSelect}
        />
      </AdPopover>
    </div>
  );
};

export default Search;
