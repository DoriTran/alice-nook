import { useMemo, useState, type FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useWorkspaceStore } from '@/store';

import type { WorkspaceFilterTab } from '../../workspaceListFilter.utils';

import { useWorkspacePageData } from '../../.hooks/useWorkspacePageData';
import { filterWorkspaces } from '../../workspaceListFilter.utils';
import CreateWorkspaceRow from './CreateWorkspaceRow';
import WorkspaceListItem from './WorkspaceListItem';
import styles from './WorkspaceListPanel.module.css';
import WorkspaceSearch from './WorkspaceSearch';

export type WorkspaceListPanelProps = {
  onCreate: () => void;
};

const WorkspaceListPanel: FC<WorkspaceListPanelProps> = ({ onCreate }) => {
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const { ui, allWorkspaces, filterCounts, workspaceCountsByType } =
    useWorkspacePageData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<WorkspaceFilterTab>('all');
  const [selectedTypes, setSelectedTypes] = useState<WorkspaceType[]>([]);

  const filteredWorkspaces = useMemo(
    () =>
      filterWorkspaces(allWorkspaces, searchQuery, filterTab, selectedTypes),
    [allWorkspaces, filterTab, searchQuery, selectedTypes],
  );

  return (
    <LayoutCard
      tag="section"
      className={styles.root}
      aria-label="My workspaces"
      data-module="workspace"
    >
      <div className={styles.searchRow}>
        <WorkspaceSearch
          value={searchQuery}
          onChange={setSearchQuery}
          filterTab={filterTab}
          onFilterChange={setFilterTab}
          filterCounts={filterCounts}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          typeCounts={workspaceCountsByType}
        />
      </div>

      <div className={styles.scroll}>
        {filteredWorkspaces.length === 0 ? (
          <p className={styles.empty}>No workspaces match your filters.</p>
        ) : (
          filteredWorkspaces.map((workspace) => (
            <WorkspaceListItem
              key={workspace.id}
              workspace={workspace}
              selected={ui.selectedWorkspaceId === workspace.id}
              onSelect={selectWorkspace}
            />
          ))
        )}
      </div>

      <CreateWorkspaceRow onClick={onCreate} />
    </LayoutCard>
  );
};

export default WorkspaceListPanel;
