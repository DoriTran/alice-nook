import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMonitor } from '@/packages/base';
import { useDiaryStore } from '@/store';

import type { SidebarRow, SidebarScope } from './sidebar.types';

import {
  addArray,
  buildRowsFromOrders,
  layoutsEqual,
  removeArray,
  rowFromDragData,
  rowsToOrders,
  swapArray,
} from './sidebarOrder.utils';

const hasSortableDropTarget = (dropTargets: { element: Element }[]) =>
  dropTargets.some((target) =>
    Boolean(target.element.getAttribute('data-sortable-group')),
  );

const cloneRows = (input: readonly SidebarRow[]): SidebarRow[] =>
  input.map((row) =>
    row.type === 'group'
      ? { ...row, chatboxIds: [...row.chatboxIds] }
      : { ...row },
  );

export const useSidebarDnD = () => {
  const { groups, orders, syncSidebarLayout } = useDiaryStore([
    'groups',
    'orders',
    'syncSidebarLayout',
  ]);

  const storeRows = useMemo(
    () => buildRowsFromOrders(orders, groups),
    [orders, groups],
  );

  const storeRowsRef = useRef(storeRows);
  const [dragRows, setDragRows] = useState<SidebarRow[] | null>(null);
  const rows = dragRows ?? storeRows;
  const rowsRef = useRef(rows);
  const persistedLayoutRef = useRef(rowsToOrders(storeRows));
  const snapshotRef = useRef<SidebarRow[] | null>(null);

  useEffect(() => {
    storeRowsRef.current = storeRows;
    if (!dragRows) {
      persistedLayoutRef.current = rowsToOrders(storeRows);
    }
  }, [storeRows, dragRows]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const updateRows = useCallback(
    (updater: (prev: SidebarRow[]) => SidebarRow[]) => {
      setDragRows((prev) => updater(prev ?? storeRowsRef.current));
    },
    [],
  );

  const swap = useCallback(
    (scope: SidebarScope, x: number, y: number) => {
      if (x === y) return;

      updateRows((prev) => {
        if (scope.type === 'list') {
          const next = swapArray(prev, x, y);
          return next === prev ? prev : [...next];
        }

        return prev.map((row) => {
          if (row.type !== 'group' || row.id !== scope.groupId) return row;

          const nextIds = swapArray(row.chatboxIds, x, y);
          if (nextIds === row.chatboxIds) return row;

          return { ...row, chatboxIds: [...nextIds] };
        });
      });
    },
    [updateRows],
  );

  const add = useCallback(
    (scope: SidebarScope, at: number, data: unknown) => {
      updateRows((prev) => {
        if (scope.type === 'list') {
          const row = rowFromDragData(data, prev);
          if (!row) return prev;

          const next = addArray(prev, at, row);
          return [...next];
        }

        const row = rowFromDragData(data, prev);
        if (!row || row.type !== 'chatbox') return prev;

        return prev.map((groupRow) => {
          if (groupRow.type !== 'group' || groupRow.id !== scope.groupId) {
            return groupRow;
          }

          const nextIds = addArray(groupRow.chatboxIds, at, row.id);
          return { ...groupRow, chatboxIds: [...nextIds] };
        });
      });
    },
    [updateRows],
  );

  const remove = useCallback(
    (scope: SidebarScope, at: number) => {
      updateRows((prev) => {
        if (scope.type === 'list') {
          const next = removeArray(prev, at);
          return next === prev ? prev : [...next];
        }

        return prev.map((row) => {
          if (row.type !== 'group' || row.id !== scope.groupId) return row;

          const nextIds = removeArray(row.chatboxIds, at);
          if (nextIds === row.chatboxIds) return row;

          return { ...row, chatboxIds: [...nextIds] };
        });
      });
    },
    [updateRows],
  );

  useMonitor({
    onDragStart: () => {
      snapshotRef.current = cloneRows(rowsRef.current);
    },
    onDrop: ({ location }) => {
      const droppedOnSortable = hasSortableDropTarget(
        location.current.dropTargets,
      );

      if (!droppedOnSortable) {
        if (snapshotRef.current) {
          setDragRows(snapshotRef.current);
        } else {
          setDragRows(null);
        }
        snapshotRef.current = null;
        return;
      }

      const nextLayout = rowsToOrders(rowsRef.current);

      if (!layoutsEqual(persistedLayoutRef.current, nextLayout)) {
        void syncSidebarLayout(nextLayout).catch(() => undefined);
        persistedLayoutRef.current = nextLayout;
      }

      setDragRows(null);
      snapshotRef.current = null;
    },
  });

  return {
    rows,
    swap,
    add,
    remove,
  };
};
