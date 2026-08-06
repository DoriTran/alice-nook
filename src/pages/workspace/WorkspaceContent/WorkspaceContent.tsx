import type { FC } from 'react';

import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useWorkspaceStore } from '@/store';

import { useWorkspacePageData } from '../.hooks/useWorkspacePageData';
import { workspaceToolRenderers } from '../tools/registry';
import ContentHeader from './ContentHeader/ContentHeader';
import EmptyState from './EmptyState/EmptyState';
import ToolHome from './ToolHome/ToolHome';
import styles from './WorkspaceContent.module.css';

const WorkspaceContent: FC = () => {
  const selectRecord = useWorkspaceStore('selectRecord');
  const {
    ui,
    chatboxes,
    selectedWorkspace,
    workspaceSources,
    workspaceRecords,
  } = useWorkspacePageData();

  if (ui.activeToolHomeType) {
    return (
      <LayoutCard tag="main" className={styles.root} data-module="workspace">
        <ToolHome type={ui.activeToolHomeType} />
      </LayoutCard>
    );
  }

  if (!selectedWorkspace) {
    return (
      <LayoutCard tag="main" className={styles.root} data-module="workspace">
        <EmptyState />
      </LayoutCard>
    );
  }

  const ToolRenderer = workspaceToolRenderers[selectedWorkspace.type];

  return (
    <LayoutCard tag="main" className={styles.root} data-module="workspace">
      <ContentHeader
        workspace={selectedWorkspace}
        sources={workspaceSources}
        chatboxes={chatboxes}
      />

      <div className={styles.toolArea}>
        <ToolRenderer
          workspace={selectedWorkspace}
          sources={workspaceSources}
          records={workspaceRecords}
          selectedRecordId={ui.selectedRecordId}
          onSelectRecord={selectRecord}
        />
      </div>
    </LayoutCard>
  );
};

export default WorkspaceContent;
