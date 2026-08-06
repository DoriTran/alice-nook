import { useState, type FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import CreateWorkspaceModal from './CreateWorkspaceModal/CreateWorkspaceModal';
import WorkspaceAppsPanel from './WorkspaceAppsPanel/WorkspaceAppsPanel';
import styles from './WorkspaceExplorer.module.css';
import WorkspaceListPanel from './WorkspaceListPanel/WorkspaceListPanel';

const WorkspaceExplorer: FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<WorkspaceType>('custom');

  const handleCreate = (type: WorkspaceType = 'custom') => {
    setCreateType(type);
    setCreateModalOpen(true);
  };

  return (
    <>
      <div className={styles.column} aria-label="Workspace explorer">
        <WorkspaceAppsPanel />
        <WorkspaceListPanel onCreate={() => handleCreate('custom')} />
      </div>

      <CreateWorkspaceModal
        opened={createModalOpen}
        initialType={createType}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
};

export default WorkspaceExplorer;
