import type { ChatboxData, DiaryFilterTab, GroupData } from '../types';
import type { SidebarRowView } from './useSidebarRowViews';

const RECENT_DAYS = 7;

type FilterableChatbox = {
  pinned: boolean;
  archived: boolean;
  lastMessageAt: string | null;
  createdAt: string;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const hasActiveSidebarQuery = (
  searchQuery: string,
  filterTab: DiaryFilterTab,
): boolean => searchQuery.trim() !== '' || filterTab !== 'all';

export const matchesSearch = (chatbox: ChatboxData, query: string): boolean => {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return true;
  }

  return [chatbox.name, chatbox.description, chatbox.preview].some((value) =>
    value.toLowerCase().includes(normalized),
  );
};

export const matchesFilterTab = (
  chatbox: FilterableChatbox,
  filterTab: DiaryFilterTab,
): boolean => {
  if (filterTab === 'all') {
    return true;
  }

  if (filterTab === 'pinned') {
    return chatbox.pinned;
  }

  if (filterTab === 'archived') {
    return chatbox.archived;
  }

  const activityAt = chatbox.lastMessageAt ?? chatbox.createdAt;
  const activityTime = new Date(activityAt).getTime();
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  return activityTime >= cutoff;
};

export const countChatboxesByFilterTab = (
  chatboxes: readonly FilterableChatbox[],
): Record<DiaryFilterTab, number> => {
  const counts: Record<DiaryFilterTab, number> = {
    all: chatboxes.length,
    pinned: 0,
    recent: 0,
    archived: 0,
  };

  for (const chatbox of chatboxes) {
    if (matchesFilterTab(chatbox, 'pinned')) {
      counts.pinned += 1;
    }

    if (matchesFilterTab(chatbox, 'recent')) {
      counts.recent += 1;
    }

    if (matchesFilterTab(chatbox, 'archived')) {
      counts.archived += 1;
    }
  }

  return counts;
};

export const matchesSidebarQuery = (
  chatbox: ChatboxData,
  searchQuery: string,
  filterTab: DiaryFilterTab,
): boolean => {
  return (
    matchesSearch(chatbox, searchQuery) && matchesFilterTab(chatbox, filterTab)
  );
};

const filterGroupData = (
  group: GroupData,
  searchQuery: string,
  filterTab: DiaryFilterTab,
): GroupData | null => {
  const chatboxes = group.chatboxes.filter((chatbox) =>
    matchesSidebarQuery(chatbox, searchQuery, filterTab),
  );

  if (chatboxes.length === 0) {
    return null;
  }

  return {
    ...group,
    chatboxes,
  };
};

export const filterSidebarViews = (
  views: readonly SidebarRowView[],
  searchQuery: string,
  filterTab: DiaryFilterTab,
): SidebarRowView[] => {
  if (!hasActiveSidebarQuery(searchQuery, filterTab)) {
    return [...views];
  }

  return views
    .map((view): SidebarRowView | null => {
      if (view.type === 'chatbox') {
        return matchesSidebarQuery(view.data, searchQuery, filterTab)
          ? view
          : null;
      }

      const filteredGroup = filterGroupData(view.data, searchQuery, filterTab);

      if (!filteredGroup) {
        return null;
      }

      return {
        ...view,
        data: filteredGroup,
      };
    })
    .filter((view): view is SidebarRowView => view !== null);
};

export const getMatchingGroupIds = (
  views: readonly SidebarRowView[],
  searchQuery: string,
): string[] => {
  const normalized = normalizeQuery(searchQuery);

  if (!normalized) {
    return [];
  }

  return views
    .filter((view) => view.type === 'group')
    .filter((view) =>
      view.data.chatboxes.some((chatbox) =>
        matchesSearch(chatbox, searchQuery),
      ),
    )
    .map((view) => view.data.id);
};
