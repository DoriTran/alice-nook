import { useMemo } from 'react';

import { useDiaryStore, useWorkspaceStore } from '@/store';

import {
  countWorkspacesByType,
  getRecentWorkspaces,
  getWorkspaceRecords,
  getWorkspaceSources,
  getWorkspacesOfType,
} from '../workspace.utils';
import { countWorkspacesByFilterTab } from '../workspaceListFilter.utils';

export const useWorkspacePageData = () => {
  const workspaces = useWorkspaceStore('workspaces');
  const sources = useWorkspaceStore('sources');
  const records = useWorkspaceStore('records');
  const orders = useWorkspaceStore('orders');
  const ui = useWorkspaceStore('ui');
  const chatboxes = useDiaryStore('chatboxes');

  const selectedWorkspace = ui.selectedWorkspaceId
    ? workspaces[ui.selectedWorkspaceId]
    : undefined;

  const selectedRecord = ui.selectedRecordId
    ? records[ui.selectedRecordId]
    : undefined;

  const workspaceSources = useMemo(
    () => getWorkspaceSources(selectedWorkspace, sources),
    [selectedWorkspace, sources],
  );

  const workspaceRecords = useMemo(
    () => getWorkspaceRecords(ui.selectedWorkspaceId, records),
    [ui.selectedWorkspaceId, records],
  );

  const allWorkspaces = useMemo(
    () =>
      orders.workspaceIds
        .map((id) => workspaces[id])
        .filter((workspace): workspace is NonNullable<typeof workspace> =>
          Boolean(workspace),
        ),
    [orders.workspaceIds, workspaces],
  );

  const workspaceCountsByType = useMemo(
    () => countWorkspacesByType(workspaces, orders.workspaceIds),
    [orders.workspaceIds, workspaces],
  );

  const filterCounts = useMemo(
    () => countWorkspacesByFilterTab(allWorkspaces),
    [allWorkspaces],
  );

  const recentWorkspaces = useMemo(
    () => getRecentWorkspaces(workspaces, orders.workspaceIds),
    [workspaces, orders.workspaceIds],
  );

  const toolHomeWorkspaces = useMemo(() => {
    if (!ui.activeToolHomeType) {
      return [];
    }

    return getWorkspacesOfType(
      workspaces,
      orders.workspaceIds,
      ui.activeToolHomeType,
    );
  }, [orders.workspaceIds, ui.activeToolHomeType, workspaces]);

  return {
    workspaces,
    sources,
    records,
    orders,
    ui,
    chatboxes,
    selectedWorkspace,
    selectedRecord,
    workspaceSources,
    workspaceRecords,
    allWorkspaces,
    workspaceCountsByType,
    filterCounts,
    recentWorkspaces,
    toolHomeWorkspaces,
  };
};
