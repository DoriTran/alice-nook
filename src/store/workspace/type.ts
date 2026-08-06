// ======================================================
// Workspace
// ======================================================

export type WorkspaceType =
  | 'scheduler'
  | 'analytics'
  | 'tracker'
  | 'kanban'
  | 'habit'
  | 'finance'
  | 'custom';

import type { ColorId } from '@/packages/color';

export type Workspace = {
  id: string;

  type: WorkspaceType;

  name: string;

  description: string;

  icon: string;

  colorId: ColorId;

  sourceIds: string[];

  pinned: boolean;

  archived: boolean;

  coverImageUrl: string | null;

  tags: string[];

  createdAt: string;

  updatedAt: string | null;
};

// ======================================================
// Sources
// ======================================================

export type WorkspaceSource =
  | ChatboxSource
  | MessageSource
  | TagSource
  | WorkspaceSourceReference;

export type WorkspaceSourceBase = {
  id: string;

  label: string;

  createdAt: string;
};

export type ChatboxSource = WorkspaceSourceBase & {
  type: 'chatbox';

  chatboxId: string;
};

export type MessageSource = WorkspaceSourceBase & {
  type: 'message';

  messageId: string;
};

export type TagSource = WorkspaceSourceBase & {
  type: 'tag';

  tagId: string;
};

export type WorkspaceSourceReference = WorkspaceSourceBase & {
  type: 'workspace';

  workspaceId: string;
};

// ======================================================
// Records
// ======================================================

export type WorkspaceRecord = {
  id: string;

  workspaceId: string;

  type: string;

  source: RecordSource;

  payload: unknown;

  createdAt: string;

  updatedAt: string | null;
};

export type RecordSource =
  | LocalRecordSource
  | ChatboxRecordSource
  | MessageRecordSource
  | WorkspaceRecordSource;

export type LocalRecordSource = {
  type: 'local';
};

export type ChatboxRecordSource = {
  type: 'chatbox';

  chatboxId: string;
};

export type MessageRecordSource = {
  type: 'message';

  messageId: string;
};

export type WorkspaceRecordSource = {
  type: 'workspace';

  workspaceId: string;

  recordId: string;
};

// ======================================================
// Scheduler Payloads
// ======================================================

export type SchedulerEventPayload = {
  title: string;

  description?: string;

  startDate: string;

  endDate: string;

  allDay: boolean;

  tags?: string[];

  notes?: string;

  linkedMessageIds?: string[];
};

// ======================================================
// Analytics Payloads
// ======================================================

export type AnalyticsMetricPayload = {
  label: string;

  value: number;
};

// ======================================================
// Tracker Payloads
// ======================================================

export type TrackerItemPayload = {
  title: string;

  completed: boolean;
};

// ======================================================
// Kanban Payloads
// ======================================================

export type KanbanCardPayload = {
  title: string;

  description?: string;

  columnId: string;
};

// ======================================================
// Habit Payloads
// ======================================================

export type HabitEntryPayload = {
  title: string;

  date: string;

  completed: boolean;
};

// ======================================================
// UI
// ======================================================

export type WorkspaceUIState = {
  selectedWorkspaceId: string | null;

  selectedRecordId: string | null;

  inspectorOpen: boolean;

  activeToolHomeType: WorkspaceType | null;

  lastUsedWorkspaceByType: Partial<Record<WorkspaceType, string>>;
};

// ======================================================
// Orders
// ======================================================

export type WorkspaceOrders = {
  workspaceIds: string[];
};

// ======================================================
// Store
// ======================================================

export type WorkspaceStore = {
  workspaces: Record<string, Workspace>;

  sources: Record<string, WorkspaceSource>;

  records: Record<string, WorkspaceRecord>;

  orders: WorkspaceOrders;

  ui: WorkspaceUIState;
};

// ======================================================
// Actions
// ======================================================

export type WorkspaceStoreActions = {
  // Workspace

  createWorkspace: (data?: Partial<Workspace>) => string;

  updateWorkspace: (workspaceId: string, data: Partial<Workspace>) => void;

  deleteWorkspace: (workspaceId: string) => void;

  // Source

  createSource: (data: Partial<WorkspaceSource>) => string;

  updateSource: (sourceId: string, data: Partial<WorkspaceSource>) => void;

  deleteSource: (sourceId: string) => void;

  // Record

  createRecord: (data: Partial<WorkspaceRecord>) => string;

  updateRecord: (recordId: string, data: Partial<WorkspaceRecord>) => void;

  deleteRecord: (recordId: string) => void;

  // Orders

  updateWorkspaceOrders: (workspaceIds: string[]) => void;

  // UI

  selectWorkspace: (workspaceId: string | null) => void;

  selectRecord: (recordId: string | null) => void;

  setInspectorOpen: (open: boolean) => void;

  openToolHome: (type: WorkspaceType) => void;

  clearToolHome: () => void;

  toggleWorkspacePinned: (workspaceId: string) => void;

  toggleWorkspaceArchived: (workspaceId: string) => void;

  // Utility

  seedIfEmpty: () => void;

  reset: () => void;
};
