import type { Workspace, WorkspaceType } from '@/store/workspace/type';

export type WorkspaceFilterTab = 'all' | 'pinned' | 'recent' | 'archived';

const RECENT_DAYS = 7;

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const WORKSPACE_FILTER_TAB_LABELS: Record<WorkspaceFilterTab, string> = {
  all: 'All',
  pinned: 'Pinned',
  recent: 'Recent',
  archived: 'Archived',
};

export const hasActiveWorkspaceListQuery = (
  searchQuery: string,
  filterTab: WorkspaceFilterTab,
  selectedTypes: readonly WorkspaceType[],
): boolean =>
  searchQuery.trim() !== '' || filterTab !== 'all' || selectedTypes.length > 0;

export const matchesWorkspaceSearch = (
  workspace: Workspace,
  query: string,
): boolean => {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return true;
  }

  return [workspace.name, workspace.description].some((value) =>
    value.toLowerCase().includes(normalized),
  );
};

export const matchesWorkspaceFilterTab = (
  workspace: Workspace,
  filterTab: WorkspaceFilterTab,
): boolean => {
  if (filterTab === 'all') {
    return true;
  }

  if (filterTab === 'pinned') {
    return workspace.pinned;
  }

  if (filterTab === 'archived') {
    return workspace.archived;
  }

  const activityAt = workspace.updatedAt ?? workspace.createdAt;
  const activityTime = new Date(activityAt).getTime();
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  return activityTime >= cutoff;
};

export const matchesWorkspaceTypes = (
  workspace: Workspace,
  selectedTypes: readonly WorkspaceType[],
): boolean => {
  if (selectedTypes.length === 0) {
    return true;
  }

  return selectedTypes.includes(workspace.type);
};

export const countWorkspacesByFilterTab = (
  workspaces: readonly Workspace[],
): Record<WorkspaceFilterTab, number> => {
  const counts: Record<WorkspaceFilterTab, number> = {
    all: workspaces.length,
    pinned: 0,
    recent: 0,
    archived: 0,
  };

  for (const workspace of workspaces) {
    if (matchesWorkspaceFilterTab(workspace, 'pinned')) {
      counts.pinned += 1;
    }

    if (matchesWorkspaceFilterTab(workspace, 'recent')) {
      counts.recent += 1;
    }

    if (matchesWorkspaceFilterTab(workspace, 'archived')) {
      counts.archived += 1;
    }
  }

  return counts;
};

export const filterWorkspaces = (
  workspaces: readonly Workspace[],
  searchQuery: string,
  filterTab: WorkspaceFilterTab,
  selectedTypes: readonly WorkspaceType[],
): Workspace[] =>
  workspaces.filter(
    (workspace) =>
      matchesWorkspaceSearch(workspace, searchQuery) &&
      matchesWorkspaceFilterTab(workspace, filterTab) &&
      matchesWorkspaceTypes(workspace, selectedTypes),
  );
