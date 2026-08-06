import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_COLOR_ID } from '@/packages/color';
import { DEFAULT_ICON_ID } from '@/packages/icon';

import type {
  Workspace,
  WorkspaceStore,
  WorkspaceSource,
  WorkspaceRecord,
  WorkspaceStoreActions,
} from './type';

import { idbStorage, nowIso } from '../helper';
import { migrateWorkspacePersistedState } from '../migrateColorId';
import { migrateWorkspaceIconState } from '../migrateIconId';
import shallow from '../shallow';
import { workspaceInitialState, workspaceDummyState } from './constants';

// #region Helpers

const ensureUnique = <T>(items: T[]) => Array.from(new Set(items));

const normalizeWorkspace = (workspace: Workspace): Workspace => ({
  ...workspace,
  pinned: workspace.pinned ?? false,
  archived: workspace.archived ?? false,
  coverImageUrl: workspace.coverImageUrl ?? null,
  tags: workspace.tags ?? [],
});

const normalizeWorkspaces = (
  workspaces: Record<string, Workspace>,
): Record<string, Workspace> =>
  Object.fromEntries(
    Object.entries(workspaces).map(([id, workspace]) => [
      id,
      normalizeWorkspace(workspace),
    ]),
  );

// #endregion

const useWorkspaceStoreBase = create<WorkspaceStore & WorkspaceStoreActions>()(
  persist(
    (set, get) => ({
      ...workspaceInitialState,

      // =====================================================
      // Workspace
      // =====================================================

      // #region Workspace

      createWorkspace: (data = {}) => {
        const id = data.id ?? `ws:${uuidv4()}`;

        const workspace: Workspace = {
          id,

          type: data.type ?? 'custom',

          name: data.name ?? '',

          description: data.description ?? '',

          icon: data.icon ?? DEFAULT_ICON_ID,

          colorId: data.colorId ?? DEFAULT_COLOR_ID,

          sourceIds: data.sourceIds ?? [],

          pinned: data.pinned ?? false,

          archived: data.archived ?? false,

          coverImageUrl: data.coverImageUrl ?? null,

          tags: data.tags ?? [],

          createdAt: nowIso(),

          updatedAt: null,
        };

        set((state) => ({
          workspaces: {
            ...state.workspaces,

            [id]: workspace,
          },

          orders: {
            ...state.orders,

            workspaceIds: [...state.orders.workspaceIds, id],
          },
        }));

        return id;
      },

      updateWorkspace: (workspaceId, data) =>
        set((state) => {
          const current = state.workspaces[workspaceId];

          if (!current) {
            return state;
          }

          return {
            workspaces: {
              ...state.workspaces,

              [workspaceId]: {
                ...current,

                ...data,

                id: workspaceId,

                updatedAt: nowIso(),
              },
            },
          };
        }),

      deleteWorkspace: (workspaceId) =>
        set((state) => {
          const {
            [workspaceId]: _removedWorkspace,

            ...workspaces
          } = state.workspaces;

          const records = {
            ...state.records,
          };

          Object.values(state.records).forEach((record) => {
            if (record.workspaceId === workspaceId) {
              delete records[record.id];
            }
          });

          return {
            workspaces,

            records,

            orders: {
              ...state.orders,

              workspaceIds: state.orders.workspaceIds.filter(
                (id) => id !== workspaceId,
              ),
            },

            ui: {
              ...state.ui,

              selectedWorkspaceId:
                state.ui.selectedWorkspaceId === workspaceId
                  ? null
                  : state.ui.selectedWorkspaceId,

              selectedRecordId:
                state.ui.selectedWorkspaceId === workspaceId
                  ? null
                  : state.ui.selectedRecordId,
            },
          };
        }),

      // #endregion

      // =====================================================
      // Source
      // =====================================================

      // #region Source

      createSource: (data) => {
        const id = data.id ?? `src:${uuidv4()}`;

        const source: WorkspaceSource = {
          ...(data as WorkspaceSource),

          id,

          createdAt: nowIso(),
        };

        set((state) => ({
          sources: {
            ...state.sources,

            [id]: source,
          },
        }));

        return id;
      },

      updateSource: (sourceId, data) =>
        set((state) => {
          const current = state.sources[sourceId];

          if (!current) {
            return state;
          }

          return {
            sources: {
              ...state.sources,

              [sourceId]: {
                ...current,

                ...data,

                id: sourceId,
              } as WorkspaceSource,
            },
          };
        }),

      deleteSource: (sourceId) =>
        set((state) => {
          const {
            [sourceId]: _removedSource,

            ...sources
          } = state.sources;

          const workspaces = Object.fromEntries(
            Object.entries(state.workspaces).map(([id, workspace]) => [
              id,
              {
                ...workspace,

                sourceIds: workspace.sourceIds.filter(
                  (currentSourceId) => currentSourceId !== sourceId,
                ),
              },
            ]),
          );

          return {
            sources,

            workspaces,
          };
        }),

      // #endregion

      // =====================================================
      // Record
      // =====================================================

      // #region Record

      createRecord: (data) => {
        const id = data.id ?? `record:${uuidv4()}`;

        const record: WorkspaceRecord = {
          ...(data as WorkspaceRecord),

          id,

          createdAt: nowIso(),

          updatedAt: null,
        };

        set((state) => ({
          records: {
            ...state.records,

            [id]: record,
          },
        }));

        return id;
      },

      updateRecord: (recordId, data) =>
        set((state) => {
          const current = state.records[recordId];

          if (!current) {
            return state;
          }

          return {
            records: {
              ...state.records,

              [recordId]: {
                ...current,

                ...data,

                id: recordId,

                updatedAt: nowIso(),
              },
            },
          };
        }),

      deleteRecord: (recordId) =>
        set((state) => {
          const {
            [recordId]: _removedRecord,

            ...records
          } = state.records;

          return {
            records,

            ui: {
              ...state.ui,

              selectedRecordId:
                state.ui.selectedRecordId === recordId
                  ? null
                  : state.ui.selectedRecordId,
            },
          };
        }),

      // #endregion

      // =====================================================
      // Orders
      // =====================================================

      // #region Orders

      updateWorkspaceOrders: (workspaceIds) =>
        set((state) => ({
          orders: {
            ...state.orders,

            workspaceIds: ensureUnique(workspaceIds),
          },
        })),

      // #endregion

      // =====================================================
      // UI
      // =====================================================

      // #region UI

      selectWorkspace: (workspaceId) =>
        set((state) => {
          const workspace = workspaceId
            ? state.workspaces[workspaceId]
            : undefined;

          return {
            ui: {
              ...state.ui,
              selectedWorkspaceId: workspaceId,
              selectedRecordId: null,
              activeToolHomeType: null,
              lastUsedWorkspaceByType: workspace
                ? {
                    ...state.ui.lastUsedWorkspaceByType,
                    [workspace.type]: workspaceId,
                  }
                : state.ui.lastUsedWorkspaceByType,
            },
          };
        }),

      selectRecord: (recordId) =>
        set((state) => ({
          ui: {
            ...state.ui,

            selectedRecordId: recordId,

            inspectorOpen: recordId ? true : state.ui.inspectorOpen,
          },
        })),

      setInspectorOpen: (open) =>
        set((state) => ({
          ui: {
            ...state.ui,

            inspectorOpen: open,
          },
        })),

      openToolHome: (type) =>
        set((state) => ({
          ui: {
            ...state.ui,
            activeToolHomeType: type,
            selectedWorkspaceId: null,
            selectedRecordId: null,
          },
        })),

      clearToolHome: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            activeToolHomeType: null,
          },
        })),

      toggleWorkspacePinned: (workspaceId) =>
        set((state) => {
          const current = state.workspaces[workspaceId];

          if (!current) {
            return state;
          }

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...current,
                pinned: !current.pinned,
                updatedAt: nowIso(),
              },
            },
          };
        }),

      toggleWorkspaceArchived: (workspaceId) =>
        set((state) => {
          const current = state.workspaces[workspaceId];

          if (!current) {
            return state;
          }

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...current,
                archived: !current.archived,
                updatedAt: nowIso(),
              },
            },
          };
        }),

      // #endregion

      // =====================================================
      // Utility
      // =====================================================

      // #region Utility

      seedIfEmpty: () => {
        const state = get();

        if (state.orders.workspaceIds.length > 0) {
          return;
        }

        set(() => ({
          ...workspaceDummyState,
        }));
      },

      reset: () =>
        set(() => ({
          ...workspaceInitialState,
        })),

      // #endregion
    }),
    {
      name: 'dear-diary-workspace',

      storage: idbStorage,

      partialize: (state) => ({
        workspaces: state.workspaces,

        sources: state.sources,

        records: state.records,

        orders: state.orders,

        ui: state.ui,
      }),

      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<WorkspaceStore> | undefined;
        const merged = {
          ...currentState,
          ...persisted,
          workspaces: normalizeWorkspaces({
            ...currentState.workspaces,
            ...persisted?.workspaces,
          }),
          ui: {
            ...currentState.ui,
            ...persisted?.ui,
            activeToolHomeType:
              persisted?.ui?.activeToolHomeType ??
              currentState.ui.activeToolHomeType,
          },
          orders: {
            ...currentState.orders,
            ...persisted?.orders,
          },
        };

        return migrateWorkspaceIconState(
          migrateWorkspacePersistedState(merged),
        );
      },
    },
  ),
);

export const useWorkspaceStore = shallow(useWorkspaceStoreBase);

export const useWorkspaceHydrated = () => {
  const [hydrated, setHydrated] = useState(() =>
    useWorkspaceStoreBase.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useWorkspaceStoreBase.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useWorkspaceStoreBase.persist.hasHydrated());

    return unsub;
  }, []);

  return hydrated;
};
