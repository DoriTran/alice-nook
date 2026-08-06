import type { FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import { AdIcon } from '@/packages/base';
import { ColorMainSwatch } from '@/packages/color';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useWorkspaceStore } from '@/store';

import { useWorkspacePageData } from '../../.hooks/useWorkspacePageData';
import {
  resolveWorkspaceForToolType,
  WORKSPACE_TYPE_META,
  WORKSPACE_TYPE_ORDER,
} from '../../workspace.utils';
import styles from './WorkspaceAppsPanel.module.css';

const WorkspaceAppsPanel: FC = () => {
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const openToolHome = useWorkspaceStore('openToolHome');
  const { workspaces, orders, ui, workspaceCountsByType } =
    useWorkspacePageData();

  const handleAppClick = (type: WorkspaceType) => {
    const workspaceId = resolveWorkspaceForToolType(
      type,
      workspaces,
      orders.workspaceIds,
      ui.lastUsedWorkspaceByType,
    );

    if (workspaceId) {
      selectWorkspace(workspaceId);
      return;
    }

    openToolHome(type);
  };

  return (
    <LayoutCard
      tag="section"
      className={styles.root}
      aria-label="Workspace apps"
      data-module="workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Workspace Apps</h1>
      </header>

      <div className={styles.grid}>
        {WORKSPACE_TYPE_ORDER.map((type) => {
          const meta = WORKSPACE_TYPE_META[type];
          const count = workspaceCountsByType[type];

          return (
            <button
              key={type}
              type="button"
              className={styles.tile}
              onClick={() => handleAppClick(type)}
            >
              <ColorMainSwatch
                className={styles.icon}
                colorId={meta.colorId}
                aria-hidden
              >
                <AdIcon icon={meta.icon} source="lucide" size={22} />
              </ColorMainSwatch>
              <span className={styles.label}>{meta.label}</span>
              <span className={styles.count}>{count}</span>
            </button>
          );
        })}
      </div>
    </LayoutCard>
  );
};

export default WorkspaceAppsPanel;
