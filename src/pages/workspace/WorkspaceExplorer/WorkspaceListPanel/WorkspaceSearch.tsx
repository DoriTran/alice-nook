import {
  faChevronDown,
  faLayerGroup,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useState, type ChangeEvent, type FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import { AdIcon, AdPopover } from '@/packages/base';

import type { WorkspaceFilterTab } from '../../workspaceListFilter.utils';

import { WORKSPACE_FILTER_TAB_LABELS } from '../../workspaceListFilter.utils';
import WorkspaceFilterMenu from './WorkspaceFilterMenu';
import styles from './WorkspaceSearch.module.css';
import WorkspaceTypeFilterMenu from './WorkspaceTypeFilterMenu';

export type WorkspaceSearchProps = {
  value: string;
  onChange: (value: string) => void;
  filterTab: WorkspaceFilterTab;
  onFilterChange: (tab: WorkspaceFilterTab) => void;
  filterCounts: Record<WorkspaceFilterTab, number>;
  selectedTypes: WorkspaceType[];
  onTypesChange: (types: WorkspaceType[]) => void;
  typeCounts: Record<WorkspaceType, number>;
};

const WorkspaceSearch: FC<WorkspaceSearchProps> = ({
  value,
  onChange,
  filterTab,
  onFilterChange,
  filterCounts,
  selectedTypes,
  onTypesChange,
  typeCounts,
}) => {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const hasQuery = value.length > 0;
  const typeLabel =
    selectedTypes.length === 0
      ? null
      : selectedTypes.length === 1
        ? '1'
        : String(selectedTypes.length);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.root}>
      <span className={styles.leadingIcon} aria-hidden>
        <AdIcon icon={faMagnifyingGlass} size={14} />
      </span>
      <input
        className={styles.input}
        type="text"
        placeholder="Search workspaces..."
        value={value}
        onChange={handleChange}
        aria-label="Search workspaces"
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
        onChange={setStatusMenuOpen}
        opened={statusMenuOpen}
        position="bottom-end"
        width={180}
        anchor={
          <button
            className={styles.filterTrigger}
            type="button"
            aria-label="Filter workspaces by status"
            aria-expanded={statusMenuOpen}
            aria-haspopup="menu"
            onClick={() => setStatusMenuOpen((open) => !open)}
          >
            <span className={styles.filterLabel}>
              {WORKSPACE_FILTER_TAB_LABELS[filterTab]}
            </span>
            <AdIcon icon={faChevronDown} size={10} />
          </button>
        }
      >
        <WorkspaceFilterMenu
          activeTab={filterTab}
          counts={filterCounts}
          onSelect={(tab) => {
            onFilterChange(tab);
            setStatusMenuOpen(false);
          }}
        />
      </AdPopover>
      <AdPopover
        classNames={{ dropdown: styles.filterMenu }}
        offset={6}
        onChange={setTypeMenuOpen}
        opened={typeMenuOpen}
        position="bottom-end"
        width={210}
        anchor={
          <button
            className={styles.filterTrigger}
            type="button"
            aria-label="Filter workspaces by type"
            aria-expanded={typeMenuOpen}
            aria-haspopup="menu"
            data-active={selectedTypes.length > 0 || undefined}
            onClick={() => setTypeMenuOpen((open) => !open)}
          >
            <AdIcon icon={faLayerGroup} size={11} />
            {typeLabel ? (
              <span className={styles.filterLabel}>{typeLabel}</span>
            ) : null}
            <AdIcon icon={faChevronDown} size={10} />
          </button>
        }
      >
        <WorkspaceTypeFilterMenu
          selectedTypes={selectedTypes}
          counts={typeCounts}
          onChange={onTypesChange}
        />
      </AdPopover>
    </div>
  );
};

export default WorkspaceSearch;
