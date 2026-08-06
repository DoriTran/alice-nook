import { useEffect, type FC } from 'react';

import { useWorkspaceHydrated, useWorkspaceStore } from '@/store';

import styles from './index.module.css';
import InspectorPanel from './InspectorPanel/InspectorPanel';
import WorkspaceContent from './WorkspaceContent/WorkspaceContent';
import WorkspaceExplorer from './WorkspaceExplorer/WorkspaceExplorer';

const DEFAULT_WORKSPACE_ID = 'ws:daily-work';

const Workspace: FC = () => {
  const hydrated = useWorkspaceHydrated();
  const seedIfEmpty = useWorkspaceStore('seedIfEmpty');
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const ui = useWorkspaceStore('ui');

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    seedIfEmpty();
  }, [hydrated, seedIfEmpty]);

  useEffect(() => {
    if (!hydrated || ui.selectedWorkspaceId || ui.activeToolHomeType) {
      return;
    }

    selectWorkspace(DEFAULT_WORKSPACE_ID);
  }, [
    hydrated,
    selectWorkspace,
    ui.activeToolHomeType,
    ui.selectedWorkspaceId,
  ]);

  return (
    <div className={styles.rootPage}>
      <WorkspaceExplorer />
      <div className={styles.contentColumn}>
        <WorkspaceContent />
      </div>
      <InspectorPanel />
    </div>
  );
};

export default Workspace;
