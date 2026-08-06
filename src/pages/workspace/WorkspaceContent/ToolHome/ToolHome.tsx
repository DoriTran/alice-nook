import {
  faBell,
  faEllipsisVertical,
  faList,
  faPlus,
  faThLarge,
} from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState, type FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import { AdActionButton, AdIcon, AdSelect } from '@/packages/base';
import { ColorMainSwatch } from '@/packages/color';
import { useWorkspaceStore } from '@/store';

import { useWorkspacePageData } from '../../.hooks/useWorkspacePageData';
import { WORKSPACE_TYPE_META } from '../../workspace.utils';
import CreateWorkspaceModal from '../../WorkspaceExplorer/CreateWorkspaceModal/CreateWorkspaceModal';
import CreateWorkspaceCard from './CreateWorkspaceCard';
import styles from './ToolHome.module.css';
import WorkspaceCard from './WorkspaceCard';

export type ToolHomeProps = {
  type: WorkspaceType;
};

type HomeTab = 'workspaces' | 'templates';
type SortMode = 'recent' | 'name';
type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'name', label: 'Name A–Z' },
];

const ToolHome: FC<ToolHomeProps> = ({ type }) => {
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const { toolHomeWorkspaces, sources, chatboxes } = useWorkspacePageData();
  const meta = WORKSPACE_TYPE_META[type];

  const [tab, setTab] = useState<HomeTab>('workspaces');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [createOpen, setCreateOpen] = useState(false);

  const sortedWorkspaces = useMemo(() => {
    const items = [...toolHomeWorkspaces];

    if (sortMode === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items.sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [sortMode, toolHomeWorkspaces]);

  return (
    <>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <ColorMainSwatch
              className={styles.headerIcon}
              colorId={meta.colorId}
              aria-hidden
            >
              <AdIcon icon={meta.icon} source="lucide" size={24} />
            </ColorMainSwatch>
            <div className={styles.headerCopy}>
              <h1 className={styles.headerTitle}>{meta.label}</h1>
              <p className={styles.headerSubtitle}>{meta.subtitle}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <AdActionButton icon={faEllipsisVertical} label="More options" />
            <AdActionButton icon={faBell} label="Notifications" />
          </div>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Tool home">
          <button
            type="button"
            role="tab"
            className={styles.tab}
            data-active={tab === 'workspaces' || undefined}
            aria-selected={tab === 'workspaces'}
            onClick={() => setTab('workspaces')}
          >
            My Workspaces
          </button>
          <button
            type="button"
            role="tab"
            className={styles.tab}
            data-active={tab === 'templates' || undefined}
            aria-selected={tab === 'templates'}
            onClick={() => setTab('templates')}
          >
            Templates
          </button>
        </div>

        <div className={styles.scroll}>
          {tab === 'templates' ? (
            <div className={styles.templatesEmpty}>
              <h2 className={styles.templatesTitle}>Templates coming soon</h2>
              <p className={styles.templatesCopy}>
                Starter layouts for {meta.label} will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                  <h2 className={styles.toolbarTitle}>
                    Your {meta.label} Workspaces
                  </h2>
                  <span className={styles.countBadge}>
                    {sortedWorkspaces.length}
                  </span>
                </div>
                <div className={styles.toolbarRight}>
                  <div
                    className={styles.viewToggle}
                    role="group"
                    aria-label="View mode"
                  >
                    <AdActionButton
                      icon={faThLarge}
                      label="Grid view"
                      active={viewMode === 'grid'}
                      onClick={() => setViewMode('grid')}
                    />
                    <AdActionButton
                      icon={faList}
                      label="List view"
                      active={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                    />
                  </div>
                  <div className={styles.sortSelect}>
                    <AdSelect
                      data={SORT_OPTIONS}
                      value={sortMode}
                      onChange={(value) =>
                        setSortMode((value as SortMode) || 'recent')
                      }
                      aria-label="Sort workspaces"
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.newButton}
                    onClick={() => setCreateOpen(true)}
                  >
                    <AdIcon icon={faPlus} size={12} />
                    New Workspace
                  </button>
                </div>
              </div>

              <div className={viewMode === 'list' ? styles.list : styles.grid}>
                {sortedWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    sources={sources}
                    chatboxes={chatboxes}
                    onSelect={selectWorkspace}
                  />
                ))}
                <CreateWorkspaceCard
                  type={type}
                  onClick={() => setCreateOpen(true)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <CreateWorkspaceModal
        opened={createOpen}
        initialType={type}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};

export default ToolHome;
