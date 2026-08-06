import type { ColorId, CustomPalette } from '@/packages/color';
import type { IconId } from '@/packages/icon';
import type { AppMode } from '@/store/app/type';
import type { Chatbox } from '@/store/diary/type';
import type {
  RecordSource,
  SchedulerEventPayload,
  Workspace,
  WorkspaceRecord,
  WorkspaceSource,
  WorkspaceType,
} from '@/store/workspace/type';

import { DEFAULT_COLOR_ID, getAppMode, resolvePalette } from '@/packages/color';

export const WORKSPACE_LOCAL_SOURCE_COLOR_ID = DEFAULT_COLOR_ID;

export const WORKSPACE_LOCAL_SOURCE_LABEL = 'Workspace Data';

export const WORKSPACE_TYPE_LABELS: Record<WorkspaceType, string> = {
  scheduler: 'Scheduler',
  analytics: 'Analytics',
  tracker: 'Tracker',
  kanban: 'Kanban',
  habit: 'Habit',
  finance: 'Finance',
  custom: 'Custom',
};

export const WORKSPACE_TYPE_ORDER: WorkspaceType[] = [
  'scheduler',
  'analytics',
  'tracker',
  'kanban',
  'habit',
  'finance',
  'custom',
];

export type WorkspaceTypeMeta = {
  type: WorkspaceType;
  label: string;
  subtitle: string;
  icon: IconId;
  colorId: ColorId;
};

export const WORKSPACE_TYPE_META: Record<WorkspaceType, WorkspaceTypeMeta> = {
  scheduler: {
    type: 'scheduler',
    label: 'Scheduler',
    subtitle: 'Plan your time, events, and important tasks.',
    icon: 'Calendar',
    colorId: 'violet',
  },
  analytics: {
    type: 'analytics',
    label: 'Analytics',
    subtitle: 'Track trends, progress, and insights over time.',
    icon: 'ChartColumn',
    colorId: 'mint',
  },
  tracker: {
    type: 'tracker',
    label: 'Tracker',
    subtitle: 'Follow reading, media, and personal progress lists.',
    icon: 'ListChecks',
    colorId: 'azure',
  },
  kanban: {
    type: 'kanban',
    label: 'Kanban',
    subtitle: 'Organize work across boards and columns.',
    icon: 'Columns3',
    colorId: 'sky',
  },
  habit: {
    type: 'habit',
    label: 'Habit',
    subtitle: 'Build routines and keep your streaks going.',
    icon: 'Sprout',
    colorId: 'rose',
  },
  finance: {
    type: 'finance',
    label: 'Finance',
    subtitle: 'Watch spending, budgets, and savings goals.',
    icon: 'Wallet',
    colorId: 'peach',
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    subtitle: 'Build your own workspace for anything you need.',
    icon: 'Dices',
    colorId: 'lilac',
  },
};

export const QUICK_ACCESS_WORKSPACE_IDS = [
  'ws:daily-work',
  'ws:study-progress',
  'ws:habit-tracker',
] as const;

export type WorkspaceCardPill = {
  label: string;
  color: string;
  kind: 'source' | 'tag';
};

export type RecordSourceMeta = {
  label: string;
  color: string;
};

export type WorkspacesByType = {
  type: WorkspaceType;
  label: string;
  workspaces: Workspace[];
};

export const getWorkspaceSources = (
  workspace: Workspace | undefined,
  sources: Record<string, WorkspaceSource>,
): WorkspaceSource[] => {
  if (!workspace) {
    return [];
  }

  return workspace.sourceIds
    .map((sourceId) => sources[sourceId])
    .filter((source): source is WorkspaceSource => Boolean(source));
};

export const getWorkspaceRecords = (
  workspaceId: string | null | undefined,
  records: Record<string, WorkspaceRecord>,
): WorkspaceRecord[] => {
  if (!workspaceId) {
    return [];
  }

  return Object.values(records).filter(
    (record) => record.workspaceId === workspaceId,
  );
};

export const groupWorkspacesByType = (
  workspaces: Record<string, Workspace>,
  workspaceIds: string[],
): WorkspacesByType[] => {
  const grouped = new Map<WorkspaceType, Workspace[]>();

  workspaceIds.forEach((workspaceId) => {
    const workspace = workspaces[workspaceId];

    if (!workspace) {
      return;
    }

    const current = grouped.get(workspace.type) ?? [];

    grouped.set(workspace.type, [...current, workspace]);
  });

  return WORKSPACE_TYPE_ORDER.filter((type) => grouped.has(type)).map(
    (type) => ({
      type,
      label: WORKSPACE_TYPE_LABELS[type],
      workspaces: grouped.get(type) ?? [],
    }),
  );
};

export const getRecentWorkspaces = (
  workspaces: Record<string, Workspace>,
  workspaceIds: string[],
  limit = 3,
): Workspace[] => {
  return workspaceIds
    .map((id) => workspaces[id])
    .filter((workspace): workspace is Workspace => Boolean(workspace))
    .slice(0, limit);
};

export const resolveWorkspaceForToolType = (
  type: WorkspaceType,
  workspaces: Record<string, Workspace>,
  workspaceIds: string[],
  lastUsedByType: Partial<Record<WorkspaceType, string>>,
): string | null => {
  const lastUsedId = lastUsedByType[type];

  if (lastUsedId && workspaces[lastUsedId]?.type === type) {
    return lastUsedId;
  }

  return workspaceIds.find((id) => workspaces[id]?.type === type) ?? null;
};

const resolveEntityMainColor = (
  colorId: string | undefined,
  mode: AppMode = getAppMode(),
  customPalettes: Record<string, CustomPalette> = {},
): string => {
  if (!colorId) {
    return resolvePalette(DEFAULT_COLOR_ID, mode, customPalettes).main;
  }

  return resolvePalette(colorId as ColorId, mode, customPalettes).main;
};

export const resolveRecordSourceMeta = (
  source: RecordSource,
  sources: WorkspaceSource[],
  chatboxes: Record<string, Chatbox>,
  mode: AppMode = getAppMode(),
  customPalettes: Record<string, CustomPalette> = {},
): RecordSourceMeta => {
  if (source.type === 'local') {
    return {
      label: WORKSPACE_LOCAL_SOURCE_LABEL,
      color: resolveEntityMainColor(
        WORKSPACE_LOCAL_SOURCE_COLOR_ID,
        mode,
        customPalettes,
      ),
    };
  }

  if (source.type === 'chatbox') {
    const chatboxSource = sources.find(
      (item) => item.type === 'chatbox' && item.chatboxId === source.chatboxId,
    );

    const chatbox = chatboxes[source.chatboxId];

    return {
      label: chatboxSource?.label ?? chatbox?.name ?? 'Chatbox',
      color: resolveEntityMainColor(chatbox?.colorId, mode, customPalettes),
    };
  }

  if (source.type === 'message') {
    return {
      label: 'Message',
      color: resolvePalette('navy', mode, customPalettes).main,
    };
  }

  return {
    label: 'Workspace',
    color: resolvePalette('navy', mode, customPalettes).main,
  };
};

export const resolveSourceChipMeta = (
  source: WorkspaceSource,
  chatboxes: Record<string, Chatbox>,
  mode: AppMode = getAppMode(),
  customPalettes: Record<string, CustomPalette> = {},
): RecordSourceMeta => {
  if (source.type === 'chatbox') {
    const chatbox = chatboxes[source.chatboxId];

    return {
      label: source.label,
      color: resolveEntityMainColor(chatbox?.colorId, mode, customPalettes),
    };
  }

  return {
    label: source.label,
    color: resolvePalette('navy', mode, customPalettes).main,
  };
};

export const isSchedulerEventRecord = (
  record: WorkspaceRecord,
): record is WorkspaceRecord & { payload: SchedulerEventPayload } => {
  return record.type === 'scheduler-event';
};

export const getSchedulerPayload = (
  record: WorkspaceRecord,
): SchedulerEventPayload | null => {
  if (!isSchedulerEventRecord(record)) {
    return null;
  }

  return record.payload;
};

export const countRecordsBySource = (
  records: WorkspaceRecord[],
  sources: WorkspaceSource[],
): { source: WorkspaceSource; count: number }[] => {
  return sources.map((source) => {
    const count = records.filter((record) => {
      if (source.type === 'chatbox' && record.source.type === 'chatbox') {
        return record.source.chatboxId === source.chatboxId;
      }

      return false;
    }).length;

    return { source, count };
  });
};

export const countWorkspacesByType = (
  workspaces: Record<string, Workspace>,
  workspaceIds: string[],
): Record<WorkspaceType, number> => {
  const counts = Object.fromEntries(
    WORKSPACE_TYPE_ORDER.map((type) => [type, 0]),
  ) as Record<WorkspaceType, number>;

  workspaceIds.forEach((workspaceId) => {
    const workspace = workspaces[workspaceId];

    if (!workspace) {
      return;
    }

    counts[workspace.type] += 1;
  });

  return counts;
};

export const getWorkspacesOfType = (
  workspaces: Record<string, Workspace>,
  workspaceIds: string[],
  type: WorkspaceType,
): Workspace[] =>
  workspaceIds
    .map((id) => workspaces[id])
    .filter(
      (workspace): workspace is Workspace =>
        Boolean(workspace) && workspace.type === type,
    );

export const resolveWorkspaceCoverStyle = (
  workspace: Workspace,
  mode: AppMode = getAppMode(),
  customPalettes: Record<string, CustomPalette> = {},
): { backgroundImage?: string; backgroundColor: string } => {
  if (workspace.coverImageUrl) {
    return {
      backgroundImage: `url(${workspace.coverImageUrl})`,
      backgroundColor: 'transparent',
    };
  }

  const main = resolvePalette(workspace.colorId, mode, customPalettes).main;

  return {
    backgroundColor: `color-mix(in srgb, ${main} 25%, transparent)`,
  };
};

export const resolveWorkspaceCardPills = (
  workspace: Workspace,
  sources: Record<string, WorkspaceSource>,
  chatboxes: Record<string, Chatbox>,
  mode: AppMode = getAppMode(),
  customPalettes: Record<string, CustomPalette> = {},
): WorkspaceCardPill[] => {
  const sourcePills = getWorkspaceSources(workspace, sources).map((source) => {
    const meta = resolveSourceChipMeta(source, chatboxes, mode, customPalettes);

    return {
      label: meta.label,
      color: meta.color,
      kind: 'source' as const,
    };
  });

  const tagPills = workspace.tags.map((tag) => ({
    label: tag.startsWith('#') ? tag : `#${tag}`,
    color: resolvePalette(workspace.colorId, mode, customPalettes).main,
    kind: 'tag' as const,
  }));

  return [...sourcePills, ...tagPills];
};

export const formatWorkspaceUpdatedLabel = (
  workspace: Workspace,
  now = new Date(),
): string => {
  const iso = workspace.updatedAt ?? workspace.createdAt;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return 'Updated recently';
  }

  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());

  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  if (dayDiff <= 0) {
    return 'Updated today';
  }

  if (dayDiff === 1) {
    return 'Updated yesterday';
  }

  if (dayDiff < 7) {
    return `Updated ${dayDiff} days ago`;
  }

  return `Updated ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
};
